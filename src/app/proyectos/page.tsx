import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Proyectos | IIDEMAYA",
  description: "Proyectos e iniciativas de IIDEMAYA.",
};

const PROYECTOS = [
  {
    title: "Modernización de Centros Educativos",
    status: "En marcha",
    description:
      "Fortalecimiento de procesos académicos y administrativos en nuestra red de colegios, con miras a una plataforma común y segura.",
  },
  {
    title: "Universidad ITMES",
    status: "En marcha",
    description:
      "Integración de los sistemas académicos de ITMES para ofrecer una experiencia más ágil a estudiantes y docentes.",
  },
  {
    title: "Fortalecimiento Administrativo y Financiero",
    status: "Próximamente",
    description:
      "Actualización de herramientas de contabilidad y gestión para procesos más rápidos, seguros y con mejores reportes.",
  },
];

export default function Proyectos() {
  return (
    <div>
      <section className="bg-brand-light">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h1 className="text-4xl font-extrabold text-brand-dark">Proyectos</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-foreground/80">
            Estas son algunas de las iniciativas en las que trabajamos para fortalecer la
            educación en nuestros centros educativos y en la Universidad ITMES.
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
                {proyecto.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
