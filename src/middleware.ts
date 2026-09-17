import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const estaAutenticado = Boolean(req.auth);
  const esLogin = req.nextUrl.pathname === "/admin/login";

  if (!estaAutenticado && !esLogin) {
    return NextResponse.redirect(new URL("/admin/login", req.nextUrl));
  }
  if (estaAutenticado && esLogin) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl));
  }
});

export const config = { matcher: ["/admin/:path*"] };
