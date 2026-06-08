/* ============================================================
   weather-core.js — motor compartilhado do redesign de Clima
   - Mapa WMO completo (mais condições detectáveis)
   - Paletas por condição × dia/noite (cor segue o tempo)
   - Ícones SVG ilustrados (geométricos, animáveis)
   - Gerador de dados mock (atual + por hora + dia)
   Exposto em window.WeatherCore
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 1. Mapa WMO → condição (pt-BR) ---------- */
  // chave = bucket visual; label = texto exibido; group = animação base
  function wmo(code) {
    const m = {
      0:  { key: "clear",     label: "Céu limpo",            group: "sun" },
      1:  { key: "mostly",    label: "Predominante limpo",   group: "sun" },
      2:  { key: "partly",    label: "Parcialmente nublado", group: "partly" },
      3:  { key: "overcast",  label: "Nublado",              group: "cloud" },
      45: { key: "fog",       label: "Névoa",                group: "fog" },
      48: { key: "fog",       label: "Névoa congelante",     group: "fog" },
      51: { key: "drizzle",   label: "Garoa leve",           group: "drizzle" },
      53: { key: "drizzle",   label: "Garoa",                group: "drizzle" },
      55: { key: "drizzle",   label: "Garoa intensa",        group: "drizzle" },
      56: { key: "drizzle",   label: "Garoa congelante",     group: "drizzle" },
      57: { key: "drizzle",   label: "Garoa congelante",     group: "drizzle" },
      61: { key: "rain",      label: "Chuva fraca",          group: "rain" },
      63: { key: "rain",      label: "Chuva",                group: "rain" },
      65: { key: "rain",      label: "Chuva forte",          group: "rain" },
      66: { key: "rain",      label: "Chuva congelante",     group: "rain" },
      67: { key: "rain",      label: "Chuva congelante",     group: "rain" },
      71: { key: "snow",      label: "Neve fraca",           group: "snow" },
      73: { key: "snow",      label: "Neve",                 group: "snow" },
      75: { key: "snow",      label: "Neve forte",           group: "snow" },
      77: { key: "snow",      label: "Grãos de neve",        group: "snow" },
      80: { key: "showers",   label: "Pancadas de chuva",    group: "rain" },
      81: { key: "showers",   label: "Pancadas de chuva",    group: "rain" },
      82: { key: "showers",   label: "Pancadas fortes",      group: "rain" },
      85: { key: "snow",      label: "Pancadas de neve",     group: "snow" },
      86: { key: "snow",      label: "Pancadas de neve",     group: "snow" },
      95: { key: "storm",     label: "Tempestade",           group: "storm" },
      96: { key: "storm",     label: "Tempestade c/ granizo",group: "storm" },
      99: { key: "storm",     label: "Tempestade c/ granizo",group: "storm" },
    };
    return m[code] || { key: "overcast", label: "Condições variáveis", group: "cloud" };
  }

  /* ---------- 2. Paletas: cor segue a condição × hora ---------- */
  // Cada paleta: gradiente de fundo, cor de acento, tom de texto (light|dark),
  // e cor "atmosfera" para as partículas/brilhos.
  const PALETTES = {
    day: {
      clear:    { grad: ["#3d7fd6", "#6cb6ef", "#bfe2fa"], accent: "#ffc24d", text: "light", atmo: "#fff2c9" },
      mostly:   { grad: ["#3d7fd6", "#6cb6ef", "#bfe2fa"], accent: "#ffc24d", text: "light", atmo: "#fff2c9" },
      partly:   { grad: ["#4f8fcf", "#86b8e0", "#c7dcec"], accent: "#ffce5e", text: "light", atmo: "#ffffff" },
      overcast: { grad: ["#8190a1", "#a6b1bf", "#cdd4dc"], accent: "#5b6b7d", text: "light", atmo: "#ffffff" },
      fog:      { grad: ["#9aa2aa", "#bcc2c8", "#dde0e3"], accent: "#6b7783", text: "dark",  atmo: "#ffffff" },
      drizzle:  { grad: ["#5a7088", "#7e93a8", "#aebecd"], accent: "#7ecbe6", text: "light", atmo: "#cfe6f2" },
      rain:     { grad: ["#3f5266", "#5d738b", "#8499af"], accent: "#6db6e0", text: "light", atmo: "#bcd9ec" },
      showers:  { grad: ["#3f5266", "#5d738b", "#8499af"], accent: "#6db6e0", text: "light", atmo: "#bcd9ec" },
      snow:     { grad: ["#7a8ea8", "#a4b6cb", "#dde7f1"], accent: "#bcd6ea", text: "light", atmo: "#ffffff" },
      storm:    { grad: ["#39354f", "#534c70", "#7b6f9c"], accent: "#ffd24d", text: "light", atmo: "#cdbef0" },
    },
    night: {
      clear:    { grad: ["#0c1733", "#1a2a52", "#2f3f6b"], accent: "#9bb6ff", text: "light", atmo: "#dfe7ff" },
      mostly:   { grad: ["#0c1733", "#1a2a52", "#2f3f6b"], accent: "#9bb6ff", text: "light", atmo: "#dfe7ff" },
      partly:   { grad: ["#101a38", "#21305a", "#3a4a76"], accent: "#9bb6ff", text: "light", atmo: "#dfe7ff" },
      overcast: { grad: ["#1c222e", "#323a4a", "#4d5667"], accent: "#8ea0b8", text: "light", atmo: "#cfd8e6" },
      fog:      { grad: ["#262b32", "#3b424c", "#565d68"], accent: "#9aa6b3", text: "light", atmo: "#dde2e8" },
      drizzle:  { grad: ["#161e2b", "#2a3850", "#44566f"], accent: "#7ecbe6", text: "light", atmo: "#bcd9ec" },
      rain:     { grad: ["#131a26", "#26344a", "#3c4f68"], accent: "#6db6e0", text: "light", atmo: "#bcd9ec" },
      showers:  { grad: ["#131a26", "#26344a", "#3c4f68"], accent: "#6db6e0", text: "light", atmo: "#bcd9ec" },
      snow:     { grad: ["#1a2230", "#303d51", "#536580"], accent: "#bcd6ea", text: "light", atmo: "#ffffff" },
      storm:    { grad: ["#191430", "#2e2750", "#4a3f72"], accent: "#ffd24d", text: "light", atmo: "#cdbef0" },
    },
  };

  function palette(key, isNight) {
    const set = isNight ? PALETTES.night : PALETTES.day;
    return set[key] || set.overcast;
  }

  /* ---------- 3. Ícones SVG ilustrados ---------- */
  // Retornam string SVG (viewBox 0 0 100 100). Cores próprias para riqueza.
  // Classes wx-* permitem animar via CSS (definido na página).
  function gSun(cx, cy, r) {
    let rays = "";
    for (let i = 0; i < 12; i++) {
      const a = (i * 30) * Math.PI / 180;
      const x1 = cx + Math.cos(a) * (r + 6), y1 = cy + Math.sin(a) * (r + 6);
      const x2 = cx + Math.cos(a) * (r + 14), y2 = cy + Math.sin(a) * (r + 14);
      rays += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#ffd36b" stroke-width="3.4" stroke-linecap="round"/>`;
    }
    return `<g class="wx-rays">${rays}</g>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#wxSunG)"/>`;
  }
  function gMoon(cx, cy, r, id) {
    return `<defs><mask id="${id}"><rect width="100" height="100" fill="#000"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/>
      <circle cx="${cx + r * 0.55}" cy="${cy - r * 0.45}" r="${r * 0.92}" fill="#000"/></mask></defs>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#wxMoonG)" mask="url(#${id})"/>`;
  }
  function gStars() {
    const pts = [[20, 22, 1.6], [33, 14, 1.1], [78, 20, 1.7], [88, 34, 1.1], [16, 44, 1.2], [70, 12, 1.0]];
    return `<g class="wx-stars">` + pts.map(p =>
      `<circle cx="${p[0]}" cy="${p[1]}" r="${p[2]}" fill="#eaf0ff"/>`).join("") + `</g>`;
  }
  function gCloud(x, y, s, fill) {
    // nuvem composta de círculos + base arredondada
    return `<g transform="translate(${x},${y}) scale(${s})" fill="${fill}">
      <circle cx="22" cy="20" r="13"/>
      <circle cx="40" cy="13" r="17"/>
      <circle cx="58" cy="20" r="13"/>
      <rect x="9" y="20" width="62" height="20" rx="10"/>
    </g>`;
  }
  function gDrops(cx, n, color) {
    let d = "";
    const xs = n === 3 ? [-16, 0, 16] : [-20, -7, 7, 20];
    xs.forEach((dx, i) => {
      d += `<line class="wx-drop" style="--d:${i}" x1="${cx + dx}" y1="66" x2="${cx + dx - 3}" y2="80" stroke="${color}" stroke-width="3.4" stroke-linecap="round"/>`;
    });
    return `<g class="wx-rain">${d}</g>`;
  }
  function gFlakes(cx, color) {
    const xs = [-16, 2, 18];
    return `<g class="wx-snow">` + xs.map((dx, i) =>
      `<circle class="wx-flake" style="--d:${i}" cx="${cx + dx}" cy="72" r="3.1" fill="${color}"/>`).join("") + `</g>`;
  }
  function gBolt(cx) {
    return `<path class="wx-bolt" d="M${cx + 4} 58 L${cx - 9} 80 L${cx - 1} 80 L${cx - 6} 94 L${cx + 11} 70 L${cx + 2} 70 Z" fill="#ffd24d" stroke="#f6b800" stroke-width="1"/>`;
  }
  function gFog(cx) {
    return `<g class="wx-fog" stroke="#eef2f6" stroke-width="3.6" stroke-linecap="round">
      <line x1="${cx - 22}" y1="66" x2="${cx + 22}" y2="66"/>
      <line class="wx-fog2" x1="${cx - 18}" y1="76" x2="${cx + 26}" y2="76"/>
      <line x1="${cx - 24}" y1="86" x2="${cx + 18}" y2="86"/>
    </g>`;
  }

  const SVG_DEFS = `<defs>
    <radialGradient id="wxSunG" cx="40%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#fff0b8"/><stop offset="55%" stop-color="#ffcf57"/><stop offset="100%" stop-color="#ffb02e"/>
    </radialGradient>
    <linearGradient id="wxMoonG" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fdfbff"/><stop offset="100%" stop-color="#cdd6f5"/>
    </linearGradient>
    <linearGradient id="wxCloudG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#e3eaf2"/>
    </linearGradient>
    <linearGradient id="wxCloudD" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#c4ccd6"/><stop offset="100%" stop-color="#9aa6b4"/>
    </linearGradient>
  </defs>`;

  // monta o ícone para (key, isNight). size em px.
  function icon(key, isNight, size) {
    let uid = "m" + Math.floor(Math.random() * 1e6);
    const cloud = "url(#wxCloudG)";
    const cloudDark = "url(#wxCloudD)";
    let inner = "";
    switch (key) {
      case "clear":
      case "mostly":
        inner = isNight ? gStars() + gMoon(52, 46, 24, uid) : gSun(50, 46, 21);
        break;
      case "partly":
        inner = (isNight ? gMoon(34, 34, 17, uid) : gSun(33, 34, 16)) + gCloud(28, 40, 0.92, cloud);
        break;
      case "overcast":
        inner = gCloud(14, 26, 0.78, cloudDark) + gCloud(22, 34, 1.02, cloud);
        break;
      case "fog":
        inner = gCloud(22, 18, 0.92, cloud) + gFog(50);
        break;
      case "drizzle":
        inner = gCloud(22, 20, 0.98, cloud) + gDrops(50, 3, "#8fd0ec");
        break;
      case "rain":
      case "showers":
        inner = gCloud(20, 16, 1.04, cloud) + gDrops(50, 4, "#6db6e0");
        break;
      case "snow":
        inner = gCloud(22, 18, 0.98, cloud) + gFlakes(50, "#eaf3fb");
        break;
      case "storm":
        inner = gCloud(20, 14, 1.04, cloudDark) + gBolt(50) + gDrops(50, 3, "#6db6e0");
        break;
      default:
        inner = gCloud(22, 34, 1.0, cloud);
    }
    return `<svg class="wx-ico wx-${key}" width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${SVG_DEFS}${inner}</svg>`;
  }

  /* ---------- 4. Utilitários de tempo ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const hhmm = (h, m) => `${pad(h)}:${pad(m || 0)}`;

  /* ---------- 5. Gerador de dados mock ---------- */
  // Presets de condição realistas (inverno, Santa Cruz do Sul - junho).
  const PRESETS = {
    clear:    { code: 0,  temp: 23, feels: 22, max: 25, min: 11, uv: 6,  hum: 48, wind: 9,  precip: 0,   pop: 0  },
    partly:   { code: 2,  temp: 21, feels: 20, max: 24, min: 12, uv: 4,  hum: 58, wind: 12, precip: 0,   pop: 10 },
    overcast: { code: 3,  temp: 17, feels: 16, max: 19, min: 12, uv: 2,  hum: 72, wind: 15, precip: 0,   pop: 25 },
    fog:      { code: 45, temp: 13, feels: 12, max: 18, min: 10, uv: 1,  hum: 94, wind: 5,  precip: 0,   pop: 20 },
    rain:     { code: 63, temp: 15, feels: 13, max: 17, min: 11, uv: 1,  hum: 88, wind: 22, precip: 4.6, pop: 90 },
    storm:    { code: 95, temp: 19, feels: 18, max: 23, min: 14, uv: 2,  hum: 80, wind: 31, precip: 12,  pop: 95 },
    snow:     { code: 73, temp: 1,  feels: -3, max: 3,  min: -2, uv: 1,  hum: 90, wind: 18, precip: 6,   pop: 85 },
  };

  function buildHourly(now, base, scatter) {
    // 12 horas a partir de "now". Curva senoidal suave + variação de códigos.
    const out = [];
    for (let i = 0; i < 12; i++) {
      const h = (now + i) % 24;
      // temperatura: pico ~15h, mínimo ~6h
      const t = base.temp + Math.round(4 * Math.sin(((h - 9) / 24) * Math.PI * 2)) - (i > 7 ? 1 : 0);
      let code = base.code;
      // espalha algumas variações para o strip ficar vivo
      if (scatter) {
        if (i === 3) code = base.code === 0 ? 1 : base.code;
        if (i === 6 && base.key !== "rain") code = base.code <= 2 ? 2 : base.code;
        if (i === 9 && base.code === 2) code = 1;
      }
      const isN = h < 7 || h >= 18;
      out.push({ h, temp: t, code, night: isN });
    }
    return out;
  }

  function makeData(conditionKey, isNight, enterprise) {
    const p = PRESETS[conditionKey] || PRESETS.partly;
    const cond = wmo(p.code);
    const nowH = isNight ? 21 : 14;
    const nowM = 35;
    const cities = {
      Box: "Santa Cruz do Sul", RHenz: "Santa Cruz do Sul", Cristallux: "Santa Cruz do Sul",
      Box_Filial: "Venâncio Aires", Cristallux_Filial: "Cachoeirinha",
    };
    const sunrise = { h: 6, m: 58 }, sunset = { h: 17, m: 41 };
    const hourly = buildHourly(nowH, Object.assign({ key: cond.key }, p), true);
    return {
      city: cities[enterprise] || "Santa Cruz do Sul",
      uf: "RS",
      now: { h: nowH, m: nowM },
      isNight,
      code: p.code,
      cond,                       // {key,label,group}
      temp: p.temp, feels: p.feels, max: p.max, min: p.min,
      uv: p.uv, humidity: p.hum, wind: p.wind, precip: p.precip, pop: p.pop,
      sunrise, sunset,
      hourly,
      palette: palette(cond.key, isNight),
    };
  }

  /* UV → rótulo + cor */
  function uvInfo(uv) {
    if (uv <= 2) return { label: "Baixo", color: "#4caf72" };
    if (uv <= 5) return { label: "Moderado", color: "#e0b13a" };
    if (uv <= 7) return { label: "Alto", color: "#e07d3a" };
    if (uv <= 10) return { label: "Muito alto", color: "#d8453f" };
    return { label: "Extremo", color: "#9b59b6" };
  }

  /* posição do sol no arco (0..1) entre nascer e pôr */
  function sunProgress(nowH, nowM, sr, ss) {
    const n = nowH * 60 + nowM, a = sr.h * 60 + sr.m, b = ss.h * 60 + ss.m;
    return Math.max(0, Math.min(1, (n - a) / (b - a)));
  }

  window.WeatherCore = {
    wmo, palette, PALETTES, PRESETS,
    icon, hhmm, pad,
    makeData, uvInfo, sunProgress,
    CONDITION_LIST: [
      { key: "clear", label: "Limpo" },
      { key: "partly", label: "Parcial" },
      { key: "overcast", label: "Nublado" },
      { key: "fog", label: "Névoa" },
      { key: "rain", label: "Chuva" },
      { key: "storm", label: "Tempestade" },
      { key: "snow", label: "Neve" },
    ],
  };
})();
