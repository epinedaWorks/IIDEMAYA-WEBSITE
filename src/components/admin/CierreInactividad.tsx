"use client";

import { useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { INACTIVIDAD_SEGUNDOS } from "@/lib/sesion-config";

const EVENTOS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"] as const;
const RENOVAR_CADA_MS = 5 * 60 * 1000;

// Cierra la sesión si la persona deja la pantalla sin tocar. Mientras hay
// actividad, renueva la sesión del servidor cada pocos minutos: sin eso,
// alguien escribiendo un comentario largo (sin hacer peticiones) la
// perdería a mitad de camino.
export default function CierreInactividad() {
  const ultimaActividad = useRef(0);
  const ultimaRenovacion = useRef(0);

  useEffect(() => {
    ultimaActividad.current = Date.now();
    ultimaRenovacion.current = Date.now();

    const alActividad = () => {
      ultimaActividad.current = Date.now();
    };
    EVENTOS.forEach((e) => window.addEventListener(e, alActividad, { passive: true }));

    const revisar = setInterval(() => {
      const ahora = Date.now();

      if (ahora - ultimaActividad.current >= INACTIVIDAD_SEGUNDOS * 1000) {
        signOut({ callbackUrl: "/admin/login?msg=inactividad" });
        return;
      }

      const huboActividadReciente = ahora - ultimaActividad.current < RENOVAR_CADA_MS;
      if (huboActividadReciente && ahora - ultimaRenovacion.current >= RENOVAR_CADA_MS) {
        ultimaRenovacion.current = ahora;
        fetch("/api/auth/session", { cache: "no-store" }).catch(() => undefined);
      }
    }, 30 * 1000);

    return () => {
      clearInterval(revisar);
      EVENTOS.forEach((e) => window.removeEventListener(e, alActividad));
    };
  }, []);

  return null;
}
