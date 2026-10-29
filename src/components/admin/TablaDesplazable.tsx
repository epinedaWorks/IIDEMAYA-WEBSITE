"use client";

import { useEffect, useRef } from "react";

// Caja de la tabla con su propio scroll vertical y horizontal. Su alto llega
// justo hasta el borde inferior de la ventana, así la barra horizontal queda
// siempre a la vista en vez de al final de toda la página.
export default function TablaDesplazable({ children }: { children: React.ReactNode }) {
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ajustar = () => {
      const el = caja.current;
      if (!el) return;
      const arriba = el.getBoundingClientRect().top + window.scrollY;
      el.style.maxHeight = `${Math.max(320, window.innerHeight - arriba - 16)}px`;
    };
    ajustar();
    window.addEventListener("resize", ajustar);
    return () => window.removeEventListener("resize", ajustar);
  }, []);

  return (
    <div
      ref={caja}
      className="mt-6 overflow-auto rounded-2xl border border-black/5 bg-white shadow-sm"
    >
      {children}
    </div>
  );
}
