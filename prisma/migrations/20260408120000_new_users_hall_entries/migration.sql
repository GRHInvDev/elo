-- CreateTable
CREATE TABLE "new_users_hall_entries" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "setor" VARCHAR,
    "imageUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "new_users_hall_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "new_users_hall_entries_userId_key" ON "new_users_hall_entries"("userId");

-- CreateIndex
CREATE INDEX "new_users_hall_entries_published_createdAt_idx" ON "new_users_hall_entries"("published", "createdAt");

-- AddForeignKey
ALTER TABLE "new_users_hall_entries" ADD CONSTRAINT "new_users_hall_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
