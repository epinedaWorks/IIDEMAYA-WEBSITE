import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nosotros | IIDEMAYA",
  description: "Misión, visión e historia de IIDEMAYA.",
};

const VALUES = [
  {
    title: "Identidad maya",
    description: "Nuestro trabajo nace de y para las comunidades lingüísticas mayas de Guatemala.",
  },
  {
    title: "Educación técnica",
    description: "Formamos a jóvenes de áreas rurales con carreras técnicas aplicables a su entorno.",
  },
  {
    title: "Conservación",
    description: "Impulsamos proyectos comunitarios enfocados en el cuidado de los recursos naturales.",
  },
  {
    title: "Compromiso rural",
    description: "Llevamos oportunidad académica y laboral a regiones de escasos recursos económicos.",
  },
];

const HITOS = [
  {
    anio: "1992",
    texto:
      "Nace el Plan de Acción Forestal Maya (PAF MAYA) de encuentros agroforestales regionales con más de 1,045 representantes y 150 delegados de comunidades lingüísticas mayas.",
  },
  {
    anio: "1997",
    texto:
      "IIDEMAYA inicia operaciones como entidad complementaria al PAF MAYA, abriendo los primeros institutos tecnológicos en San Pedro Carchá (Alta Verapaz) y San Miguel Uspantán (El Quiché).",
  },
  {
    anio: "2002–2003",
    texto:
      "Se suman los centros de Jocotán (Chiquimula) y Patzicía (Chimaltenango), este último con la carrera de Perito en Industria Alimentaria.",
  },
  {
    anio: "Hoy",
    texto:
      "9 centros educativos tecnológicos en funcionamiento, incluyendo ITEMAYA, con carreras de Recursos Naturales, Industria Alimentaria, Informática y Mecánica Automotriz.",
  },
];

export default function Nosotros() {
  return (
    <div>
      <section className="bg-brand-light">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h1 className="text-4xl font-extrabold text-brand-dark">Nosotros</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-foreground/80">
            El Instituto de Investigación y de Desarrollo Maya (IIDEMAYA) es una organización
            maya que brinda educación tecnológica de nivel medio y superior en distintos
            departamentos de Guatemala, y desarrolla proyectos comunitarios rurales enfocados
            en la conservación de recursos naturales.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-brand-dark">Misión</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/70">
            Brindar educación técnica de calidad a jóvenes de comunidades mayas y áreas
            rurales de Guatemala, y acompañar procesos comunitarios de desarrollo y
            conservación de recursos naturales.
          </p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-brand-dark">Visión</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/70">
            Ser una organización de referencia en educación técnica y desarrollo comunitario
            en Guatemala, ampliando oportunidades académicas y laborales para las
            comunidades mayas y rurales del país.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold text-brand-dark">Nuestra historia</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {HITOS.map((hito) => (
            <div key={hito.anio} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <span className="text-sm font-bold text-accent">{hito.anio}</span>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">{hito.texto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold text-brand-dark">Nuestros valores</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((value) => (
            <div key={value.title} className="rounded-xl border border-black/5 bg-white p-6">
              <h3 className="font-semibold text-brand-dark">{value.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground/70">{value.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
