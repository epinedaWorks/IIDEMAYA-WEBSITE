-- AlterTable
ALTER TABLE "Postulacion" ADD COLUMN     "entrevistaInvitadaAt" TIMESTAMP(3),
ADD COLUMN     "entrevistaToken" TEXT;

-- CreateTable
CREATE TABLE "FranjaEntrevista" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "detalle" TEXT,
    "postulacionId" TEXT,
    "reservadaAt" TIMESTAMP(3),

    CONSTRAINT "FranjaEntrevista_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FranjaEntrevista_inicio_idx" ON "FranjaEntrevista"("inicio");

-- CreateIndex
CREATE INDEX "FranjaEntrevista_postulacionId_idx" ON "FranjaEntrevista"("postulacionId");

-- CreateIndex
CREATE UNIQUE INDEX "Postulacion_entrevistaToken_key" ON "Postulacion"("entrevistaToken");

-- AddForeignKey
ALTER TABLE "FranjaEntrevista" ADD CONSTRAINT "FranjaEntrevista_postulacionId_fkey" FOREIGN KEY ("postulacionId") REFERENCES "Postulacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
