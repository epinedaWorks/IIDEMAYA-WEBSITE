import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardarArchivoPostulacion } from "@/lib/uploads";
import { sendPostulacionEmails } from "@/lib/email";
import { listarVacantesActivas } from "@/lib/vacantes";
import { generarYGuardarResumen } from "@/lib/resumen-ia";
import { huella, ipDe, permitir } from "@/lib/rate-limit";
import { CAMPO_TRAMPA } from "@/lib/anti-bots";
import { VACANTE_GENERAL } from "@/lib/vacantes-const";
import { ANTICIPACION_MIN, asegurarToken } from "@/lib/entrevistas";
import {
  PREGUNTAS_TEXTO,
  PREGUNTA_DIA_NO_DISPONIBLE,
  PREGUNTAS_SI_NO,
  OPCIONES_MODALIDAD,
} from "@/lib/postulacion-preguntas";

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Solo dígitos, espacios y + - ( ), con al menos 7 caracteres.
const TELEFONO_RE = /^[0-9+()\-\s]{7,20}$/;
const MODALIDADES_VALIDAS = new Set(OPCIONES_MODALIDAD.map((o) => o.value));

function texto(form: FormData, key: string, maxLen = 4000): string | null {
  const v = form.get(key);
  if (typeof v !== "string") return null;
  const limpio = v.trim();
  return limpio ? limpio.slice(0, maxLen) : null;
}

function siNo(form: FormData, key: string): boolean | null {
  const v = form.get(key);
  if (v === "si") return true;
  if (v === "no") return false;
  return null;
}

// Dos archivos de hasta 8 MB cada uno, más los textos.
const MAX_BYTES = 18 * 1024 * 1024;

