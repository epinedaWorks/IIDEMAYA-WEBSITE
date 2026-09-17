// Crea (o resetea la contraseña de) las cuentas admin del panel.
// Genera contraseñas aleatorias fuertes y las imprime UNA sola vez en la
// terminal — nunca se guardan en texto plano, solo su hash en la base.
//
// Uso: node scripts/seed-admins.mjs correo1@dominio.com correo2@dominio.com

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const prisma = new PrismaClient();

function generarPassword() {
  // 20 caracteres en base64url — alta entropía, sin caracteres ambiguos como / o +.
  return crypto.randomBytes(15).toString("base64url");
}

async function main() {
  const correos = process.argv.slice(2);
  if (correos.length === 0) {
    console.error("Uso: node scripts/seed-admins.mjs correo1@dominio.com correo2@dominio.com");
    process.exit(1);
  }

  for (const email of correos) {
    const password = generarPassword();
    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.adminUser.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, passwordHash },
    });

    console.log(`\n${email}`);
    console.log(`  contraseña: ${password}`);
  }

  console.log("\nGuarda estas contraseñas en un gestor de contraseñas — no se muestran de nuevo.");
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
