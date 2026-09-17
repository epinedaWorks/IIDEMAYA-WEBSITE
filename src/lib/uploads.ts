import { getStore } from "@netlify/blobs";

export type ValidacionArchivo = { ok: true } | { ok: false; error: string };

const TAMANO_MAXIMO_BYTES = 8 * 1024 * 1024; // 8 MB — de sobra para un PDF con diseño/fotos

const TIPOS_PERMITIDOS: Record<string, string[]> = {
  "application/pdf": ["pdf"],
  "application/msword": ["doc"],
  "application/vnd.openxmlformats-officedocument.wordformat.document": ["docx"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
};

const EXTENSIONES_PERMITIDAS = new Set(["pdf", "doc", "docx"]);

// El MIME type que manda el navegador no siempre es confiable (algunos
// mandan "" o "application/octet-stream" para .doc), así que se acepta el
// archivo si CUALQUIERA de los dos (tipo declarado o extensión del nombre)
// coincide con lo permitido — no se exige que ambos coincidan entre sí.
function validarArchivo(file: File): ValidacionArchivo {
  if (!file || file.size === 0) {
    return { ok: false, error: "El archivo está vacío o no se pudo leer." };
  }

  if (file.size > TAMANO_MAXIMO_BYTES) {
    return { ok: false, error: "El archivo pesa demasiado (máximo 8 MB)." };
  }

  const extension = file.name.includes(".")
    ? file.name.split(".").pop()!.toLowerCase()
    : "";

  const tipoConocido = Boolean(TIPOS_PERMITIDOS[file.type]);
  const extensionConocida = EXTENSIONES_PERMITIDAS.has(extension);

  if (!tipoConocido && !extensionConocida) {
    return {
      ok: false,
      error: "Solo se aceptan archivos PDF o Word (.pdf, .doc, .docx).",
    };
  }

  return { ok: true };
}

// Genera una key única y guarda el archivo en el store "postulaciones" de
// Netlify Blobs. Lanza si la validación falla (el caller decide cómo
// responderle a quien llenó el formulario).
export async function guardarArchivoPostulacion(
  file: File,
  prefijo: "cv" | "documento"
): Promise<string> {
  const validacion = validarArchivo(file);
  if (!validacion.ok) {
    throw new Error(validacion.error);
  }

  const store = getStore("postulaciones");
  const extension = file.name.includes(".") ? file.name.split(".").pop() : "";
  const key = `${prefijo}/${crypto.randomUUID()}${extension ? `.${extension}` : ""}`;

  await store.set(key, await file.arrayBuffer(), {
    metadata: { nombreOriginal: file.name, tipo: file.type },
  });

  return key;
}

// Para el panel admin: recupera un archivo guardado por su key.
export async function obtenerArchivoPostulacion(key: string) {
  const store = getStore("postulaciones");
  return store.getWithMetadata(key, { type: "arrayBuffer" });
}
