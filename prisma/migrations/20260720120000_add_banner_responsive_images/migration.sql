-- Imagens do banner por contexto de exibição.
-- `imageUrl` continua sendo a base/desktop (obrigatória). As colunas abaixo são
-- opcionais e, quando ausentes, o carrossel faz fallback para `imageUrl`.
--   * imageUrlMobile: usada em telas pequenas (breakpoint < md)
--   * imageUrlTotem:  usada por usuários de perfil Totem (role_config.isTotem)
ALTER TABLE "banners" ADD COLUMN "imageUrlMobile" TEXT;
ALTER TABLE "banners" ADD COLUMN "imageUrlTotem" TEXT;
