import { NextResponse } from "next/server";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Bootstrap de un solo uso para crear las cuentas admin iniciales en
// producción (el CLI de Netlify no da acceso directo a la base real, solo a
// una réplica local efímera). Requiere SETUP_SECRET y se niega a correr si
// ya existe algún AdminUser — así no puede usarse para resetear cuentas por
// accidente ni repetirse. Bórrala del código una vez usada.
export async function POST(req: Request) {
  const secretEsperado = process.env.SETUP_SECRET;
  if (!secretEsperado) {
    return NextResponse.json({ error: "SETUP_SECRET no configurado." }, { status: 500 });
  }

  const secretRecibido = req.headers.get("x-setup-secret");
  if (secretRecibido !== secretEsperado) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const yaExiste = await prisma.adminUser.count();
  if (yaExiste > 0) {
    return NextResponse.json(
      { error: "Ya existen cuentas admin — esta ruta solo corre una vez." },
      { status: 409 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const emails: unknown = body.emails;
  if (!Array.isArray(emails) || emails.length === 0) {
    return NextResponse.json({ error: "Falta 'emails' (arreglo de correos)." }, { status: 400 });
  }

  const creados: { email: string; password: string }[] = [];
  for (const email of emails) {
    if (typeof email !== "string" || !email.includes("@")) continue;
    const password = crypto.randomBytes(15).toString("base64url");
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.adminUser.create({ data: { email, passwordHash } });
    creados.push({ email, password });
  }

  return NextResponse.json({ creados });
}
