import Link from "next/link";
import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import {
  DURACIONES,
  claveDiaGt,
  diaLargoGt,
  fechaHoraLargaGt,
  hoyGt,
  rangoHorasGt,
} from "@/lib/entrevistas";
import {
  crearFranjas,
  eliminarFranja,
  eliminarInvitado,
  invitarManual,
  invitarVarias,
  liberarFranja,
} from "./actions";
import ConfirmarAccionBoton from "@/components/admin/ConfirmarAccionBoton";
import InvitarSeleccion, { type PersonaInvitable } from "@/components/admin/InvitarSeleccion";

export const metadata: Metadata = { title: "Entrevistas | Panel IIDEMAYA" };
export const dynamic = "force-dynamic";

type Params = { msg?: string; n?: string; o?: string; f?: string; x?: string; p?: string; error?: string };

function aviso(p: Params): { ok: boolean; texto: string } | null {
  if (p.error) return { ok: false, texto: p.error.slice(0, 200) };
  const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);
  const n = Number(p.n ?? 0);
  switch (p.msg) {
    case "creadas": {
      const o = Number(p.o ?? 0);
      return {
        ok: true,
        texto:
          `${n} ${plural(n, "horario habilitado", "horarios habilitados")}.` +
          (o > 0 ? ` ${o} se omitieron porque se empalmaban con horarios que ya existían.` : ""),
      };
    }
    case "invitadas": {
      const f = Number(p.f ?? 0);
      return {
        ok: f === 0,
        texto:
          `Invitación enviada a ${n} ${plural(n, "persona", "personas")}.` +
          (f > 0 ? ` No se pudo enviar a ${f}; intenta de nuevo con ellas.` : ""),
      };
    }
    case "manual": {
      const f = Number(p.f ?? 0);
      const x = Number(p.x ?? 0);
      const ya = Number(p.p ?? 0);
      return {
        ok: f === 0 && x === 0,
        texto:
          `Invitación enviada a ${n} ${plural(n, "persona", "personas")}.` +
          (ya > 0
            ? ` ${ya} ${plural(ya, "ya había postulado: se le mandó su enlace de postulante", "ya habían postulado: se les mandó su enlace de postulante")}.`
            : "") +
          (f > 0 ? ` No se pudo enviar a ${f}; usa «Seleccionar» en la lista de abajo para reintentar.` : "") +
          (x > 0 ? ` ${x} ${plural(x, "línea se omitió", "líneas se omitieron")} por no tener un correo válido.` : ""),
      };
    }
    case "liberada":
      return { ok: true, texto: "Horario liberado. Se le avisó a la persona para que elija otro." };
    case "liberada_sin_correo":
      return {
        ok: false,
        texto: "Horario liberado, pero no se pudo enviar el aviso por correo. Escríbele a la persona.",
      };
    default:
      return null;
  }
}

const campo =
  "rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand";
const etiqueta = "flex flex-col gap-1 text-xs font-semibold text-foreground/60";

