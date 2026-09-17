import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/proyectos", label: "Proyectos" },
  { href: "/contacto", label: "Contacto" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-brand-dark">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
            II
          </span>
          IIDEMAYA
        </Link>

        <nav className="hidden gap-8 text-sm font-medium text-foreground/80 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-brand">
              {link.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/contacto"
          className="hidden rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark md:inline-block"
        >
          Contáctanos
        </Link>

        <details className="md:hidden">
          <summary className="list-none rounded-md border border-black/10 px-3 py-1.5 text-sm font-medium">
            Menú
          </summary>
          <nav className="absolute inset-x-0 top-full flex flex-col gap-1 border-b border-black/5 bg-background px-6 py-4 shadow-sm">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-md px-2 py-2 text-sm font-medium hover:bg-brand-light">
                {link.label}
              </Link>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
