import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { SETTING_CONTACT_EMAIL, SETTING_POSTULACION_EMAIL } from "@/lib/settings";
import { guardarAjustes } from "./actions";

export const metadata: Metadata = { title: "Ajustes | Panel IIDEMAYA" };
export const dynamic = "force-dynamic";

export default async function AjustesPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  await requireAdminSession();
  const { msg } = await searchParams;

  const rows = await prisma.setting.findMany({
    where: { key: { in: [SETTING_CONTACT_EMAIL, SETTING_POSTULACION_EMAIL] } },
  });
  const get = (k: string) => rows.find((r) => r.key === k)?.value ?? "";

  const contactoGuardado = get(SETTING_CONTACT_EMAIL);
  const postulacionGuardado = get(SETTING_POSTULACION_EMAIL);
  const contacto = contactoGuardado || process.env.TEAM_EMAIL || "";
  const postulacion =
    postulacionGuardado || process.env.ADMIN_NOTIFY_EMAILS || process.env.TEAM_EMAIL || "";

  const campo =
    "mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-brand";

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark">Ajustes de correo</h1>
      <p className="mt-1 text-sm text-foreground/60">
        Decide a qué correos llegan los avisos de contacto y de postulaciones. Los cambios se
        aplican de inmediato, sin volver a publicar el sitio.
      </p>

      {msg === "ok" && (
        <p className="mt-4 rounded-lg bg-brand-light px-4 py-2 text-sm font-medium text-brand">
          Ajustes guardados.
        </p>
      )}

      <form action={guardarAjustes} className="mt-6 flex flex-col gap-6">
        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <label htmlFor="contactEmail" className="text-sm font-semibold text-brand-dark">
            Correos del formulario de contacto
          </label>
          <textarea
            id="contactEmail"
            name="contactEmail"
            rows={2}
            defaultValue={contacto}
            placeholder="uno@correo.com, otro@correo.com"
            className={campo}
          />
          <p className="mt-1 text-xs text-foreground/60">
            Reciben cada mensaje enviado desde /contacto. Varios separados por coma.
            {!contactoGuardado && " Ahora mismo se está usando la variable de entorno."}
          </p>
        </div>

        <div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <label htmlFor="postulacionEmail" className="text-sm font-semibold text-brand-dark">
            Correos de nuevas postulaciones
          </label>
          <textarea
            id="postulacionEmail"
            name="postulacionEmail"
            rows={2}
            defaultValue={postulacion}
            placeholder="uno@correo.com, otro@correo.com"
            className={campo}
          />
          <p className="mt-1 text-xs text-foreground/60">
            Reciben el aviso cuando alguien envía el formulario de /talento.
            {!postulacionGuardado && " Ahora mismo se está usando la variable de entorno."}
          </p>
        </div>

        <button
          type="submit"
          className="self-start rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Guardar
        </button>
      </form>

      <p className="mt-6 text-xs text-foreground/50">
        El remitente (<code>{process.env.EMAIL_FROM || "no-reply@iidemaya.org.gt"}</code>) sigue
        configurándose por variable de entorno porque depende del dominio verificado en Resend.
      </p>
    </div>
  );
}
