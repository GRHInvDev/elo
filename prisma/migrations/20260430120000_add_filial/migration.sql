-- CreateTable for Filial
CREATE TABLE "filiais" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "filiais_pkey" PRIMARY KEY ("id")
);

-- AddColumn filialId to User
ALTER TABLE "users" ADD COLUMN "filialId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "filiais_code_key" ON "filiais"("code");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "filiais"("id") ON DELETE SET NULL ON UPDATE CASCADE;
