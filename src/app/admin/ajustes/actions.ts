"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/require-admin";
import {
  SETTING_CONTACT_EMAIL,
  SETTING_POSTULACION_EMAIL,
  invalidarSettingsCache,
} from "@/lib/settings";

const normaliza = (s: string) =>
  s
    .split(/[,\n;]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .join(", ");

export async function guardarAjustes(formData: FormData) {
  await requireAdminSession();

  const contacto = normaliza(String(formData.get("contactEmail") || ""));
  const postulacion = normaliza(String(formData.get("postulacionEmail") || ""));

  await prisma.$transaction([
    prisma.setting.upsert({
      where: { key: SETTING_CONTACT_EMAIL },
      create: { key: SETTING_CONTACT_EMAIL, value: contacto },
      update: { value: contacto },
    }),
    prisma.setting.upsert({
      where: { key: SETTING_POSTULACION_EMAIL },
      create: { key: SETTING_POSTULACION_EMAIL, value: postulacion },
      update: { value: postulacion },
    }),
  ]);
  invalidarSettingsCache();

  redirect("/admin/ajustes?msg=ok");
}
