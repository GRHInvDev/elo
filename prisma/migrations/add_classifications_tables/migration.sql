-- CreateEnum
CREATE TYPE "ClassificationType" AS ENUM ('IMPACT', 'CAPACITY', 'EFFORT');

-- CreateTable
CREATE TABLE "classifications" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "type" "ClassificationType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpis" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kpis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "classifications_type_idx" ON "classifications"("type");

-- CreateIndex
CREATE UNIQUE INDEX "kpis_name_key" ON "kpis"("name");
