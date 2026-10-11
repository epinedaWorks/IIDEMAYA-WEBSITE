"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { eliminarArchivoPostulacion } from "@/lib/uploads";
import { esEstado } from "@/lib/postulacion-estados";
import { generarYGuardarResumen, iaConfigurada } from "@/lib/resumen-ia";

export async function agregarComentario(postulacionId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("No autenticado");

  const texto = String(formData.get("texto") || "").trim().slice(0, 4000);
  if (!texto) return;

  const admin = await prisma.adminUser.findUnique({ where: { email: session.user.email } });
  if (!admin) throw new Error("No autenticado");

  await prisma.comentario.create({
    data: { texto, postulacionId, adminId: admin.id },
  });

  revalidatePath(`/admin/postulaciones/${postulacionId}`);
}

// Se llama en cuanto se elige un estado en la lista (sin botón de guardar).
export async function cambiarEstado(
  postulacionId: string,
  estado: string
): Promise<{ ok: boolean }> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  if (!esEstado(estado)) return { ok: false };

  try {
    await prisma.postulacion.update({ where: { id: postulacionId }, data: { estado } });
  } catch (err) {
    console.error("[postulacion] no se pudo cambiar el estado:", err);
    return { ok: false };
  }

  revalidatePath(`/admin/postulaciones/${postulacionId}`);
  revalidatePath("/admin");
  return { ok: true };
}

// Genera (o vuelve a generar) el resumen con IA de una postulación.
export async function generarResumenIA(
  postulacionId: string
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");

  if (!iaConfigurada()) {
    return { ok: false, error: "La IA no está configurada (falta ANTHROPIC_API_KEY)." };
  }

  const postulacion = await prisma.postulacion.findUnique({ where: { id: postulacionId } });
  if (!postulacion) return { ok: false, error: "La postulación ya no existe." };

  const resumen = await generarYGuardarResumen(postulacion);
  if (!resumen) return { ok: false, error: "No se pudo generar el resumen. Intenta de nuevo." };

  revalidatePath(`/admin/postulaciones/${postulacionId}`);
  revalidatePath("/admin");
  return { ok: true };
}

// redirigir=false: desde la lista se queda en la misma página (y conserva
// los filtros); desde el detalle vuelve a la lista.
export async function eliminarPostulacion(postulacionId: string, redirigir = true) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");

  const postulacion = await prisma.postulacion.findUnique({
    where: { id: postulacionId },
    select: { cvBlobKey: true, documentoBlobKey: true },
  });
  if (!postulacion) return;

  // Los comentarios se borran en cascada (onDelete: Cascade en el schema).
  await prisma.postulacion.delete({ where: { id: postulacionId } });

  // No dejar los archivos huérfanos en el store — si alguno falla no
  // revertimos el borrado del registro, solo queda registrado en logs.
  await Promise.all([
    eliminarArchivoPostulacion(postulacion.cvBlobKey).catch((err) =>
      console.error("[postulacion] no se pudo borrar el CV:", err)
    ),
    postulacion.documentoBlobKey
      ? eliminarArchivoPostulacion(postulacion.documentoBlobKey).catch((err) =>
          console.error("[postulacion] no se pudo borrar el documento:", err)
        )
      : Promise.resolve(),
  ]);

  revalidatePath("/admin");
  if (redirigir) redirect("/admin");
}
