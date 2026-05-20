-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN "filialId" TEXT;

-- CreateIndex
CREATE INDEX "restaurants_filialId_idx" ON "restaurants"("filialId");

-- AddForeignKey
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "filiais"("id") ON DELETE SET NULL ON UPDATE CASCADE;