export async function POST(req: Request) {
  const tamano = Number(req.headers.get("content-length") || 0);
  if (tamano > MAX_BYTES) {
    return NextResponse.json({ error: "Los archivos pesan demasiado." }, { status: 413 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "No se pudo leer el formulario." }, { status: 400 });
  }

  // Campo trampa: las personas no lo ven; los bots lo llenan. Se responde
  // "ok" sin guardar ni enviar nada.
  if (texto(form, CAMPO_TRAMPA, 100)) {
    return NextResponse.json({ ok: true });
  }

  const nombre = texto(form, "nombre", 200);
  const correo = texto(form, "correo", 200);
  const confirmCorreo = texto(form, "confirmCorreo", 200);
  const telefono = texto(form, "telefono", 20);
  const direccion = texto(form, "direccion", 300);

  if (!nombre || !correo || !CORREO_RE.test(correo)) {
    return NextResponse.json({ error: "Revisa tu nombre y correo." }, { status: 400 });
  }
  if (!confirmCorreo || confirmCorreo.toLowerCase() !== correo.toLowerCase()) {
    return NextResponse.json({ error: "El correo y su confirmación no coinciden." }, { status: 400 });
  }
  if (!telefono || !TELEFONO_RE.test(telefono)) {
    return NextResponse.json({ error: "Revisa tu número de teléfono." }, { status: 400 });
  }
  if (!direccion || direccion.length < 5) {
    return NextResponse.json({ error: "Indica la dirección donde vives." }, { status: 400 });
  }


  // Preguntas de entrevista (todas requeridas salvo "día no disponible").
  const respuestas: Record<string, string> = {};
  for (const p of PREGUNTAS_TEXTO) {
    const valor = texto(form, p.key);
    if (!valor) {
      return NextResponse.json(
        { error: "Por favor responde todas las preguntas del cuestionario." },
        { status: 400 }
      );
    }
    respuestas[p.key] = valor;
  }
  const diaNoDisponible = texto(form, PREGUNTA_DIA_NO_DISPONIBLE.key, 200);

  const modalidadTrabajo = form.get("modalidadTrabajo");
  if (typeof modalidadTrabajo !== "string" || !MODALIDADES_VALIDAS.has(modalidadTrabajo as never)) {
    return NextResponse.json({ error: "Selecciona una modalidad de trabajo." }, { status: 400 });
  }

  const siNoValores: Record<string, boolean> = {};
  for (const p of PREGUNTAS_SI_NO) {
    const valor = siNo(form, p.key);
    if (valor === null) {
      return NextResponse.json(
        { error: "Por favor responde todas las preguntas de sí/no." },
        { status: 400 }
      );
    }
    siNoValores[p.key] = valor;
  }

  // Posición: solo se exige si hay vacantes activas (el formulario muestra
  // la lista únicamente en ese caso). "general" = sin posición específica.
  let vacanteId: string | null = null;
  let vacanteTitulo: string | null = null;
  const vacantesActivas = await listarVacantesActivas();
  if (vacantesActivas.length > 0) {
    const seleccion = form.get("vacanteId");
    if (typeof seleccion !== "string" || !seleccion) {
      return NextResponse.json({ error: "Selecciona la posición a la que aplicas." }, { status: 400 });
    }
    if (seleccion !== VACANTE_GENERAL) {
      const vacante = vacantesActivas.find((v) => v.id === seleccion);
      if (!vacante) {
        return NextResponse.json(
          { error: "La posición seleccionada ya no está disponible. Recarga la página y elige otra." },
          { status: 400 }
        );
      }
      vacanteId = vacante.id;
      vacanteTitulo = vacante.titulo;
    }
  }

  // Ya con el formulario completo y válido: cada envío guarda archivos y
  // manda correos (también a la dirección que escribe quien postula), así
  // que se limita por IP y por correo. Va después de validar los campos para
  // que un error de llenado no le gaste intentos a una persona real.
  const ip = ipDe(req.headers);
  const permitido =
    (await permitir(`talento:i:${ip}`, 10, 60 * 60 * 1000)) &&
    (await permitir(`talento:c:${huella(correo)}`, 5, 24 * 60 * 60 * 1000));
  if (!permitido) {
    return NextResponse.json(
      {
        error:
          "Ya recibimos varias postulaciones desde tu conexión o con este correo. Si necesitas corregir algo, escríbenos desde la página de contacto.",
      },
      { status: 429 }
    );
  }

  const cvFile = form.get("cv");
  if (!(cvFile instanceof File) || cvFile.size === 0) {
    return NextResponse.json({ error: "Adjunta tu CV." }, { status: 400 });
  }
  const documentoFile = form.get("documento");

  let cvBlobKey: string;
  let documentoBlobKey: string | undefined;
  try {
    cvBlobKey = await guardarArchivoPostulacion(cvFile, "cv");
    if (documentoFile instanceof File && documentoFile.size > 0) {
      documentoBlobKey = await guardarArchivoPostulacion(documentoFile, "documento");
    }
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : "No se pudo subir el archivo.";
    return NextResponse.json({ error: mensaje }, { status: 400 });
  }

  const postulacion = await prisma.postulacion.create({
    data: {
      nombre,
      correo,
      telefono,
      direccion,
      opinionSociedad: respuestas.opinionSociedad,
      opinionPoblacionMaya: respuestas.opinionPoblacionMaya,
      comodidadTrabajarConPoblacionMaya: respuestas.comodidadTrabajarConPoblacionMaya,
      opinionFormaPensarActuarMaya: respuestas.opinionFormaPensarActuarMaya,
      opinionCulturaMaya: respuestas.opinionCulturaMaya,
      opinionCosmovisionMaya: respuestas.opinionCosmovisionMaya,
      disposicionCeremoniaMaya: respuestas.disposicionCeremoniaMaya,
      disponibilidadTiempo: respuestas.disponibilidadTiempo,
      disponibilidadHorario: respuestas.disponibilidadHorario,
      diaNoDisponible,
      trabajoBajoPresion: respuestas.trabajoBajoPresion,
      porQueEstaOrganizacion: respuestas.porQueEstaOrganizacion,
      etapaCarrera: respuestas.etapaCarrera,
      porQueContratarlo: respuestas.porQueContratarlo,
      expectativaSalarial: respuestas.expectativaSalarial,
      modalidadTrabajo: modalidadTrabajo as never,
      puedeFacturar: siNoValores.puedeFacturar,
      tieneVehiculo: siNoValores.tieneVehiculo,
      esEstudianteActual: siNoValores.esEstudianteActual,
      trabajaActualmente: siNoValores.trabajaActualmente,
      cvBlobKey,
      documentoBlobKey,
      vacanteId,
      vacanteTitulo,
    },
  });

  // En paralelo para no sumar espera: ninguna de las dos lanza error, y si
  // el resumen falla se puede generar después desde el panel.
  await Promise.all([sendPostulacionEmails(postulacion), generarYGuardarResumen(postulacion)]);

  // Si el equipo ya habilitó horarios, se le ofrece a la persona agendar de
  // una vez (el enlace es el mismo que recibirá por invitación). Si algo
  // falla aquí, la postulación ya quedó guardada: solo no se ofrece.
  let agendaUrl: string | undefined;
  try {
    const hayHorarios = await prisma.franjaEntrevista.count({
      where: { postulacionId: null, invitadoId: null, inicio: { gt: new Date(Date.now() + ANTICIPACION_MIN * 60_000) } },
    });
    if (hayHorarios > 0) agendaUrl = `/entrevista/${await asegurarToken(postulacion.id)}`;
  } catch (err) {
    console.error("[talento] no se pudo preparar el enlace de entrevista:", err);
  }

  return NextResponse.json({ ok: true, agendaUrl });
}
