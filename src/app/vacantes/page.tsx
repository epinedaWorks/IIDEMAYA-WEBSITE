import Link from "next/link";
import type { Metadata } from "next";
import { listarVacantesActivas } from "@/lib/vacantes";

export const metadata: Metadata = {
  title: "Vacantes | IIDEMAYA",
  description: "Plazas abiertas en el Departamento de Tecnología de IIDEMAYA.",
};
export const dynamic = "force-dynamic";

export default async function Vacantes() {
  const vacantes = await listarVacantesActivas();

  return (
    <div>
      <section className="bg-brand-light">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h1 className="text-3xl font-extrabold text-brand-dark sm:text-4xl">Vacantes</h1>
          <p className="mt-4 text-lg leading-relaxed text-foreground/80">
            Estamos formando el Departamento de Tecnología de IIDEMAYA. Conoce las plazas abiertas
            y postúlate a la que mejor se ajuste a tu perfil.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12">
        {vacantes.length === 0 ? (
          <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
            <p className="font-semibold text-brand-dark">Por ahora no hay vacantes abiertas.</p>
            <p className="mt-2 text-sm text-foreground/70">
              Si quieres que te tomemos en cuenta más adelante,{" "}
              <Link href="/contacto" className="font-medium text-brand underline">
                escríbenos
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {vacantes.map((v) => (
              <article
                key={v.id}
                id={v.id}
                className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm sm:p-8"
              >
                <h2 className="text-2xl font-bold text-brand-dark">{v.titulo}</h2>
                <p className="mt-3 leading-relaxed text-foreground/80">{v.resumen}</p>

                <p className="mt-4 rounded-lg bg-accent-light px-4 py-3 text-sm text-foreground/80">
                  <span className="font-semibold text-accent">Modalidad: </span>
                  {v.modalidad}
                </p>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  {v.funciones.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-brand">
                        Lo que harás
                      </h3>
                      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/80">
                        {v.funciones.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {v.requisitos.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-brand">
                        Lo que buscamos
                      </h3>
                      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-foreground/80">
                        {v.requisitos.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <Link
                  href={`/talento?vacante=${v.id}`}
                  className="mt-8 inline-block rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
                >
                  Postularme a esta vacante
                </Link>
              </article>
            ))}
          </div>
        )}

        {vacantes.length > 0 && (
          <p className="mt-8 text-xs leading-relaxed text-foreground/60">
            Las plazas se contratan por prestación de servicios profesionales, con pago contra
            factura.
          </p>
        )}
      </section>
    </div>
  );
}
