import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/require-admin";
import { enviarAnuncio } from "./actions";
import AnuncioForm from "@/components/admin/AnuncioForm";

export const metadata: Metadata = { title: "Anuncios | Panel IIDEMAYA" };
export const dynamic = "force-dynamic";

const MENSAJES: Record<string, { ok: boolean; texto: (n?: string, f?: string) => string }> = {
  enviado: {
    ok: true,
    texto: (n, f) =>
      `Anuncio enviado a ${n} persona${n === "1" ? "" : "s"}.${f ? ` ${f} fallaron — revisa los logs.` : ""}`,
  },
  faltan: { ok: false, texto: () => "Faltan campos: escribe al menos un destinatario, asunto y mensaje." },
  vacio: { ok: false, texto: () => "No quedó ningún destinatario válido — no se envió nada." },
};

export default async function AnunciosPage({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string; n?: string; f?: string }>;
}) {
  await requireAdminSession();
  const sp = await searchParams;
  const aviso = sp.msg ? MENSAJES[sp.msg] : null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-brand-dark">Anuncios</h1>
      <p className="mt-1 max-w-2xl text-sm text-foreground/60">
        Manda un mismo mensaje a una lista de correos que escribas aquí (no tienen que ser
        postulantes). Cada quien recibe su propio correo — nadie ve la lista de los demás.
      </p>

      {aviso && (
        <p
          className={`mt-4 rounded-lg px-4 py-2 text-sm font-medium ${
            aviso.ok ? "bg-brand-light text-brand" : "bg-red-50 text-red-700"
          }`}
        >
          {aviso.texto(sp.n, sp.f)}
        </p>
      )}

      <AnuncioForm key={sp.msg === "enviado" ? `enviado-${sp.n}` : "form"} action={enviarAnuncio} />
    </div>
  );
}
