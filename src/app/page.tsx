import Link from "next/link";

const AREAS = [
  {
    title: "Centros Educativos Tecnológicos",
    description:
      "9 institutos en distintos departamentos del país, con carreras técnicas (Peritos) en Recursos Naturales, Industria Alimentaria, Informática y Mecánica Automotriz.",
  },
  {
    title: "ITEMAYA",
    description:
      "Instituto Técnico Maya en Recursos Naturales, en Uspantán, El Quiché — uno de nuestros centros insignia de educación técnica.",
  },
  {
    title: "Proyectos Comunitarios",
    description:
      "Iniciativas rurales enfocadas en la conservación de recursos naturales, junto a las comunidades donde trabajamos.",
  },
];

export default function Home() {
  return (
    <div>
      <section className="bg-brand-light">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-24">
          <span className="rounded-full bg-white px-4 py-1 text-xs font-semibold uppercase tracking-wide text-brand">
            Organización maya · desde 1997
          </span>
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight text-brand-dark sm:text-5xl">
            Educación técnica y desarrollo para comunidades mayas de Guatemala
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-foreground/80">
            El Instituto de Investigación y de Desarrollo Maya (IIDEMAYA) administra 9 centros
            educativos tecnológicos en distintos departamentos del país y desarrolla proyectos
            comunitarios rurales enfocados en la conservación de recursos naturales.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/nosotros"
              className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark"
            >
              Conoce quiénes somos
            </Link>
            <Link
              href="/contacto"
              className="rounded-full border border-brand px-6 py-3 text-sm font-semibold text-brand transition-colors hover:bg-white"
            >
              Hablemos
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-2xl font-bold text-brand-dark sm:text-3xl">Qué hacemos</h2>
        <p className="mt-2 max-w-2xl text-foreground/70">
          Trabajamos en distintas áreas para fortalecer la educación de principio a fin.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {AREAS.map((area) => (
            <div
              key={area.title}
              className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 h-10 w-10 rounded-lg bg-accent-light" aria-hidden />
              <h3 className="text-lg font-semibold text-brand-dark">{area.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">{area.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-brand-dark">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-4 px-6 py-16 text-white">
          <h2 className="text-2xl font-bold sm:text-3xl">¿Quieres saber más sobre nuestro trabajo?</h2>
          <p className="max-w-xl text-white/80">
            Conoce nuestros proyectos en marcha o ponte en contacto con nuestro equipo.
          </p>
          <Link
            href="/proyectos"
            className="rounded-full bg-accent px-6 py-3 text-sm font-semibold text-brand-dark transition-colors hover:bg-accent-light"
          >
            Ver proyectos
          </Link>
        </div>
      </section>
    </div>
  );
}
