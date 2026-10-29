import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generarPdfPostulacion } from "@/lib/postulacion-pdf";

// Sin parámetros se descarga; con `?ver=1` el navegador lo muestra en pantalla.
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
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

  const disposicion = new URL(req.url).searchParams.get("ver") === "1" ? "inline" : "attachment";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposicion}; filename="postulacion-${nombreArchivo}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
