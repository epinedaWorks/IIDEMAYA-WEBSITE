-- CreateEnum
CREATE TYPE "InteresPostulacion" AS ENUM ('SIN_VALORAR', 'POSIBLE_BUEN_CANDIDATO', 'CON_INTERES', 'DESCARTADO');

-- AlterTable
ALTER TABLE "Postulacion" ADD COLUMN     "interes" "InteresPostulacion" NOT NULL DEFAULT 'SIN_VALORAR';
