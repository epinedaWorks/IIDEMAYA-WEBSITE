import type { Metadata } from "next";
import PostulacionForm from "@/components/PostulacionForm";
import { listarVacantesActivas } from "@/lib/vacantes";

// Aparece en /vacantes (botón "Postularme"), pero no en el menú ni en el
// home — se mantiene fuera de los buscadores.
export const metadata: Metadata = {
  title: "Postulación | IIDEMAYA",
  description: "Formulario de postulación para IIDEMAYA.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function Talento({
  searchParams,
}: {
  searchParams: Promise<{ vacante?: string }>;
}) {
  const [vacantes, { vacante }] = await Promise.all([listarVacantesActivas(), searchParams]);

  return (
    <div>
      <section className="bg-brand-light">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="text-3xl font-extrabold text-brand-dark sm:text-4xl">
            Postulación IIDEMAYA
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-foreground/80">
            Gracias por tu interés en formar parte de nuestro equipo. Completa el siguiente
            formulario con calma — no hay respuestas correctas o incorrectas, nos interesa
            conocerte.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <PostulacionForm
          vacantes={vacantes.map((v) => ({ id: v.id, titulo: v.titulo }))}
          vacanteInicial={vacantes.some((v) => v.id === vacante) ? vacante : undefined}
        />
      </section>
    </div>
  );
}
