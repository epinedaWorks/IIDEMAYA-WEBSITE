import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authConfig, type TokenSesion } from "./auth.config";
import { borrarIntentos, huella, intentosEn, ipDe, registrarIntento } from "./rate-limit";

// Máximo de intentos fallidos dentro de la ventana. Por correo frena la
// adivinación de una contraseña; por IP frena el probar muchos correos.
const MAX_FALLOS_POR_CORREO = 5;
const MAX_FALLOS_POR_IP = 20;
const VENTANA_BLOQUEO_MS = 15 * 60 * 1000;

// Hash de relleno (no es de nadie): cuando el correo no existe se compara
// contra este, para que "no existe" tarde lo mismo que "contraseña
// incorrecta" y no se pueda averiguar qué correos tienen cuenta.
const HASH_RELLENO = "$2b$12$ORfNztXyZ2TGwwy.DJ2BuuF8yLqDU1Umf8id5xowwEEK6oRUgTeWe";

class DemasiadosIntentos extends CredentialsSignin {
  code = "demasiados_intentos";
}

// Configuración completa (la que usan páginas, acciones y APIs, que corren
// en Node y sí pueden consultar la base de datos).
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credenciales",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials, request) {
        const correoCrudo = credentials?.email;
        const password = credentials?.password;
        if (typeof correoCrudo !== "string" || typeof password !== "string") return null;

        const email = correoCrudo.trim().toLowerCase().slice(0, 254);
        const ip = ipDe(request.headers);
        const claveCorreo = `login:c:${huella(email)}`;
        const claveIp = `login:i:${ip}`;

        // El bloqueo cuenta también correos que no existen, así no revela
        // cuáles son cuentas reales.
        const fallosCorreo = await intentosEn(claveCorreo, VENTANA_BLOQUEO_MS);
        const fallosIp = await intentosEn(claveIp, VENTANA_BLOQUEO_MS);
        if (fallosCorreo >= MAX_FALLOS_POR_CORREO || fallosIp >= MAX_FALLOS_POR_IP) {
          console.warn("[seguridad] inicio de sesión bloqueado por demasiados intentos", { ip });
          throw new DemasiadosIntentos();
        }

        const user = await prisma.adminUser.findFirst({
          where: { email: { equals: email, mode: "insensitive" } },
        });

        // bcrypt solo mira los primeros 72 bytes; se acota para no gastar CPU
        // con entradas enormes.
        const valido = await bcrypt.compare(password.slice(0, 200), user?.passwordHash ?? HASH_RELLENO);
        if (!user || !valido) {
          await registrarIntento(claveCorreo);
          await registrarIntento(claveIp);
          console.warn("[seguridad] inicio de sesión fallido", { ip });
          return null;
        }

        await borrarIntentos(claveCorreo);
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt(args) {
      // Primero los controles que no usan base de datos (hora de inicio y
      // tope absoluto), los mismos que aplica el middleware.
      const token = await authConfig.callbacks.jwt(args);
      if (!token || args.user) return token;

      // La cuenta debe seguir existiendo, y la sesión no puede ser anterior
      // al último cambio de contraseña.
      const t = token as typeof token & TokenSesion;
      const admin = await prisma.adminUser.findUnique({
        where: { id: t.sub },
        select: { passwordChangedAt: true },
      });
      if (!admin) return null;
      if (admin.passwordChangedAt && admin.passwordChangedAt.getTime() > (t.loginAt ?? 0)) {
        return null;
      }

      return token;
    },
  },
});
