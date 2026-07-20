-- Variações de imagem por tamanho de tela para os banners do carrossel.
-- `imageUrlMobile` e `imageUrlTotem` são opcionais; quando nulas, a exibição
-- cai na `imageUrl` padrão (desktop).
ALTER TABLE "banners" ADD COLUMN "imageUrlMobile" TEXT;
ALTER TABLE "banners" ADD COLUMN "imageUrlTotem" TEXT;
