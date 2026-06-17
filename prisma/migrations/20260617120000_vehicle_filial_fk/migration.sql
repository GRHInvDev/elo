-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN "filialId" TEXT;

-- CreateIndex
CREATE INDEX "vehicles_filialId_idx" ON "vehicles"("filialId");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "filiais"("id") ON DELETE SET NULL ON UPDATE CASCADE;
