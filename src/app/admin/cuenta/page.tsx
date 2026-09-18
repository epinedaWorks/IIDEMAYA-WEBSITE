import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/require-admin";
import { POLITICA_PASSWORD } from "@/lib/password";
import { cambiarPassword } from "./actions";
import CambiarPasswordForm from "@/components/admin/CambiarPasswordForm";

export const metadata: Metadata = { title: "Mi cuenta | Panel IIDEMAYA" };
export const dynamic = "force-dynamic";

const MENSAJES: Record<string, { ok: boolean; texto: string }> = {
  ok: { ok: true, texto: "Contraseña actualizada correctamente." },
  actual_incorrecta: { ok: false, texto: "La contraseña actual no es correcta." },
  no_coincide: { ok: false, texto: "La nueva contraseña y su confirmación no coinciden." },
  politica: {
    ok: false,
    texto: "La nueva contraseña no cumple la política de seguridad (revisa los requisitos abajo).",
  },
  igual_actual: { ok: false, texto: "La nueva contraseña no puede ser igual a la actual." },
};

export default async function CuentaPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const session = await requireAdminSession();
  const { msg } = await searchParams;
  const aviso = msg ? MENSAJES[msg] : null;

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-brand-dark">Mi cuenta</h1>
      <p className="mt-1 text-sm text-foreground/60">{session.user?.email}</p>

      <div className="mt-6 rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-brand-dark">Cambiar contraseña</h2>
        <p className="mt-1 text-sm text-foreground/60">
          Se te pedirá tu contraseña actual antes de guardar la nueva.
        </p>

        {aviso && (
          <p
            className={`mt-4 rounded-lg px-4 py-2 text-sm font-medium ${
              aviso.ok ? "bg-brand-light text-brand" : "bg-red-50 text-red-700"
            }`}
          >
            {aviso.texto}
          </p>
        )}

        <CambiarPasswordForm action={cambiarPassword} />

        <div className="mt-6 border-t border-black/5 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
            Política de contraseñas
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-foreground/60">
            {POLITICA_PASSWORD.map((regla) => (
              <li key={regla}>{regla}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
