# Handoff: Redesign do Componente de Clima — "Céu dinâmico" (Variação A)

## Visão geral
Redesenho do `WeatherWidget` da intranet (3ª coluna do grid do dashboard no desktop; slide do
carrossel no mobile). O objetivo: **mais bonito e agradável**, **mantendo otimização e
funcionalidade**, e **ampliando os tempos/condições detectáveis e exibíveis**.

A direção escolhida pelo time foi a **Variação A — "Céu dinâmico"**: card full-bleed cujo
gradiente, ícone e atmosfera **mudam conforme a condição do tempo e o período (dia/noite)**.

## Sobre os arquivos deste pacote
- `weather-widget.tsx` — **componente de produção pronto** (substitui
  `src/components/dashboard/weather-widget.tsx`). É TSX/React no stack atual (Next client component,
  Tailwind, tokens shadcn, `lucide-react`, `@/components/ui/skeleton`, `@/lib/utils`). **Mantém a
  mesma assinatura de props** (`className`, `enterprise`) e a mesma lógica de localização por
  empresa + geolocalização opcional, então é praticamente drop-in.
- `globals-additions.css` — bloco de CSS (keyframes/animações `wx-*`) para **colar no final de
  `src/styles/globals.css`**. As animações são puro CSS/transform e respeitam
  `prefers-reduced-motion`.
- `_reference/` — o **protótipo HTML** usado para validar o design (`Clima Redesign.html` +
  `weather-core.js` + `variations.jsx`). São **referências de design**, não código para copiar.
  O `.tsx` já é a tradução fiel da Variação A para o codebase.

> Os HTMLs em `_reference/` mostram look & behavior pretendidos. A entrega real é o
> `weather-widget.tsx` — recriação da Variação A usando os padrões do app.

## Fidelidade
**Alta fidelidade (hi-fi).** Cores, tipografia, espaçamentos e animações são finais. O `.tsx`
reproduz a Variação A pixel-a-pixel dentro do stack existente.

---

## Como instalar (passo a passo)
1. **Substituir** `src/components/dashboard/weather-widget.tsx` pelo `weather-widget.tsx` deste pacote.
2. **Colar** o conteúdo de `globals-additions.css` ao final de `src/styles/globals.css`.
   - As animações antigas exclusivas do widget antigo (`spin-slow`, `float`, `rain`, `cloudMove`,
     `windParticle`, `windLine`, `sunRays`) **podem ser removidas** se não forem usadas em outro
     lugar — confira com busca antes. As novas usam prefixo `wx-` para não colidir.
3. Nenhuma mudança em `videos-carousel.tsx` é necessária — o uso continua
   `<WeatherWidget className="h-full" enterprise={enterprise} />` nos dois contextos.
4. Sem novas dependências. Sem chave de API.

---

## Dados (API)
Fonte: **Open-Meteo** (gratuita, sem chave). Uma única chamada agora traz:

```
https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}
  &current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m
  &hourly=temperature_2m,weather_code,is_day,uv_index
  &daily=temperature_2m_max,temperature_2m_min,uv_index_max,sunrise,sunset
  &timezone=America/Sao_Paulo&forecast_days=2
```

Cidade via geocoding reverso (`geocoding-api.open-meteo.com`), igual ao componente atual.

### Ampliação — o que passou a ser detectável/exibível
- **Condições (mapa WMO completo)** — antes "tudo virava chuva/nublado". Agora 8 buckets visuais:
  `clear`, `partly`, `overcast`, `fog`, `drizzle`, `rain`, `snow`, `storm` — incluindo névoa, garoa,
  chuva/garoa congelante, neve, grãos de neve, pancadas e tempestade com granizo. Função `wmo(code)`.
- **Período dia/noite** — via `current.is_day` (e por hora via `hourly.is_day`). Define paleta,
  ícone (sol↔lua+estrelas) e atmosfera.
- **Tempos exibidos** — faixa **por hora** (próximas 8h, só desktop), **sensação térmica**
  (`apparent_temperature`), **máx/mín do dia** (`daily`), **índice UV** (com rótulo Baixo→Extremo) e
  **nascer/pôr do sol** (arco com posição do sol).

---

## Telas / Views
O **mesmo componente** se adapta por breakpoint (espelhando o `videos-carousel`):
desktop = `md:grid` (visível em `md+`); mobile = carrossel (visível abaixo de `md`).

### 1) Desktop — card vertical (3ª coluna, ~340 × 400, `h-[400px]`)
- **Layout:** coluna flex, `padding:16px`. De cima para baixo:
  1. **Topo:** `MapPin` (12.5px) + cidade (13px/700) à esquerda; hora atual à direita (cor `sub`).
  2. **Hero:** ícone ilustrado 72px (flutua suave) + temperatura `58px/800`, `tracking -0.03em`;
     abaixo, condição (15px/600) e linha "Sensação X° · ↑máx° ↓mín°" (12px, cor `sub`).
  3. **Faixa por hora:** 8 colunas iguais (`flex-1`), borda superior sutil. Cada coluna: rótulo
     ("Agora"/"14h", 10.5px), ícone 24px, temperatura (12.5px; "Agora" em 800).
  4. **Rodapé (2 colunas):** esquerda → label "ÍNDICE UV" + barra UV (gradiente verde→vermelho com
     marcador branco) + linha "💧 umidade% · 🌬 vento km/h"; direita → **arco sol/lua** com
     horários ↑nascer ↓pôr.

