-- Adiciona coluna videoUrl na tabela posts para vídeos embutidos do YouTube
ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
