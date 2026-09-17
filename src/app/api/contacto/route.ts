import { NextResponse } from "next/server";
import { sendContactEmail } from "@/lib/email";

const CORREO_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const { nombre, correo, mensaje } = (body ?? {}) as Record<string, unknown>;

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