export default async function AdminEntrevistas({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdminSession();
  const params = await searchParams;
  const mensaje = aviso(params);
  const ahora = new Date();

  const quien = {
    postulacion: { select: { id: true, nombre: true } },
    invitado: { select: { id: true, nombre: true, correo: true } },
  } as const;

  const [proximas, pasadas, postulaciones, invitados] = await Promise.all([
    prisma.franjaEntrevista.findMany({
      where: { fin: { gt: ahora } },
      orderBy: { inicio: "asc" },
      include: quien,
    }),
    prisma.franjaEntrevista.findMany({
      where: {
        fin: { lte: ahora },
        OR: [{ postulacionId: { not: null } }, { invitadoId: { not: null } }],
      },
      orderBy: { inicio: "desc" },
      take: 30,
      include: quien,
    }),
    // Las rechazadas y contratadas no se listan: su enlace ya no serviría.
    prisma.postulacion.findMany({
      where: { estado: { notIn: ["RECHAZADA", "CONTRATADA"] } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        nombre: true,
        correo: true,
        vacanteTitulo: true,
        interes: true,
        entrevistaInvitadaAt: true,
        entrevistas: { where: { inicio: { gt: ahora } }, select: { inicio: true }, take: 1 },
      },
    }),
    prisma.invitadoEntrevista.findMany({
      orderBy: { createdAt: "desc" },
      include: { entrevistas: { where: { inicio: { gt: ahora } }, select: { inicio: true }, take: 1 } },
    }),
  ]);

  const libres = proximas.filter((f) => !f.postulacion && !f.invitado).length;
  const reservadas = proximas.length - libres;

  const dias: { clave: string; titulo: string; franjas: typeof proximas }[] = [];
  for (const f of proximas) {
    const clave = claveDiaGt(f.inicio);
    let dia = dias.find((d) => d.clave === clave);
    if (!dia) {
      dia = { clave, titulo: diaLargoGt(f.inicio), franjas: [] };
      dias.push(dia);
    }
    dia.franjas.push(f);
  }

  const situacionDe = (agendada: Date | undefined, invitadaAt: Date | null) =>
    agendada
      ? `Agendó: ${fechaHoraLargaGt(agendada)}`
      : invitadaAt
        ? `Invitada el ${invitadaAt.toLocaleDateString("es-GT", { timeZone: "America/Guatemala", day: "numeric", month: "short" })}`
        : null;

  // Primero los invitados a mano (suelen ser los más recientes), luego los
  // postulantes de más nuevo a más viejo.
  const personas: PersonaInvitable[] = [
    ...invitados.map((i) => ({
      clave: `i:${i.id}`,
      id: i.id,
      invitadoManual: true,
      nombre: i.nombre || i.correo,
      correo: i.correo,
      posicion: null,
      interes: null,
      yaAgendo: Boolean(i.entrevistas[0]),
      yaInvitada: Boolean(i.invitadaAt),
      situacion: situacionDe(i.entrevistas[0]?.inicio, i.invitadaAt),
    })),
    ...postulaciones.map((p) => ({
      clave: `p:${p.id}`,
      id: p.id,
      invitadoManual: false,
      nombre: p.nombre,
      correo: p.correo,
      posicion: p.vacanteTitulo,
      interes: p.interes,
      yaAgendo: Boolean(p.entrevistas[0]),
      yaInvitada: Boolean(p.entrevistaInvitadaAt),
      situacion: situacionDe(p.entrevistas[0]?.inicio, p.entrevistaInvitadaAt),
    })),
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark">Entrevistas</h1>
      <p className="mt-1 max-w-3xl text-sm text-foreground/60">
        Habilita los días y horarios en que puedes entrevistar, invita por correo a las personas que
        ya postularon y ellas eligen su horario desde un enlace. Todo se maneja en hora de
        Guatemala.
      </p>

      {mensaje && (
        <p
          className={`mt-4 rounded-lg px-4 py-2 text-sm font-medium ${
            mensaje.ok ? "bg-brand-light text-brand" : "bg-red-50 text-red-700"
          }`}
        >
          {mensaje.texto}
        </p>
      )}

      <section className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-dark">1. Habilitar horarios</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Se divide el rango en entrevistas de la duración que elijas. Para varios días, llena
          «Hasta el día»: se crean los mismos horarios cada día (sin sábado ni domingo, salvo que lo
          marques).
        </p>
        <form action={crearFranjas} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className={etiqueta}>
            Día (o primer día)
            <input type="date" name="desde" required min={hoyGt()} className={campo} />
          </label>
          <label className={etiqueta}>
            Hasta el día (opcional)
            <input type="date" name="hasta" min={hoyGt()} className={campo} />
          </label>
          <label className={etiqueta}>
            Desde la hora
            <input type="time" name="horaInicio" required defaultValue="09:00" className={campo} />
          </label>
          <label className={etiqueta}>
            Hasta la hora
            <input type="time" name="horaFin" required defaultValue="12:00" className={campo} />
          </label>
          <label className={etiqueta}>
            Duración de cada entrevista
            <select name="duracion" defaultValue="30" className={campo}>
              {DURACIONES.map((d) => (
                <option key={d} value={d}>
                  {d} minutos
                </option>
              ))}
            </select>
          </label>
          <label className={`${etiqueta} sm:col-span-2`}>
            Enlace de la videollamada o lugar (opcional)
            <input
              type="text"
              name="detalle"
              maxLength={500}
              placeholder="https://meet.google.com/… o la dirección donde será"
              className={campo}
            />
          </label>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-foreground/70">
            <input type="checkbox" name="finDeSemana" className="h-4 w-4 accent-[var(--brand)]" />
            Incluir sábado y domingo
          </label>
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark active:scale-95"
            >
              Habilitar horarios
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-brand-dark">2. Agenda</h2>
          <p className="text-sm text-foreground/60">
            {libres} {libres === 1 ? "horario libre" : "horarios libres"} · {reservadas}{" "}
            {reservadas === 1 ? "reservado" : "reservados"}
          </p>
        </div>

        {dias.length === 0 ? (
          <p className="mt-4 text-sm text-foreground/60">
            Todavía no hay horarios habilitados. Crea los primeros con el formulario de arriba.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-5">
            {dias.map((d) => (
              <div key={d.clave}>
                <h3 className="text-sm font-semibold first-letter:uppercase text-brand">{d.titulo}</h3>
                <ul className="mt-2 divide-y divide-black/5 rounded-xl border border-black/5">
                  {d.franjas.map((f) => (
                    <li key={f.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5 text-sm">
                      <span className="w-52 whitespace-nowrap font-medium tabular-nums">{rangoHorasGt(f.inicio, f.fin)}</span>
                      {f.postulacion || f.invitado ? (
                        <span className="rounded-full bg-green-100 px-3 py-0.5 text-xs font-semibold text-green-700">
                          Reservada
                        </span>
                      ) : (
                        <span className="rounded-full bg-black/5 px-3 py-0.5 text-xs font-semibold text-foreground/60">
                          Libre
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate text-foreground/70">
                        {f.postulacion ? (
                          <Link href={`/admin/postulaciones/${f.postulacion.id}`} className="font-medium text-brand-dark hover:underline">
                            {f.postulacion.nombre}
                          </Link>
                        ) : f.invitado ? (
                          <span title={f.invitado.correo}>
                            <span className="font-medium text-brand-dark">{f.invitado.nombre || f.invitado.correo}</span>
                            <span className="ml-2 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                              Invitado a mano
                            </span>
                          </span>
                        ) : (
                          f.detalle
                        )}
                      </span>
                      {f.postulacion || f.invitado ? (
                        <form action={liberarFranja.bind(null, f.id)}>
                          <ConfirmarAccionBoton
                            etiqueta="Liberar"
                            titulo="¿Liberar este horario?"
                            mensaje={`Se le quitará el horario a ${f.postulacion?.nombre || f.invitado?.nombre || f.invitado?.correo} y se le enviará un correo para que elija otro.`}
                            etiquetaConfirmar="Sí, liberar"
                            className="rounded-lg border border-amber-300 px-3 py-1 text-xs font-medium text-amber-700 transition hover:bg-amber-50 active:scale-95"
                          />
                        </form>
                      ) : (
                        <form action={eliminarFranja.bind(null, f.id)}>
                          <button
                            type="submit"
                            className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 active:scale-95"
                          >
                            Quitar
                          </button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {pasadas.length > 0 && (
          <details className="mt-5">
            <summary className="cursor-pointer text-sm font-medium text-foreground/60">
              Entrevistas pasadas ({pasadas.length})
            </summary>
            <ul className="mt-2 divide-y divide-black/5 rounded-xl border border-black/5 text-sm">
              {pasadas.map((f) => (
                <li key={f.id} className="flex flex-wrap items-center gap-3 px-4 py-2">
                  <span className="w-64 first-letter:uppercase text-foreground/70">{fechaHoraLargaGt(f.inicio)}</span>
                  {f.postulacion ? (
                    <Link href={`/admin/postulaciones/${f.postulacion.id}`} className="font-medium text-brand-dark hover:underline">
                      {f.postulacion.nombre}
                    </Link>
                  ) : (
                    f.invitado && (
                      <span className="font-medium text-brand-dark" title={f.invitado.correo}>
                        {f.invitado.nombre || f.invitado.correo}
                      </span>
                    )
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-dark">3. Invitar a una entrevista</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Cada persona recibe un correo con su enlace personal para elegir horario. Puedes invitar a
          quienes postularon (elige abajo; nadie viene marcado) o a gente que no postuló (primer
          recuadro). Las postulaciones rechazadas o contratadas no aparecen.
        </p>
        {libres === 0 && (
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800">
            Aún no hay horarios libres: habilítalos antes de invitar, para que quienes abran el enlace
            tengan dónde elegir.
          </p>
        )}

        <form action={invitarManual} className="mt-4 rounded-xl border border-black/5 bg-brand-light/30 p-4">
          <h3 className="text-sm font-semibold text-brand-dark">Invitar a alguien que no postuló</h3>
          <p className="mt-1 text-xs text-foreground/60">
            Una persona por línea: <code>Nombre, correo</code> (el nombre es opcional). Puedes pegar
            varias a la vez.
          </p>
          <textarea
            name="lista"
            required
            rows={3}
            maxLength={8000}
            placeholder={"Ana López, ana@correo.com\nCarlos Pérez, carlos@correo.com"}
            className="mt-2 w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <div className="mt-2">
            <ConfirmarAccionBoton
              etiqueta="Enviar invitación"
              titulo="¿Enviar la invitación?"
              mensaje="Se enviará un correo con el enlace para agendar a cada correo de la lista. Quedarán guardados en la lista de abajo para poder volver a escribirles."
              etiquetaConfirmar="Sí, enviar"
              className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark active:scale-95"
            />
          </div>
        </form>

        <div className="mt-5">
          {personas.length === 0 ? (
            <p className="text-sm text-foreground/60">Todavía no hay personas para invitar.</p>
          ) : (
            <InvitarSeleccion personas={personas} action={invitarVarias} quitarInvitado={eliminarInvitado} />
          )}
        </div>
      </section>
    </div>
  );
}
