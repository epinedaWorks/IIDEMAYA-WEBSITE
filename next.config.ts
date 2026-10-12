import type { NextConfig } from "next";

const esProduccion = process.env.NODE_ENV === "production";

// Política de contenido: solo se carga lo que sale del propio sitio. Next.js
// necesita 'unsafe-inline' en scripts y estilos para su hidratación; en
// desarrollo además hace falta 'unsafe-eval' (recarga en caliente), por eso
// ahí no se aplica la política.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const CABECERAS_GENERALES = [
  // Nadie puede incrustar el sitio en otra página (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  ...(esProduccion ? [{ key: "Content-Security-Policy", value: CSP }] : []),
];

// Panel y archivos de postulantes: ni buscadores ni cachés intermedias.
const CABECERAS_PRIVADAS = [
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
];

const nextConfig: NextConfig = {
  // No anunciar con qué tecnología está hecho el sitio.
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: CABECERAS_GENERALES },
      { source: "/admin/:path*", headers: CABECERAS_PRIVADAS },
      { source: "/api/admin/:path*", headers: CABECERAS_PRIVADAS },
    ];
  },
};

export default nextConfig;
