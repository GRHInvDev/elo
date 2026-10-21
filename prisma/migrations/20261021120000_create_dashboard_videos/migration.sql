-- Vídeos do carrossel/grid do dashboard (YouTube), gerenciáveis em /admin/videos.
CREATE TABLE IF NOT EXISTS "dashboard_videos" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "youtubeUrl" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dashboard_videos_pkey" PRIMARY KEY ("id")
);

-- Seed com os vídeos que antes eram hardcoded no dashboard,
-- preservando o comportamento atual do dashboard após o deploy.
INSERT INTO "dashboard_videos" ("id", "title", "youtubeUrl", "published", "order", "updatedAt")
VALUES
    ('video_dashboard_1', 'Institucional Cristallux', 'https://www.youtube.com/embed/AIlQ-EM35UQ?si=RomGdNhQLn6CuzCw', true, 0, NOW()),
    ('video_dashboard_2', 'Apresentação Box Distribuidor', 'https://www.youtube.com/embed/nW-_4kfXE4U?si=tFAOWTij0oSkdcCm', true, 1, NOW()),
    ('video_dashboard_3', 'Valores Grupo RHenz', 'https://www.youtube.com/embed/iSdz3gxUpAI', true, 2, NOW())
ON CONFLICT DO NOTHING;
