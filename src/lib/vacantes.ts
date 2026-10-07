import { prisma } from "./prisma";

export function listarVacantesActivas() {
  return prisma.vacante.findMany({
    where: { activa: true },
    orderBy: [{ orden: "asc" }, { createdAt: "asc" }],
  });
}
