import type { Metadata } from "next";
import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Ingresar | Panel IIDEMAYA",
  robots: { index: false, follow: false },
};

export default function AdminLogin() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-brand-light px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-black/5 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-brand-dark">Panel IIDEMAYA</h1>
        <p className="mt-1 text-sm text-foreground/60">Ingresa con tu correo y contraseña.</p>
        <LoginForm />
      </div>
    </div>
  );
}
