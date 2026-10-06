-- Limpar possíveis nulos residuais e garantir consistência com o schema do Prisma (String[] @default([]))
UPDATE "public"."forms" SET "allowedUsers" = ARRAY[]::TEXT[] WHERE "allowedUsers" IS NULL;
UPDATE "public"."forms" SET "allowedSectors" = ARRAY[]::TEXT[] WHERE "allowedSectors" IS NULL;
UPDATE "public"."forms" SET "ownerIds" = ARRAY[]::TEXT[] WHERE "ownerIds" IS NULL;

-- Remover elementos nulos de dentro dos arrays caso existam
UPDATE "public"."forms" 
SET "allowedUsers" = ARRAY(SELECT u FROM unnest("allowedUsers") AS u WHERE u IS NOT NULL)
WHERE array_position("allowedUsers", NULL) IS NOT NULL;

UPDATE "public"."forms" 
SET "allowedSectors" = ARRAY(SELECT s FROM unnest("allowedSectors") AS s WHERE s IS NOT NULL)
WHERE array_position("allowedSectors", NULL) IS NOT NULL;

UPDATE "public"."forms" 
SET "ownerIds" = ARRAY(SELECT o FROM unnest("ownerIds") AS o WHERE o IS NOT NULL)
WHERE array_position("ownerIds", NULL) IS NOT NULL;

-- AlterTable
ALTER TABLE "public"."forms" ALTER COLUMN "allowedUsers" SET NOT NULL;
ALTER TABLE "public"."forms" ALTER COLUMN "allowedUsers" SET DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "public"."forms" ALTER COLUMN "allowedSectors" SET NOT NULL;
ALTER TABLE "public"."forms" ALTER COLUMN "allowedSectors" SET DEFAULT ARRAY[]::TEXT[];

ALTER TABLE "public"."forms" ALTER COLUMN "ownerIds" SET NOT NULL;
ALTER TABLE "public"."forms" ALTER COLUMN "ownerIds" SET DEFAULT ARRAY[]::TEXT[];
