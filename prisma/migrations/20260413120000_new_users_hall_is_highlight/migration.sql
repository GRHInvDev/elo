-- AlterTable
ALTER TABLE "new_users_hall_entries" ADD COLUMN "isHighlight" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "new_users_hall_entries_published_isHighlight_createdAt_idx" ON "new_users_hall_entries"("published", "isHighlight", "createdAt");
