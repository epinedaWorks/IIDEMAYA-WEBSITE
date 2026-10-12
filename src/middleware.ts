import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

// El middleware corre en un entorno edge donde Prisma no funciona, así que
// usa solo la configuración sin base de datos: verifica que la sesión sea
// válida, no haya caducado por inactividad ni pasado el tope absoluto. La
// comprobación completa (cuenta vigente, cambio de contraseña) la hace
// auth() en cada página, acción y API del panel.
const { auth } = NextAuth(authConfig);

// Quien ya tiene sesión y abre /admin/login se manda a /admin desde la propia
// página de login (que sí hace la comprobación completa): hacerlo aquí
// provocaría un bucle con sesiones que este middleware aún ve como válidas
// pero que la base de datos ya revocó.
export default auth((req) => {
  const estaAutenticado = Boolean(req.auth);
  const esLogin = req.nextUrl.pathname === "/admin/login";

  if (!estaAutenticado && !esLogin) {
    return NextResponse.redirect(new URL("/admin/login", req.nextUrl));
  }
});

export const config = { matcher: ["/admin/:path*"] };
