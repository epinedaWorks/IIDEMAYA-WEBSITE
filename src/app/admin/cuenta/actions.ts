"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { validarPassword } from "@/lib/password";

export async function cambiarPassword(formData: FormData) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/admin/login");

  const actual = String(formData.get("actual") || "");
  const nueva = String(formData.get("nueva") || "");
  const confirmar = String(formData.get("confirmar") || "");

  const usuario = await prisma.adminUser.findUnique({ where: { email: email! } });
  if (!usuario) redirect("/admin/login");

  const actualValida = await bcrypt.compare(actual, usuario!.passwordHash);
  if (!actualValida) redirect("/admin/cuenta?msg=actual_incorrecta");

  if (nueva !== confirmar) redirect("/admin/cuenta?msg=no_coincide");

  const validacion = validarPassword(nueva);
  if (!validacion.ok) redirect(`/admin/cuenta?msg=politica`);

  const mismaQueActual = await bcrypt.compare(nueva, usuario!.passwordHash);
  if (mismaQueActual) redirect("/admin/cuenta?msg=igual_actual");

  const passwordHash = await bcrypt.hash(nueva, 12);
  await prisma.adminUser.update({ where: { email: email! }, data: { passwordHash } });

  redirect("/admin/cuenta?msg=ok");
}
