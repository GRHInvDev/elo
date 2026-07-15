-- Banners do carrossel principal do dashboard, gerenciáveis em /admin/banners.
-- `linkUrl` é opcional: quando preenchido, o banner vira clicável (default não).
CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- Seed com os banners que antes eram hardcoded no dashboard (public/banners),
-- preservando o comportamento atual do carrossel após o deploy.
INSERT INTO "banners" ("id", "title", "imageUrl", "linkUrl", "published", "order", "updatedAt")
VALUES
    ('banner_intranet_1', 'Banners-intranet-1', '/banners/Banners-intranet-1.png', NULL, true, 0, NOW()),
    ('banner_intranet_2', 'Banners-intranet-2', '/banners/Banners-intranet-2.png', NULL, true, 1, NOW()),
    ('banner_intranet_4', 'Banners-intranet-4', '/banners/Banners-intranet-4.png', NULL, true, 2, NOW()),
    ('banner_intranet_6', 'Banners-intranet-6', '/banners/Banners-intranet-6.jpg', NULL, true, 3, NOW())
ON CONFLICT DO NOTHING;
