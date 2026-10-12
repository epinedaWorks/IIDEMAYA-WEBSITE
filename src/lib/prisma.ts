import { PrismaClient } from "@prisma/client";

// Netlify DB inyecta la cadena de conexión como NETLIFY_DB_URL en runtime
// (no aparece en `netlify env:list`, es un env var interno de la
// plataforma). Prisma solo sabe leer DATABASE_URL (definido en
// prisma/schema.prisma), así que la copiamos aquí si hace falta.
if (!process.env.DATABASE_URL && process.env.NETLIFY_DB_URL) {
  process.env.DATABASE_URL = process.env.NETLIFY_DB_URL;
}

// Un solo cliente por proceso: en desarrollo evita uno nuevo en cada
// hot-reload, y en producción evita que cada bloque de código del servidor
// abra su propio conjunto de conexiones a la base de datos.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

globalForPrisma.prisma = prisma;
