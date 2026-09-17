import type { Metadata } from "next";
import PostulacionForm from "@/components/PostulacionForm";

// No aparece en el menú ni en el home — evita que buscadores la indexen.
export const metadata: Metadata = {
  title: "Postulación | IIDEMAYA",
  description: "Formulario de postulación para IIDEMAYA.",
  robots: { index: false, follow: false },
};

export default function Talento() {
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
        <PostulacionForm />
      </section>
    </div>
  );
}
