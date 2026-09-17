-- CreateEnum
CREATE TYPE "ModalidadTrabajo" AS ENUM ('REMOTO', 'PRESENCIAL', 'HIBRIDO');

-- CreateEnum
CREATE TYPE "EstadoPostulacion" AS ENUM ('NUEVA', 'EN_REVISION', 'ENTREVISTA', 'RECHAZADA', 'CONTRATADA');

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comentario" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "postulacionId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,

    CONSTRAINT "Comentario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Postulacion" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "telefono" TEXT,
    "opinionSociedad" TEXT NOT NULL,
    "opinionPoblacionMaya" TEXT NOT NULL,
    "comodidadTrabajarConPoblacionMaya" TEXT NOT NULL,
    "opinionFormaPensarActuarMaya" TEXT NOT NULL,
    "opinionCulturaMaya" TEXT NOT NULL,
    "opinionCosmovisionMaya" TEXT NOT NULL,
    "disposicionCeremoniaMaya" TEXT NOT NULL,
    "disponibilidadTiempo" TEXT NOT NULL,
    "disponibilidadHorario" TEXT NOT NULL,
    "diaNoDisponible" TEXT,
    "trabajoBajoPresion" TEXT NOT NULL,
    "porQueEstaOrganizacion" TEXT NOT NULL,
    "etapaCarrera" TEXT NOT NULL,
    "porQueContratarlo" TEXT NOT NULL,
    "expectativaSalarial" TEXT NOT NULL,
    "modalidadTrabajo" "ModalidadTrabajo" NOT NULL,
    "puedeFacturar" BOOLEAN NOT NULL,
    "tieneVehiculo" BOOLEAN NOT NULL,
    "esEstudianteActual" BOOLEAN NOT NULL,
    "trabajaActualmente" BOOLEAN NOT NULL,
    "cvBlobKey" TEXT NOT NULL,
    "documentoBlobKey" TEXT,
    "estado" "EstadoPostulacion" NOT NULL DEFAULT 'NUEVA',

    CONSTRAINT "Postulacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_postulacionId_fkey" FOREIGN KEY ("postulacionId") REFERENCES "Postulacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "AdminUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
