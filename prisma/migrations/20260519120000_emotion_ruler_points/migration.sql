-- AlterTable: add pointsPerResponse to emotion_rulers
ALTER TABLE "emotion_rulers" ADD COLUMN "pointsPerResponse" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: add pointsEarned to emotion_ruler_responses
ALTER TABLE "emotion_ruler_responses" ADD COLUMN "pointsEarned" INTEGER NOT NULL DEFAULT 0;
