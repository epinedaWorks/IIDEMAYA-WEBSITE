"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import { asegurarToken, nuevoToken, planificarFranjas } from "@/lib/entrevistas";
import { sendEntrevistaLiberada, sendInvitacionEntrevista, sendInvitacionesEntrevista } from "@/lib/email";

function refrescar(postulacionId?: string) {
  revalidatePath("/admin/entrevistas");
  revalidatePath("/admin");
  if (postulacionId) revalidatePath(`/admin/postulaciones/${postulacionId}`);
}

// Crea los horarios que se pueden reservar. Los que se empalman con uno que
// ya existe se omiten (así volver a enviar el mismo formulario no duplica).
export async function crearFranjas(formData: FormData) {
  await requireAdminSession();

  const plan = planificarFranjas({
    desde: String(formData.get("desde") ?? ""),
    hasta: String(formData.get("hasta") ?? ""),
    horaInicio: String(formData.get("horaInicio") ?? ""),
    horaFin: String(formData.get("horaFin") ?? ""),
    duracion: Number.parseInt(String(formData.get("duracion") ?? ""), 10),
    conFinDeSemana: formData.get("finDeSemana") === "on",
  });
  if (!plan.ok) redirect(`/admin/entrevistas?error=${encodeURIComponent(plan.error)}`);

  const detalle = String(formData.get("detalle") ?? "").trim().slice(0, 500) || null;

  const primero = plan.franjas[0].inicio;
  const ultimo = plan.franjas[plan.franjas.length - 1].fin;
  const existentes = await prisma.franjaEntrevista.findMany({
    where: { inicio: { lt: ultimo }, fin: { gt: primero } },
    select: { inicio: true, fin: true },
  });
  const nuevas = plan.franjas.filter(
    (f) => !existentes.some((e) => e.inicio < f.fin && e.fin > f.inicio)
  );

  if (nuevas.length > 0) {
    await prisma.franjaEntrevista.createMany({
      data: nuevas.map((f) => ({ inicio: f.inicio, fin: f.fin, detalle })),
    });
  }

  refrescar();
  redirect(`/admin/entrevistas?msg=creadas&n=${nuevas.length}&o=${plan.franjas.length - nuevas.length}`);
}

// Solo se pueden quitar horarios libres; uno reservado se libera primero.
export async function eliminarFranja(franjaId: string) {
  await requireAdminSession();
  await prisma.franjaEntrevista.deleteMany({ where: { id: franjaId, postulacionId: null, invitadoId: null } });
  refrescar();
}

// Quita la reserva (por ejemplo, el equipo no puede ese día) y le avisa a la
// persona con el enlace para elegir otro horario.
export async function liberarFranja(franjaId: string) {
  await requireAdminSession();

  const franja = await prisma.franjaEntrevista.findUnique({
    where: { id: franjaId },
    include: { postulacion: true, invitado: true },
  });
  const persona = franja?.postulacion ?? franja?.invitado;
  if (!franja || !persona) return;

  await prisma.franjaEntrevista.update({
    where: { id: franjaId },
    data: { postulacionId: null, invitadoId: null, reservadaAt: null },
  });

  const token = franja.postulacion ? await asegurarToken(franja.postulacion.id) : franja.invitado!.token;
  const r = await sendEntrevistaLiberada(persona, franja, token);

  refrescar(franja.postulacion?.id);
  redirect(`/admin/entrevistas?msg=${r.ok ? "liberada" : "liberada_sin_correo"}`);
}

// Invitación a una sola persona (desde el detalle de su postulación).
export async function invitarPostulacion(
  postulacionId: string
): Promise<{ ok: boolean; error?: string }> {
  await requireAdminSession();

  const p = await prisma.postulacion.findUnique({
    where: { id: postulacionId },
    select: { id: true, nombre: true, correo: true, vacanteTitulo: true },
  });
  if (!p) return { ok: false, error: "La postulación ya no existe." };

  const token = await asegurarToken(p.id);
  const r = await sendInvitacionEntrevista(p, token);
  if (!r.ok) return { ok: false, error: "No se pudo enviar el correo. Intenta de nuevo." };

  await prisma.postulacion.update({ where: { id: p.id }, data: { entrevistaInvitadaAt: new Date() } });
  refrescar(p.id);
  return { ok: true };
}

type Destino = {
  clave: string; // "p:<id>" postulación, "i:<id>" invitado
  nombre: string;
  correo: string;
  vacanteTitulo: string | null;
  token: string;
  invitado: boolean;
};

// Envía las invitaciones y marca la fecha solo a quienes sí salieron.
async function enviarYMarcar(destinos: Destino[]) {
  const { enviados, fallidos } = await sendInvitacionesEntrevista(
    destinos.map((d) => ({ ...d, id: d.clave }))
  );
  const ahora = new Date();
  const de = (prefijo: string) =>
    enviados.filter((c) => c.startsWith(prefijo)).map((c) => c.slice(2));

  const idsPostulaciones = de("p:");
  const idsInvitados = de("i:");
  if (idsPostulaciones.length) {
    await prisma.postulacion.updateMany({
      where: { id: { in: idsPostulaciones } },
      data: { entrevistaInvitadaAt: ahora },
    });
  }
  if (idsInvitados.length) {
    await prisma.invitadoEntrevista.updateMany({
      where: { id: { in: idsInvitados } },
      data: { invitadaAt: ahora },
    });
  }
  return { enviados: enviados.length, fallidos: fallidos.length };
}

