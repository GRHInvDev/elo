/*
  Warnings:

  - You are about to drop the `suggestions` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "SuggestionStatus" AS ENUM ('NEW', 'IN_REVIEW', 'APPROVED', 'IN_PROGRESS', 'DONE', 'NOT_IMPLEMENTED');

-- DropForeignKey
ALTER TABLE "suggestions" DROP CONSTRAINT "suggestions_userId_fkey";

-- DropTable
DROP TABLE "suggestions";

-- CreateTable
CREATE TABLE "Suggestion" (
    "id" TEXT NOT NULL,
    "ideaNumber" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "submittedName" TEXT,
    "description" TEXT NOT NULL,
    "contribution" JSONB NOT NULL,
    "sector" JSONB,
    "dateRef" TIMESTAMP(3),
    "impact" JSONB,
    "capacity" JSONB,
    "effort" JSONB,
    "kpis" JSONB,
    "finalScore" INTEGER,
    "finalClassification" JSONB,
    "status" "SuggestionStatus" NOT NULL DEFAULT 'NEW',
    "rejectionReason" TEXT,
    "analystId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Suggestion_ideaNumber_key" ON "Suggestion"("ideaNumber");

-- CreateIndex
CREATE INDEX "Suggestion_status_createdAt_idx" ON "Suggestion"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Suggestion_finalScore_idx" ON "Suggestion"("finalScore");

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Suggestion" ADD CONSTRAINT "Suggestion_analystId_fkey" FOREIGN KEY ("analystId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
