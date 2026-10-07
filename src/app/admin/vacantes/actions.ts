"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";

// Una viñeta por línea; se quitan viñetas/guiones que alguien pegue a mano.
function lineas(valor: FormDataEntryValue | null): string[] {
  return String(valor ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim().replace(/^[-•*]\s*/, ""))
    .filter(Boolean)
    .slice(0, 30)
    .map((l) => l.slice(0, 400));
}

function leerFormulario(formData: FormData) {
  const titulo = String(formData.get("titulo") ?? "").trim().slice(0, 150);
  const resumen = String(formData.get("resumen") ?? "").trim().slice(0, 1500);
  const modalidad = String(formData.get("modalidad") ?? "").trim().slice(0, 400);
  if (!titulo || !resumen || !modalidad) return null;

  const ordenCrudo = String(formData.get("orden") ?? "").trim();
  const orden = ordenCrudo === "" ? null : Number.parseInt(ordenCrudo, 10);

  return {
    titulo,
    resumen,
    modalidad,
    funciones: lineas(formData.get("funciones")),
    requisitos: lineas(formData.get("requisitos")),
    activa: formData.get("activa") === "on",
    orden: orden !== null && Number.isFinite(orden) ? orden : null,
  };
}

function refrescarPaginas() {
  revalidatePath("/vacantes");
  revalidatePath("/talento");
  revalidatePath("/admin/vacantes");
}

export async function crearVacante(formData: FormData) {
  await requireAdminSession();

  const datos = leerFormulario(formData);
  if (!datos) redirect("/admin/vacantes/nueva?error=1");

  // Sin número de orden, la nueva vacante va al final de la lista.
  let { orden } = datos;
  if (orden === null) {
    const ultima = await prisma.vacante.aggregate({ _max: { orden: true } });
    orden = (ultima._max.orden ?? 0) + 1;
  }

  await prisma.vacante.create({ data: { ...datos, orden } });

  refrescarPaginas();
  redirect("/admin/vacantes?msg=creada");
}

export async function actualizarVacante(id: string, formData: FormData) {
  await requireAdminSession();

  const datos = leerFormulario(formData);
  if (!datos) redirect(`/admin/vacantes/${id}?error=1`);

  const { orden, ...resto } = datos;
  await prisma.vacante.update({
    where: { id },
    data: { ...resto, ...(orden !== null ? { orden } : {}) },
  });

  refrescarPaginas();
  redirect("/admin/vacantes?msg=guardada");
}

export async function alternarVacante(id: string) {
  await requireAdminSession();

  const vacante = await prisma.vacante.findUnique({ where: { id }, select: { activa: true } });
  if (!vacante) return;

  await prisma.vacante.update({ where: { id }, data: { activa: !vacante.activa } });
  refrescarPaginas();
}
