import { PrismaClient } from "@prisma/client";

// Netlify DB inyecta la cadena de conexión como NETLIFY_DB_URL en runtime
// (no aparece en `netlify env:list`, es un env var interno de la
// plataforma). Prisma solo sabe leer DATABASE_URL (definido en
// prisma/schema.prisma), así que la copiamos aquí si hace falta.
if (!process.env.DATABASE_URL && process.env.NETLIFY_DB_URL) {
  process.env.DATABASE_URL = process.env.NETLIFY_DB_URL;
}

// Evita crear un cliente nuevo en cada hot-reload en desarrollo.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
