import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nosotros | IIDEMAYA",
  description: "Misión, visión e historia de IIDEMAYA.",
};

const VALUES = [
  {
    title: "Calidad educativa",
    description: "Buscamos que cada estudiante reciba una formación sólida y actualizada.",
  },
  {
    title: "Transparencia",
    description: "Trabajamos con procesos claros hacia estudiantes, familias y colaboradores.",
  },
  {
    title: "Mejora continua",
    description: "Evaluamos y modernizamos constantemente nuestras herramientas y procesos.",
  },
  {
    title: "Compromiso comunitario",
    description: "Nuestro trabajo busca un impacto real en las comunidades donde estamos presentes.",
  },
];

export default function Nosotros() {
  return (
    <div>
      <section className="bg-brand-light">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h1 className="text-4xl font-extrabold text-brand-dark">Nosotros</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-foreground/80">
            IIDEMAYA es una organización guatemalteca que reúne una red de centros educativos
            y la Universidad ITMES, trabajando de forma conjunta para ofrecer educación de
            calidad respaldada por procesos administrativos sólidos y confiables.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-brand-dark">Misión</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/70">
            Impulsar una educación de calidad en Guatemala, acompañando a nuestros centros
            educativos y a la Universidad ITMES con procesos, herramientas y equipos humanos
            comprometidos con el aprendizaje de cada estudiante.
          </p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-brand-dark">Visión</h2>
          <p className="mt-3 text-sm leading-relaxed text-foreground/70">
            Ser una organización educativa de referencia en Guatemala, reconocida por la
            calidad de sus procesos, la solidez de su gestión y el impacto positivo en las
            comunidades a las que sirve.
          </p>
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
