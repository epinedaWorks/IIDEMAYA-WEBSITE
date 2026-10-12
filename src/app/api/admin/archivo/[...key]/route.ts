import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { MIME_POR_TIPO, nombreArchivoSeguro, obtenerArchivoPostulacion, type TipoArchivo } from "@/lib/uploads";

// Las keys las genera el sistema ("cv/<uuid>.pdf"); cualquier otra forma
// (rutas con "..", otros prefijos) se rechaza sin tocar el almacén.
const KEY_VALIDA = /^(cv|documento)\/[A-Za-z0-9-]{36}(\.[A-Za-z0-9]{1,5})?$/;

export async function GET(_req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { key } = await ctx.params;
  const blobKey = key.join("/");
  if (!KEY_VALIDA.test(blobKey)) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const archivo = await obtenerArchivoPostulacion(blobKey);
  if (!archivo) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const nombre = nombreArchivoSeguro(
    (archivo.metadata?.nombreOriginal as string) || blobKey.split("/").pop() || "archivo"
  );
  // El tipo sale de la extensión de la key (la fija el sistema), no de lo
  // que declaró quien subió el archivo.
  const extension = blobKey.split(".").pop()?.toLowerCase() as TipoArchivo | undefined;
  const tipo = (extension && MIME_POR_TIPO[extension]) || "application/octet-stream";
  const respaldoAscii = nombre.replace(/[^\x20-\x7e]/g, "_");

  return new NextResponse(archivo.data, {
    headers: {
      "Content-Type": tipo,
      "Content-Disposition": `attachment; filename="${respaldoAscii}"; filename*=UTF-8''${encodeURIComponent(nombre)}`,
      // Que el navegador nunca "adivine" otro tipo ni ejecute nada del archivo.
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      // Nunca cachear un archivo de un candidato en un CDN/proxy compartido.
      "Cache-Control": "private, no-store",
    },
  });
}
