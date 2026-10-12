import type { NextAuthConfig } from "next-auth";
import { INACTIVIDAD_SEGUNDOS, SESION_MAXIMA_MS } from "./sesion-config";

// Parte de la configuración de sesión que NO toca la base de datos. Es la
// única que puede cargar el middleware (corre en un entorno "edge" donde
// Prisma no funciona). La configuración completa, con el inicio de sesión y
// las comprobaciones contra la base de datos, está en auth.ts.
export type TokenSesion = { loginAt?: number; sub?: string };

export const authConfig = {
  // Netlify no es Vercel: sin esto, NextAuth v5 rechaza el host en
  // producción ("UntrustedHost"). Confiamos porque el dominio ya está fijo
  // (iidemaya.org.gt / el subdominio de Netlify), no es un valor abierto.
  trustHost: true,
  // Sesión por JWT. La cookie se renueva con cada petición, así que
  // maxAge equivale a "tiempo de inactividad": sin actividad, se cierra.
  session: { strategy: "jwt", maxAge: INACTIVIDAD_SEGUNDOS },
  pages: { signIn: "/admin/login" },
  providers: [],
  callbacks: {
    // Corre cada vez que se lee la sesión. Devolver null la invalida.
    async jwt({ token, user }) {
      const t = token as typeof token & TokenSesion;

      // Recién ingresó: se marca la hora de inicio para el tope absoluto.
      if (user) {
        t.loginAt = Date.now();
        return t;
      }

      // Sesiones sin hora de inicio (anteriores a este control) o que ya
      // pasaron el tope absoluto: hay que volver a ingresar.
      if (!t.loginAt || Date.now() - t.loginAt > SESION_MAXIMA_MS || !t.sub) return null;

      return t;
    },
  },
} satisfies NextAuthConfig;
