import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/email";
import { huella, ipDe, permitir } from "@/lib/rate-limit";
import { CAMPO_TRAMPA } from "@/lib/anti-bots";

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BYTES = 20_000; // el formulario real pesa menos de 6 KB

export async function POST(req: Request) {
  const tamano = Number(req.headers.get("content-length") || 0);
  if (tamano > MAX_BYTES) {
    return NextResponse.json({ error: "El mensaje es demasiado grande." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const datos = (body ?? {}) as Record<string, unknown>;
  const { nombre, correo, mensaje } = datos;

  // Campo trampa: las personas no lo ven ni lo llenan; los bots sí. Se
  // responde "ok" para no darles pista de que fueron detectados.
  const trampa = datos[CAMPO_TRAMPA];
  if (typeof trampa === "string" && trampa.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  if (
    typeof nombre !== "string" ||
    typeof correo !== "string" ||
    typeof mensaje !== "string" ||
    !nombre.trim() ||
    !mensaje.trim() ||
    !CORREO_RE.test(correo.trim())
  ) {
    return NextResponse.json({ error: "Revisa los datos del formulario." }, { status: 400 });
  }

  // Sin esto, el formulario sirve para llenar de correos a cualquiera (la
  // confirmación sale a la dirección que escriba quien envía) y para gastar
  // el cupo de envíos.
  const ip = ipDe(req.headers);
  const permitido =
    (await permitir(`contacto:i:${ip}`, 5, 10 * 60 * 1000)) &&
    (await permitir(`contacto:c:${huella(correo)}`, 3, 60 * 60 * 1000));
  if (!permitido) {
    return NextResponse.json(
      { error: "Has enviado varios mensajes seguidos. Espera unos minutos e inténtalo de nuevo." },
      { status: 429 }
    );
  }

  const resultado = await sendContactEmail({
    nombre: nombre.trim().slice(0, 200),
    correo: correo.trim().slice(0, 200),
    mensaje: mensaje.trim().slice(0, 5000),
  });

  if (!resultado.ok) {
    return NextResponse.json(
      { error: "No se pudo enviar el mensaje. Intenta de nuevo en un momento." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
