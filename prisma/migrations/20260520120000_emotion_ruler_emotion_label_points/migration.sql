-- AlterTable: add label and points to emotion_ruler_emotions
ALTER TABLE "emotion_ruler_emotions" ADD COLUMN "label" TEXT;
ALTER TABLE "emotion_ruler_emotions" ADD COLUMN "points" INTEGER NOT NULL DEFAULT 0;
