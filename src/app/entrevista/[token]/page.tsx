import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  ANTICIPACION_MIN,
  claveDiaGt,
  diaLargoGt,
  fechaHoraLargaGt,
  horaGt,
  personaPorToken,
  rangoHorasGt,
} from "@/lib/entrevistas";
import SelectorEntrevista, { type DiaDisponible } from "@/components/SelectorEntrevista";

export const metadata: Metadata = {
  title: "Agenda tu entrevista | IIDEMAYA",
  robots: { index: false, follow: false, noarchive: true },
};
export const dynamic = "force-dynamic";

export default async function AgendarEntrevista({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const persona = await personaPorToken(token);

  if (!persona || !persona.activa) {
    return (
      <section className="mx-auto max-w-2xl px-6 py-16">
        <div className="rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
          <p className="font-semibold text-brand-dark">Este enlace no está activo.</p>
          <p className="mt-2 text-sm text-foreground/70">
            Si recibiste un correo de IIDEMAYA para agendar tu entrevista, respóndelo y te ayudamos.{" "}
            <Link href="/contacto" className="font-medium text-brand underline">
              Contáctanos
            </Link>
            .
          </p>
        </div>
      </section>
    );
  }

  const ahora = new Date();
  const limite = new Date(ahora.getTime() + ANTICIPACION_MIN * 60_000);

  const [actual, libres] = await Promise.all([
    prisma.franjaEntrevista.findFirst({
      where: { ...persona.quien, inicio: { gt: ahora } },
      orderBy: { inicio: "asc" },
    }),
    prisma.franjaEntrevista.findMany({
      where: { postulacionId: null, invitadoId: null, inicio: { gt: limite } },
      orderBy: { inicio: "asc" },
      take: 400,
    }),
  ]);

  const dias: DiaDisponible[] = [];
  for (const f of libres) {
    const clave = claveDiaGt(f.inicio);
    let dia = dias.find((d) => d.clave === clave);
    if (!dia) {
      dia = { clave, titulo: diaLargoGt(f.inicio), franjas: [] };
      dias.push(dia);
    }
    dia.franjas.push({ id: f.id, hora: horaGt(f.inicio) });
  }

  const primerNombre = persona.nombre.trim().split(/\s+/)[0];
  const introduccion = persona.esInvitado
    ? "Te invitamos a una entrevista con IIDEMAYA."
    : persona.vacanteTitulo
      ? `Gracias por postularte a ${persona.vacanteTitulo}.`
      : "Gracias por postularte.";

  return (
    <div>
      <section className="bg-brand-light">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <h1 className="text-3xl font-extrabold text-brand-dark sm:text-4xl">Agenda tu entrevista</h1>
          <p className="mt-4 text-lg leading-relaxed text-foreground/80">
            {primerNombre ? `Hola, ${primerNombre}.` : "Hola."} {introduccion} Elige el horario que mejor te acomode y te enviaremos la confirmación por correo.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-10">
        <SelectorEntrevista
          key={actual?.id ?? "sin-reserva"}
          token={token}
          dias={dias}
          reserva={
            actual
              ? {
                  id: actual.id,
                  cuando: fechaHoraLargaGt(actual.inicio),
                  rango: rangoHorasGt(actual.inicio, actual.fin),
                  detalle: actual.detalle,
                  puedeCambiar: actual.inicio > limite,
                }
              : null
          }
        />
      </section>
    </div>
  );
}
