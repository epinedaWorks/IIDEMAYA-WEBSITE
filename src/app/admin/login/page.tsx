import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Ingresar | Panel IIDEMAYA",
  robots: { index: false, follow: false },
};

const AVISOS: Record<string, string> = {
  password: "Contraseña actualizada. Por seguridad, ingresa de nuevo con la nueva.",
  inactividad: "Tu sesión se cerró por inactividad. Ingresa de nuevo para continuar.",
};

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ msg?: string }>;
}) {
  // Con sesión vigente no tiene sentido ver el login.
  if (await auth()) redirect("/admin");

  const { msg } = await searchParams;
  const aviso = msg ? AVISOS[msg] : undefined;

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-brand-light px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-brand-dark">Panel IIDEMAYA</h1>
        <p className="mt-1 text-sm text-foreground/60">Ingresa con tu correo y contraseña.</p>
        {aviso && (
          <p className="mt-4 rounded-lg bg-brand-light px-4 py-2 text-sm font-medium text-brand">
            {aviso}
          </p>
        )}
        <LoginForm />
      </div>
    </div>
  );
}