### 2) Mobile — card horizontal (slide do carrossel, `aspect-video`, ~352 × 196)
- **Layout:** Topo + Hero (ícone 72px + temp 58px + condição + sensação/máx-mín) e, no rodapé,
  **uma linha compacta** de stats: `UV {n}` · `💧 umidade%` · `🌬 vento` · `↑máx° ↓mín°`.
- A faixa por hora e o rodapé de 2 colunas **não** aparecem no mobile (espaço curto) — controlado por
  `hidden md:flex` / `mt-auto … md:hidden`.

---

## Tokens de design
### Paletas (gradiente do card, por condição × período)
Gradiente aplicado como `linear-gradient(165deg, g0, g1 52%, g2)`. Texto branco, exceto **névoa de
dia** (texto escuro). Tabela completa está em `PALETTES` no `.tsx`. Exemplos:

| Condição   | Dia (g0 → g1 → g2)              | Acento (dia) | Noite (g0 → g1 → g2)            |
|------------|--------------------------------|--------------|--------------------------------|
| clear      | #3d7fd6 → #6cb6ef → #bfe2fa     | #ffc24d      | #0c1733 → #1a2a52 → #2f3f6b     |
| partly     | #4f8fcf → #86b8e0 → #c7dcec     | #ffce5e      | #101a38 → #21305a → #3a4a76     |
| overcast   | #8190a1 → #a6b1bf → #cdd4dc     | #5b6b7d      | #1c222e → #323a4a → #4d5667     |
| fog        | #9aa2aa → #bcc2c8 → #dde0e3     | #6b7783      | #262b32 → #3b424c → #565d68     |
| drizzle    | #5a7088 → #7e93a8 → #aebecd     | #7ecbe6      | #161e2b → #2a3850 → #44566f     |
| rain       | #3f5266 → #5d738b → #8499af     | #6db6e0      | #131a26 → #26344a → #3c4f68     |
| snow       | #7a8ea8 → #a4b6cb → #dde7f1     | #bcd6ea      | #1a2230 → #303d51 → #536580     |
| storm      | #39354f → #534c70 → #7b6f9c     | #ffd24d      | #191430 → #2e2750 → #4a3f72     |

### UV (rótulo + cor)
≤2 Baixo `#4caf72` · ≤5 Moderado `#e0b13a` · ≤7 Alto `#e07d3a` · ≤10 Muito alto `#d8453f` · >10 Extremo `#9b59b6`.

### Texto sobre gradiente
- Principal: `#fff` (ou `#13171b` quando `text:"dark"`).
- Secundário (`sub`): `rgba(255,255,255,.78)` (ou `rgba(20,24,28,.6)`).
- Bordas internas: `rgba(255,255,255,.16–.18)` (claro) / `rgba(0,0,0,.08)` (escuro).

### Tipografia
Fonte herdada do app (Geist via `--font-geist-sans`). Escala: temperatura 58px/800
(`tracking -0.03em`), condição 15px/600, cidade 13px/700, rótulos 10.5–12.5px.

### Raio / sombra
Card `rounded-2xl` (segue o wrapper do carrossel). Sombra vem do wrapper existente
(`shadow-lg`/`rounded-2xl` em `videos-carousel.tsx`).

---

## Interações & comportamento
- **Adaptação automática** de cor/ícone/atmosfera ao `weather_code` + `is_day`.
- **Animações (sutis, CSS):** raios do sol giram (26s); ícone flutua (5s); estrelas piscam; chuva/
  garoa em linhas caindo; neve à deriva; tempestade pisca raio + flash; nuvens à deriva; névoa
  oscila. Tudo desligado em `prefers-reduced-motion: reduce`.
- **Arco do sol:** posição do ponto = progresso entre `sunrise` e `sunset`; à noite o ponto fica no
  pôr e usa a cor de acento.
- **Loading:** `Skeleton` (mantido). **Erro:** retorna `null` (mantido — não quebra o grid).
- **Localização:** fallback imediato por empresa; tenta `geolocation` com timeout de 3s.

## Estado (hooks)
- `location {lat,lon}` — empresa → fallback; atualizado por geolocalização se permitida.
- `cityName` — geocoding reverso.
- `weather` — objeto `WeatherData` (atual + `hourly[8]` + diário + uv + sunrise/sunset).
- `loading` / `error`.

## Assets
Nenhum binário. Ícones de clima são **SVG inline** (componente `WeatherIcon`), e `MapPin` vem do
`lucide-react`. Sem imagens externas.

## Arquivos de referência (neste pacote)
- `_reference/Clima Redesign.html` — protótipo com as 3 variações + controles (condição, dia/noite).
- `_reference/weather-core.js`, `_reference/variations.jsx` — lógica/UI do protótipo.
- `weather-widget.tsx` — **implementação final da Variação A** (use este).
- `globals-additions.css` — animações para `globals.css`.

## Checklist de verificação
- [ ] Testar todas as condições (claro, parcial, nublado, névoa, garoa, chuva, neve, tempestade) em
      dia e noite — gradiente, ícone e atmosfera coerentes.
- [ ] Desktop (`md+`): faixa por hora com 8 colunas, barra UV e arco do sol sem corte.
- [ ] Mobile: hero + linha compacta de stats cabendo no `aspect-video` sem overflow.
- [ ] `prefers-reduced-motion`: animações paradas.
- [ ] Dark mode do app não interfere (o card tem fundo próprio por gradiente).
