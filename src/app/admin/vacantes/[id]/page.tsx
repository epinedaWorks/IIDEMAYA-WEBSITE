import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { requireAdminSession } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import VacanteForm from "@/components/admin/VacanteForm";
import { actualizarVacante } from "../actions";

export const metadata: Metadata = { title: "Editar vacante | Panel IIDEMAYA" };
export const dynamic = "force-dynamic";

export default async function EditarVacante({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdminSession();
  const [{ id }, { error }] = await Promise.all([params, searchParams]);

  const vacante = await prisma.vacante.findUnique({ where: { id } });
  if (!vacante) notFound();

  return (
    <div>
      <Link href="/admin/vacantes" className="text-sm text-brand hover:underline">
        ← Volver a vacantes
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-brand-dark">Editar vacante</h1>
      <VacanteForm
        action={actualizarVacante.bind(null, vacante.id)}
        valores={vacante}
        error={Boolean(error)}
        textoBoton="Guardar cambios"
      />
    </div>
  );
}
