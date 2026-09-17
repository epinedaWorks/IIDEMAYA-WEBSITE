import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-black/5 bg-brand-dark text-white/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-3">
        <div>
          <p className="text-lg font-bold text-white">IIDEMAYA</p>
          <p className="mt-3 text-sm leading-relaxed">
            Impulsando educación de calidad en Guatemala a través de nuestra red de centros
            educativos y la Universidad ITMES.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white">Navegación</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white">Inicio</Link></li>
            <li><Link href="/nosotros" className="hover:text-white">Nosotros</Link></li>
            <li><Link href="/proyectos" className="hover:text-white">Proyectos</Link></li>
            <li><Link href="/contacto" className="hover:text-white">Contacto</Link></li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-white">Contacto</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>erick.pineda@iidemaya.org.gt</li>
            <li>Guatemala, Guatemala</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-white/60">
        © {year} IIDEMAYA. Todos los derechos reservados.
      </div>
    </footer>
  );
}
