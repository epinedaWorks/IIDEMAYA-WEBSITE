"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { eliminarArchivoPostulacion } from "@/lib/uploads";

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

const ESTADOS_VALIDOS = new Set(["NUEVA", "EN_REVISION", "ENTREVISTA", "RECHAZADA", "CONTRATADA"]);

export async function cambiarEstado(postulacionId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");

  const estado = String(formData.get("estado") || "");
  if (!ESTADOS_VALIDOS.has(estado)) return;

  await prisma.postulacion.update({
    where: { id: postulacionId },
    data: { estado: estado as never },
  });

  revalidatePath(`/admin/postulaciones/${postulacionId}`);
  revalidatePath("/admin");
}

export async function eliminarPostulacion(postulacionId: string) {
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
  redirect("/admin");
}
