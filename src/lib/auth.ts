import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Netlify no es Vercel: sin esto, NextAuth v5 rechaza el host en
  // producción ("UntrustedHost"). Confiamos porque el dominio ya está fijo
  // (iidemaya.org.gt / el subdominio de Netlify), no es un valor abierto.
  trustHost: true,
  // Sesión por JWT, 7 días. Es un panel admin: una sesión olvidada en un
  // equipo ajeno debe caducar pronto, no seguir viva por 30 días.
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      name: "Credenciales",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== "string" || typeof password !== "string") return null;

        const user = await prisma.adminUser.findUnique({ where: { email } });
        if (!user) return null;

        const valido = await bcrypt.compare(password, user.passwordHash);
        if (!valido) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
});
