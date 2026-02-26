# Módulos — ELO

**Documentação por área funcional**

Cada arquivo abaixo descreve um módulo do Sistema de Intranet ELO: rotas, procedures tRPC, componentes e modelos Prisma. O levantamento completo está no [DOCUMENTACAO-MESTRE.md](../DOCUMENTACAO-MESTRE.md#2-levantamento-de-funcionalidades).

---

## Índice dos módulos

| Módulo | Documento | Resumo |
|--------|-----------|--------|
| Dashboard | [dashboard.md](dashboard.md) | Página inicial, widgets, agregação de dados |
| Notícias (posts) | [news.md](news.md) | Posts, reações e comentários |
| Eventos e flyers | [events.md](events.md) | Eventos e flyers |
| Salas e reservas | [rooms.md](rooms.md) | Rooms e bookings |
| Veículos e locações | [cars.md](cars.md) | Frota e vehicle-rent |
| Aniversariantes | *(integrado ao dashboard)* | Birthday router e componentes |
| Formulários e chamados | [forms.md](forms.md) | Forms e form-response |
| Alimentação | [food.md](food.md) | Restaurantes, cardápio, pedidos |
| Loja | [shop.md](shop.md) | Produtos, product-order e pré-cadastro Lojinha (SIGIN) |
| Política LGPD | [lgpd.md](lgpd.md) | Página /lgpd e uso no sistema (Lojinha, Dados privados) |
| Ideias / sugestões e KPIs | [ideias.md](ideias.md), [sugestoes.md](sugestoes.md) | Sugestões, classification, kpi |
| Chat e grupos | *(ver DOCUMENTACAO-MESTRE § 2.12)* | chatMessage, adminChatGroups |
| Ramais e extensões | *(ver DOCUMENTACAO-MESTRE § 2.13)* | user router (extensions) |
| Gestão de qualidade | *(ver DOCUMENTACAO-MESTRE § 2.14)* | qualityDocument, qualityEnum, qualityAccess |
| Régua de emoções | *(ver DOCUMENTACAO-MESTRE § 2.15)* | emotionRuler |
| Painel administrativo | [admin.md](admin.md) | Admin e subpáginas |

---

## Referências

- [Documentação Mestre](../DOCUMENTACAO-MESTRE.md) — relatório técnico e levantamento de funcionalidades
- [API tRPC](../04-API/trpc.md) — routers e procedures
