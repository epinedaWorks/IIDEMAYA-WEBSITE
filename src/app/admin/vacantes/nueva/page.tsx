import Link from "next/link";
import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/require-admin";
import VacanteForm from "@/components/admin/VacanteForm";
import { crearVacante } from "../actions";

export const metadata: Metadata = { title: "Nueva vacante | Panel IIDEMAYA" };

export default async function NuevaVacante({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdminSession();
  const { error } = await searchParams;

  return (
    <div>
      <Link href="/admin/vacantes" className="text-sm text-brand hover:underline">
        ← Volver a vacantes
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-brand-dark">Nueva vacante</h1>
      <VacanteForm action={crearVacante} error={Boolean(error)} textoBoton="Crear vacante" />
    </div>
  );
}
