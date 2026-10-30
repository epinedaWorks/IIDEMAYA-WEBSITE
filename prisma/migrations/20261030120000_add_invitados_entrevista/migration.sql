-- AlterTable
ALTER TABLE "FranjaEntrevista" ADD COLUMN     "invitadoId" TEXT;

-- CreateTable
CREATE TABLE "InvitadoEntrevista" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "invitadaAt" TIMESTAMP(3),

    CONSTRAINT "InvitadoEntrevista_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvitadoEntrevista_correo_key" ON "InvitadoEntrevista"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "InvitadoEntrevista_token_key" ON "InvitadoEntrevista"("token");

-- CreateIndex
CREATE INDEX "FranjaEntrevista_invitadoId_idx" ON "FranjaEntrevista"("invitadoId");

-- AddForeignKey
ALTER TABLE "FranjaEntrevista" ADD CONSTRAINT "FranjaEntrevista_invitadoId_fkey" FOREIGN KEY ("invitadoId") REFERENCES "InvitadoEntrevista"("id") ON DELETE SET NULL ON UPDATE CASCADE;
