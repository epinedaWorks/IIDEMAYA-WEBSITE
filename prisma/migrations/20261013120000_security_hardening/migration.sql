-- AlterTable
ALTER TABLE "AdminUser" ADD COLUMN     "passwordChangedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "LimiteTasa" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LimiteTasa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LimiteTasa_clave_createdAt_idx" ON "LimiteTasa"("clave", "createdAt");
