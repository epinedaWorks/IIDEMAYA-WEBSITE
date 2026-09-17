import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proyectos | IIDEMAYA",
  description: "Proyectos e iniciativas de IIDEMAYA.",
};

const PROYECTOS = [
  {
    title: "Red de Centros Educativos Tecnológicos",
    area: "Educación técnica",
    description:
      "9 institutos en Alta Verapaz, El Quiché, Chiquimula, Chimaltenango y otros departamentos, con carreras de Perito en Recursos Naturales, Industria Alimentaria, Informática y Mecánica Automotriz.",
  },
  {
    title: "ITEMAYA",
    area: "Educación técnica",
    description:
      "Instituto Técnico Maya en Recursos Naturales, en Uspantán, El Quiché — nuestro centro insignia, con apoyo histórico del MAGA, FONAPAZ y la Embajada de Francia.",
  },
  {
    title: "Conservación de Recursos Naturales",
    area: "Proyectos comunitarios",
    description:
      "Proyectos rurales con comunidades mayas, herederos del Plan de Acción Forestal Maya (PAF MAYA), enfocados en el manejo sostenible de los recursos naturales.",
  },
];

export default function Proyectos() {
  return (
    <div>
      <section className="bg-brand-light">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h1 className="text-4xl font-extrabold text-brand-dark">Proyectos</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-foreground/80">
            Estas son las principales áreas en las que trabajamos: educación técnica en
            nuestra red de centros educativos, y proyectos comunitarios de conservación de
            recursos naturales.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6">
          {PROYECTOS.map((proyecto) => (
            <div
              key={proyecto.title}
              className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-8 shadow-sm sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <h2 className="text-lg font-semibold text-brand-dark">{proyecto.title}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/70">
                  {proyecto.description}
                </p>
              </div>
              <span className="inline-flex h-fit shrink-0 items-center rounded-full bg-accent-light px-4 py-1 text-xs font-semibold text-accent">
                {proyecto.area}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
