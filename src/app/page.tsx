import Link from "next/link";

const AREAS = [
  {
    title: "Centros Educativos Tecnológicos",
    description:
      "9 institutos en distintos departamentos del país, con carreras técnicas (Peritos) en Recursos Naturales, Industria Alimentaria, Informática y Mecánica Automotriz.",
  },
  {
    title: "Investigación y transferencia de tecnología",
    description:
      "Laboratorios y áreas experimentales en los centros, y encuentros con productores y empresarios para compartir tecnología, experiencias y mercado.",
  },
  {
    title: "Proyectos Comunitarios",
    description:
      "Iniciativas rurales enfocadas en la conservación de recursos naturales, junto a las comunidades donde trabajamos.",
  },
];

const CENTROS = [
  {
    sigla: "ITEMAYA",
    nombre: "Instituto Técnico Maya en Recursos Naturales",
    lugar: "Uspantán, El Quiché",
    carreras: ["Recursos Naturales", "Informática", "Mecánica Automotriz"],
    telefono: "3657-5383",
    web: "https://itemaya.edu.gt/",
  },
  {
    sigla: "ITERN",
    nombre: "Instituto Técnico en Recursos Naturales",
    lugar: "San Juan Chamelco, Alta Verapaz",
    carreras: ["Recursos Naturales", "Informática", "Mecánica Automotriz"],
    telefono: "7950-0480",
    web: "https://itern.edu.gt/",
  },
  {
    sigla: "ALAN JUYÚ",
    nombre: "Instituto Técnico Industrial",
    lugar: "Patzicía, Chimaltenango",
    carreras: ["Industria Alimentaria", "Recursos Naturales"],
    telefono: "7830-5239",
    web: "https://alanjuyu.edu.gt/",
  },
  {
    sigla: "SAKLUM",
    nombre: "Instituto Tecnológico en Recursos Naturales",
    lugar: "La Libertad, Petén",
    carreras: ["Recursos Naturales"],
    telefono: "4779-8115",
    web: "https://saklum.edu.gt/",
  },
  {
    sigla: "INTERNMACH",
    nombre: "Instituto Técnico en Recursos Naturales Maya Ch’orti’",
    lugar: "Jocotán, Chiquimula",
    carreras: ["Recursos Naturales"],
    telefono: "4804-8422",
    web: "https://internmach.edu.gt/",
  },
];

const FORMACION = [
  {
    titulo: "Educación en alternancia",
    texto:
      "Dos semanas en el aula y dos semanas en el campo, de forma continua durante los 3 años de la carrera (doble jornada). El estudiante aprende en conjunto con su familia y su comunidad.",
  },
  {
    titulo: "Estadía de campo o empresa",
    texto:
      "En las semanas de campo, los estudiantes practican en organizaciones, cooperativas, empresas o talleres reales, donde técnicos y profesionales participan en su formación.",
  },
  {
    titulo: "Liderazgo y emprendimiento",
    texto:
      "Desde que ingresan participan en actividades departamentales, nacionales y centroamericanas que desarrollan su liderazgo y su capacidad de emprender.",
  },
  {
    titulo: "Vida comunitaria, deporte y cultura",
    texto:
      "Pelota Maya, maratón, fútbol y baloncesto, talleres y seminarios abiertos a productores locales, y el Encuentro Juvenil Jo’ Muchá, un evento nacional que reúne a estudiantes de los centros de la red.",
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

      <section className="bg-brand-light/50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-2xl font-bold text-brand-dark sm:text-3xl">Nuestros centros educativos</h2>
          <p className="mt-2 max-w-2xl text-foreground/70">
            Cada centro forma jóvenes como Peritos en una carrera de 3 años, en el marco de la
            cosmovisión maya: convivencia pacífica y respeto por la naturaleza. Estos son algunos de
            los centros de nuestra red.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {CENTROS.map((c) => (
              <article
                key={c.sigla}
                className="flex flex-col rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 className="text-xl font-extrabold tracking-tight text-brand-dark">{c.sigla}</h3>
                <p className="mt-1 text-sm font-medium text-foreground/80">{c.nombre}</p>
                <p className="mt-2 text-sm text-foreground/60">{c.lugar}</p>

                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-brand">
                  Carreras de Perito en
                </p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {c.carreras.map((carrera) => (
                    <li
                      key={carrera}
                      className="rounded-full bg-brand-light px-3 py-1 text-xs font-medium text-brand"
                    >
                      {carrera}
                    </li>
                  ))}
                </ul>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-6 text-sm">
                  <span className="text-foreground/60">Tel. {c.telefono}</span>
                  <a
                    href={c.web}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-brand underline-offset-2 hover:underline"
                    aria-label={`Visitar el sitio de ${c.sigla} (se abre en una pestaña nueva)`}
                  >
                    Visitar sitio →
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-2xl font-bold text-brand-dark sm:text-3xl">Así aprenden nuestros estudiantes</h2>
        <p className="mt-2 max-w-2xl text-foreground/70">
          Aprender haciendo: la teoría del aula se une con la práctica en el campo y en la comunidad.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {FORMACION.map((f, i) => (
            <div key={f.titulo} className="flex gap-4 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-brand-dark">{f.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{f.texto}</p>
              </div>
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
