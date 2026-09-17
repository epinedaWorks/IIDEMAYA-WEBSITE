"use server";

import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/require-admin";
import { enviarAnuncioMasivo, type DestinatarioAnuncio } from "@/lib/email";
import { ES_CORREO_ANUNCIO, dedupePorCorreo } from "@/lib/anuncios";

export async function enviarAnuncio(formData: FormData) {
  const session = await requireAdminSession();

  const asunto = String(formData.get("asunto") || "").trim();
  const mensaje = String(formData.get("mensaje") || "").trim();

  if (!asunto || !mensaje) {
    redirect("/admin/anuncios?msg=faltan");
  }

  let lista: unknown = [];
  try {
    lista = JSON.parse(String(formData.get("destinatariosJson") || "[]"));
  } catch {
    lista = [];
  }
  const destinatarios: DestinatarioAnuncio[] = dedupePorCorreo(
    (Array.isArray(lista) ? lista : [])
      .filter(
        (d): d is { correo: string; nombre?: string } =>
          !!d && typeof d.correo === "string" && ES_CORREO_ANUNCIO(d.correo.trim())
      )
      .map((d) => ({ correo: d.correo.trim(), nombre: (d.nombre || "").trim() || d.correo.trim() }))
  );

  if (destinatarios.length === 0) redirect("/admin/anuncios?msg=vacio");

  const correoAdmin = session.user?.email || "el panel";

  const { enviados, fallidos } = await enviarAnuncioMasivo({
    destinatarios,
    asunto,
    mensaje,
    remitenteEmail: correoAdmin,
  });

  const params = new URLSearchParams({ msg: "enviado", n: String(enviados) });
  if (fallidos.length) params.set("f", String(fallidos.length));
  redirect(`/admin/anuncios?${params.toString()}`);
}
