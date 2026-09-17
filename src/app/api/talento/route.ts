import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardarArchivoPostulacion } from "@/lib/uploads";
import { sendPostulacionEmails } from "@/lib/email";
import {
  PREGUNTAS_TEXTO,
  PREGUNTA_DIA_NO_DISPONIBLE,
  PREGUNTAS_SI_NO,
  OPCIONES_MODALIDAD,
} from "@/lib/postulacion-preguntas";

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "No se pudo leer el formulario." }, { status: 400 });
  }

  const nombre = texto(form, "nombre", 200);
  const correo = texto(form, "correo", 200);
  const telefono = texto(form, "telefono", 50); // opcional

  if (!nombre || !correo || !CORREO_RE.test(correo)) {
    return NextResponse.json({ error: "Revisa tu nombre y correo." }, { status: 400 });
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
    },
  });

  await sendPostulacionEmails({ id: postulacion.id, nombre, correo });

  return NextResponse.json({ ok: true });
}
