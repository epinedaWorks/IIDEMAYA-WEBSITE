import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { obtenerArchivoPostulacion } from "@/lib/uploads";

export async function GET(_req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { key } = await ctx.params;
  const blobKey = key.join("/");

  const archivo = await obtenerArchivoPostulacion(blobKey);
  if (!archivo) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const nombreOriginal = (archivo.metadata?.nombreOriginal as string) || blobKey.split("/").pop();
  const tipo = (archivo.metadata?.tipo as string) || "application/octet-stream";

  return new NextResponse(archivo.data, {
    headers: {
      "Content-Type": tipo,
      "Content-Disposition": `attachment; filename="${nombreOriginal}"`,
      // Nunca cachear un archivo de un candidato en un CDN/proxy compartido.
      "Cache-Control": "private, no-store",
    },
  });
}
