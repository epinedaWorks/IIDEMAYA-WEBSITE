import { getStore } from "@netlify/blobs";

export type TipoArchivo = "pdf" | "doc" | "docx";
export type ValidacionArchivo = { ok: true; tipo: TipoArchivo } | { ok: false; error: string };

const TAMANO_MAXIMO_BYTES = 8 * 1024 * 1024; // 8 MB — de sobra para un PDF con diseño/fotos

export const MIME_POR_TIPO: Record<TipoArchivo, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const EXTENSIONES_PERMITIDAS = new Set<string>(["pdf", "doc", "docx"]);

// Nombre de archivo apto para guardar y devolver en una cabecera: sin
// separadores de ruta, comillas ni caracteres de control.
export function nombreArchivoSeguro(nombre: string, porDefecto = "archivo"): string {
  const limpio = nombre
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f"\\/:*?<>|;]/g, "_")
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 150);
  return limpio || porDefecto;
}

// Identifica el archivo por su CONTENIDO (los primeros bytes), no por el
// nombre ni por el tipo que declara el navegador, que cualquiera puede
// falsear.
function detectarTipo(bytes: Uint8Array): TipoArchivo | null {
  const inicio = (...firma: number[]) => firma.every((b, i) => bytes[i] === b);

  // PDF: "%PDF-" al principio (la especificación tolera algo de basura antes).
  const cabecera = new TextDecoder("latin1").decode(bytes.subarray(0, 1024));
  if (cabecera.includes("%PDF-")) return "pdf";

  // Word 97-2003 (.doc): contenedor OLE.
  if (inicio(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1)) return "doc";
  // Word moderno (.docx): es un ZIP.
  if (inicio(0x50, 0x4b, 0x03, 0x04)) return "docx";
  // Algunos .doc en realidad son RTF.
  if (inicio(0x7b, 0x5c, 0x72, 0x74, 0x66)) return "doc";

  return null;
}

const familia = (t: string) => (t === "pdf" ? "pdf" : "word");

async function validarArchivo(
  file: File
): Promise<ValidacionArchivo & { datos?: ArrayBuffer }> {
  if (!file || file.size === 0) {
    return { ok: false, error: "El archivo está vacío o no se pudo leer." };
  }
  if (file.size > TAMANO_MAXIMO_BYTES) {
    return { ok: false, error: "El archivo pesa demasiado (máximo 8 MB)." };
  }

  const extension = file.name.includes(".") ? file.name.split(".").pop()!.toLowerCase() : "";
  if (!EXTENSIONES_PERMITIDAS.has(extension)) {
    return { ok: false, error: "Solo se aceptan archivos PDF o Word (.pdf, .doc, .docx)." };
  }

  const datos = await file.arrayBuffer();
  const tipo = detectarTipo(new Uint8Array(datos, 0, Math.min(datos.byteLength, 1024)));
  if (!tipo) {
    return { ok: false, error: "El archivo no es un PDF o Word válido." };
  }
  // Un .pdf debe ser PDF; un .doc o .docx puede ser cualquiera de los dos
  // formatos de Word (es común guardar uno con la extensión del otro).
  if (familia(tipo) !== familia(extension)) {
    return { ok: false, error: "El contenido del archivo no coincide con su extensión." };
  }

  return { ok: true, tipo, datos };
}

// Genera una key única y guarda el archivo en el store "postulaciones" de
// Netlify Blobs. Lanza si la validación falla (el caller decide cómo
// responderle a quien llenó el formulario).
export async function guardarArchivoPostulacion(
  file: File,
  prefijo: "cv" | "documento"
): Promise<string> {
  const validacion = await validarArchivo(file);
  if (!validacion.ok || !validacion.datos) {
    throw new Error(validacion.ok ? "No se pudo leer el archivo." : validacion.error);
  }

  const store = getStore("postulaciones");
  // La extensión sale del contenido detectado, nunca del nombre que mandó el
  // navegador.
  const key = `${prefijo}/${crypto.randomUUID()}.${validacion.tipo}`;

  await store.set(key, validacion.datos, {
    metadata: {
      nombreOriginal: nombreArchivoSeguro(file.name),
      tipo: MIME_POR_TIPO[validacion.tipo],
    },
  });

  return key;
}

// Para el panel admin: recupera un archivo guardado por su key.
export async function obtenerArchivoPostulacion(key: string) {
  const store = getStore("postulaciones");
  return store.getWithMetadata(key, { type: "arrayBuffer" });
}

// Al eliminar una postulación, para no dejar archivos huérfanos en el store.
export async function eliminarArchivoPostulacion(key: string) {
  const store = getStore("postulaciones");
  await store.delete(key);
}
