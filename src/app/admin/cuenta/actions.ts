"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { validarPassword } from "@/lib/password";
import { borrarIntentos, huella, intentosEn, registrarIntento } from "@/lib/rate-limit";

const MAX_FALLOS = 5;
const VENTANA_MS = 15 * 60 * 1000;

export async function cambiarPassword(formData: FormData) {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) redirect("/admin/login");

  const actual = String(formData.get("actual") || "");
  const nueva = String(formData.get("nueva") || "");
  const confirmar = String(formData.get("confirmar") || "");

  const usuario = await prisma.adminUser.findUnique({ where: { email: email! } });
  if (!usuario) redirect("/admin/login");

  // Quien tenga una sesión abierta no debe poder adivinar la contraseña
  // actual a base de intentos.
  const clave = `pwd:c:${huella(email!)}`;
  if ((await intentosEn(clave, VENTANA_MS)) >= MAX_FALLOS) {
    redirect("/admin/cuenta?msg=bloqueado");
  }

  const actualValida = await bcrypt.compare(actual.slice(0, 200), usuario!.passwordHash);
  if (!actualValida) {
    await registrarIntento(clave);
    redirect("/admin/cuenta?msg=actual_incorrecta");
  }

  if (nueva !== confirmar) redirect("/admin/cuenta?msg=no_coincide");

  const validacion = validarPassword(nueva);
  if (!validacion.ok) redirect(`/admin/cuenta?msg=politica`);

  const mismaQueActual = await bcrypt.compare(nueva.slice(0, 200), usuario!.passwordHash);
  if (mismaQueActual) redirect("/admin/cuenta?msg=igual_actual");

  const passwordHash = await bcrypt.hash(nueva, 12);
  // passwordChangedAt invalida toda sesión iniciada antes de este momento
  // (incluida esta): por seguridad hay que volver a ingresar.
  await prisma.adminUser.update({
    where: { email: email! },
    data: { passwordHash, passwordChangedAt: new Date() },
  });
  await borrarIntentos(clave);

  redirect("/admin/login?msg=password");
}
