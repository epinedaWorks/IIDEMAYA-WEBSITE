import type { MetadataRoute } from "next";

// El panel, la API y el formulario de postulación no deben indexarse.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/talento"] }],
  };
}
