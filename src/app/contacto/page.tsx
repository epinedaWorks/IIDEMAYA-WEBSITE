import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto | IIDEMAYA",
  description: "Ponte en contacto con IIDEMAYA.",
};

const CONTACT_INFO = [
  { label: "Correo", value: "info@iidemaya.org", href: "mailto:info@iidemaya.org" },
  { label: "Teléfono", value: "+502 0000 0000", href: "tel:+50200000000" },
  { label: "Ubicación", value: "Guatemala, Guatemala" },
];

export default function Contacto() {
  return (
    <div>
      <section className="bg-brand-light">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h1 className="text-4xl font-extrabold text-brand-dark">Contacto</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-foreground/80">
            ¿Tienes alguna pregunta sobre nuestros centros educativos, la Universidad ITMES o
            quieres saber más de nuestro trabajo? Escríbenos.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-3">
          {CONTACT_INFO.map((item) => (
            <div key={item.label} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">{item.label}</p>
              {item.href ? (
                <a href={item.href} className="mt-2 block text-lg font-semibold text-brand-dark hover:underline">
                  {item.value}
                </a>
              ) : (
                <p className="mt-2 text-lg font-semibold text-brand-dark">{item.value}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
          <h2 className="text-lg font-semibold text-brand-dark">Escríbenos directamente</h2>
          <p className="mt-2 text-sm leading-relaxed text-foreground/70">
            La forma más rápida de contactarnos es por correo electrónico. Con gusto te
            responderemos lo antes posible.
          </p>
          <a
            href="mailto:info@iidemaya.org"
            className="mt-4 inline-block rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            Enviar correo
          </a>
        </div>
      </section>
    </div>
  );
}
