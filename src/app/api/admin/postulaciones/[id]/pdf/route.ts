import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generarPdfPostulacion } from "@/lib/postulacion-pdf";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const postulacion = await prisma.postulacion.findUnique({ where: { id } });
  if (!postulacion) {
    return NextResponse.json({ error: "No encontrada" }, { status: 404 });
  }

  const buffer = await generarPdfPostulacion(postulacion);
  const nombreArchivo = postulacion.nombre.replace(/[^a-z0-9]+/gi, "-").toLowerCase();

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="postulacion-${nombreArchivo}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