// Invitación a varias personas a la vez (casillas de /admin/entrevistas). Cada
// valor es "p:<id>" (postulante) o "i:<id>" (invitado a mano).
export async function invitarVarias(formData: FormData) {
  await requireAdminSession();

  const claves = [...new Set(formData.getAll("ids").map(String))].slice(0, 300);
  if (claves.length === 0) redirect("/admin/entrevistas?error=" + encodeURIComponent("No elegiste a nadie."));

  const idsDe = (prefijo: string) => claves.filter((c) => c.startsWith(prefijo)).map((c) => c.slice(2));

  const [postulaciones, invitados] = await Promise.all([
    prisma.postulacion.findMany({
      where: { id: { in: idsDe("p:") } },
      select: { id: true, nombre: true, correo: true, vacanteTitulo: true },
    }),
    prisma.invitadoEntrevista.findMany({ where: { id: { in: idsDe("i:") } } }),
  ]);

  const destinos: Destino[] = [
    ...(await Promise.all(
      postulaciones.map(async (p) => ({
        clave: `p:${p.id}`,
        nombre: p.nombre,
        correo: p.correo,
        vacanteTitulo: p.vacanteTitulo,
        token: await asegurarToken(p.id),
        invitado: false,
      }))
    )),
    ...invitados.map((i) => ({
      clave: `i:${i.id}`,
      nombre: i.nombre,
      correo: i.correo,
      vacanteTitulo: null,
      token: i.token,
      invitado: true,
    })),
  ];

  const r = await enviarYMarcar(destinos);
  refrescar();
  redirect(`/admin/entrevistas?msg=invitadas&n=${r.enviados}&f=${r.fallidos}`);
}

const CORREO_EN_LINEA = /[^\s<>,;"']+@[^\s<>,;"']+\.[^\s<>,;"']+/;

// Invitar a gente que no postuló: una persona por línea, "Nombre, correo" (el
// nombre es opcional). Si el correo ya pertenece a una postulación, se usa esa
// postulación en lugar de crear un invitado aparte.
export async function invitarManual(formData: FormData) {
  await requireAdminSession();

  const lineas = String(formData.get("lista") ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 100);

  const vistos = new Set<string>();
  const personas: { nombre: string; correo: string }[] = [];
  let invalidas = 0;
  for (const linea of lineas) {
    const correo = linea.match(CORREO_EN_LINEA)?.[0]?.toLowerCase();
    if (!correo || correo.length > 200) {
      invalidas++;
      continue;
    }
    if (vistos.has(correo)) continue;
    vistos.add(correo);
    const nombre = linea
      .replace(CORREO_EN_LINEA, "")
      .replace(/[<>,;"']/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 100);
    personas.push({ nombre, correo });
  }
  if (personas.length === 0) {
    redirect("/admin/entrevistas?error=" + encodeURIComponent("No encontré ningún correo válido en la lista."));
  }

  const destinos: Destino[] = [];
  let yaPostularon = 0;
  for (const { nombre, correo } of personas) {
    const postulacion = await prisma.postulacion.findFirst({
      where: { correo: { equals: correo, mode: "insensitive" } },
      select: { id: true, nombre: true, correo: true, vacanteTitulo: true },
    });
    if (postulacion) {
      yaPostularon++;
      destinos.push({
        clave: `p:${postulacion.id}`,
        nombre: postulacion.nombre,
        correo: postulacion.correo,
        vacanteTitulo: postulacion.vacanteTitulo,
        token: await asegurarToken(postulacion.id),
        invitado: false,
      });
      continue;
    }
    // Si la persona ya había sido invitada antes se conserva su enlace (el de
    // un correo anterior sigue sirviendo) y solo se completa el nombre si faltaba.
    const existente = await prisma.invitadoEntrevista.findUnique({ where: { correo } });
    const invitado = existente
      ? existente.nombre || !nombre
        ? existente
        : await prisma.invitadoEntrevista.update({ where: { id: existente.id }, data: { nombre } })
      : await prisma.invitadoEntrevista.create({ data: { nombre, correo, token: nuevoToken() } });
    destinos.push({
      clave: `i:${invitado.id}`,
      nombre: invitado.nombre,
      correo: invitado.correo,
      vacanteTitulo: null,
      token: invitado.token,
      invitado: true,
    });
  }

  const r = await enviarYMarcar(destinos);
  refrescar();
  redirect(
    `/admin/entrevistas?msg=manual&n=${r.enviados}&f=${r.fallidos}&x=${invalidas}&p=${yaPostularon}`
  );
}

// Quita a una persona invitada a mano de la lista. Si tenía un horario
// reservado, ese horario vuelve a quedar libre.
export async function eliminarInvitado(invitadoId: string) {
  await requireAdminSession();
  await prisma.invitadoEntrevista.deleteMany({ where: { id: invitadoId } });
  refrescar();
}
