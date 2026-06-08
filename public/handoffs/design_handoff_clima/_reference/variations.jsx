/* variations.jsx — as 3 variações do card de Clima (React, via Babel) */
const WC = window.WeatherCore;

/* ---------- helpers de cor ---------- */
function withAlpha(hex, a) {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16), g = parseInt(h.substring(2, 4), 16), b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

/* ---------- ícone ---------- */
function WxIcon({ k, night, size, cls }) {
  const html = WC.icon(k, night, size);
  return <span className={cls} style={{ display: "inline-flex", lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ---------- atmosfera animada (sutil) ---------- */
function Atmosphere({ data }) {
  const g = data.cond.group, atmo = data.palette.atmo;
  if ((g === "sun" || g === "partly") && !data.isNight) {
    return <div className="wx-atmo">
      <div className="wx-glow" style={{ background: `radial-gradient(circle, ${withAlpha(atmo, 0.55)}, transparent 70%)` }} />
    </div>;
  }
  if ((g === "sun") && data.isNight) {
    const stars = Array.from({ length: 18 }).map((_, i) => ({
      left: (i * 53) % 100, top: (i * 37) % 60, d: (i % 5) * 0.4, s: 1 + (i % 3) * 0.5,
    }));
    return <div className="wx-atmo">{stars.map((s, i) =>
      <span key={i} className="wx-star" style={{ left: s.left + "%", top: s.top + "%", width: s.s, height: s.s, animationDelay: s.d + "s" }} />)}</div>;
  }
  if (g === "rain" || g === "storm" || g === "drizzle") {
    const n = g === "drizzle" ? 14 : 22;
    const drops = Array.from({ length: n }).map((_, i) => ({ left: (i * 4.7) % 100, d: (i * 0.13) % 1.6, dur: 0.7 + (i % 4) * 0.12 }));
    return <div className="wx-atmo">{drops.map((d, i) =>
      <span key={i} className="wx-line" style={{ left: d.left + "%", animationDelay: d.d + "s", animationDuration: d.dur + "s", background: `linear-gradient(${withAlpha(atmo, 0)}, ${withAlpha(atmo, 0.5)})` }} />)}
      {g === "storm" && <div className="wx-flash" />}</div>;
  }
  if (g === "snow") {
    const fl = Array.from({ length: 16 }).map((_, i) => ({ left: (i * 6.1) % 100, d: (i * 0.2) % 3, dur: 3 + (i % 4) }));
    return <div className="wx-atmo">{fl.map((f, i) =>
      <span key={i} className="wx-snowf" style={{ left: f.left + "%", animationDelay: f.d + "s", animationDuration: f.dur + "s" }} />)}</div>;
  }
  // nuvem / névoa → blobs suaves à deriva
  return <div className="wx-atmo">
    {[0, 1, 2].map(i => <div key={i} className="wx-blob" style={{ top: 8 + i * 22 + "%", animationDelay: i * 4 + "s", background: withAlpha(atmo, 0.14) }} />)}
  </div>;
}

/* ---------- faixa horária ---------- */
function HourStrip({ data, tone, variant }) {
  const border = tone === "light" ? "rgba(255,255,255,.18)" : "rgba(0,0,0,.08)";
  const sub = tone === "light" ? "rgba(255,255,255,.72)" : "rgba(20,24,28,.55)";
  const txt = tone === "light" ? "#fff" : "#15191e";
  return (
    <div className="wx-hours" style={{ borderTopColor: border }}>
      {data.hourly.slice(0, 8).map((h, i) => (
        <div key={i} className={"wx-hour" + (i === 0 ? " is-now" : "")}>
          <span className="wx-hh" style={{ color: i === 0 ? txt : sub }}>{i === 0 ? "Agora" : WC.pad(h.h) + "h"}</span>
          <WxIcon k={WC.wmo(h.code).key} night={h.night} size={variant === "glass" ? 26 : 24} />
          <span className="wx-ht" style={{ color: txt }}>{h.temp}°</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- barra UV ---------- */
function UvBar({ uv, tone }) {
  const info = WC.uvInfo(uv);
  const track = tone === "light" ? "rgba(255,255,255,.25)" : "rgba(0,0,0,.1)";
  return (
    <div className="wx-uv">
      <div className="wx-uv-track" style={{ background: track }}>
        <div className="wx-uv-fill" style={{ width: Math.min(100, (uv / 11) * 100) + "%", background: "linear-gradient(90deg,#4caf72,#e0b13a,#e07d3a,#d8453f)" }} />
        <div className="wx-uv-dot" style={{ left: `calc(${Math.min(100, (uv / 11) * 100)}% - 5px)` }} />
      </div>
      <span className="wx-uv-lbl">{uv} · {info.label}</span>
    </div>
  );
}

/* ---------- arco sol/lua ---------- */
function SunArc({ data, tone }) {
  const prog = WC.sunProgress(data.now.h, data.now.m, data.sunrise, data.sunset);
  const W = 132, H = 46, pad = 8;
  const cx = pad + prog * (W - pad * 2);
  const cy = H - Math.sin(prog * Math.PI) * (H - 10) - 4;
  const stroke = tone === "light" ? "rgba(255,255,255,.45)" : "rgba(0,0,0,.18)";
  const sub = tone === "light" ? "rgba(255,255,255,.72)" : "rgba(20,24,28,.55)";
  return (
    <div className="wx-arc">
      <svg width={W} height={H + 4} viewBox={`0 0 ${W} ${H + 4}`}>
        <path d={`M${pad} ${H} Q ${W / 2} ${-6} ${W - pad} ${H}`} fill="none" stroke={stroke} strokeWidth="1.6" strokeDasharray="3 4" />
        {!data.isNight && <circle cx={cx} cy={cy} r="5" fill={data.palette.accent} />}
        {data.isNight && <circle cx={W - pad} cy={H - 2} r="4" fill={data.palette.accent} />}
      </svg>
      <div className="wx-arc-times" style={{ color: sub }}>
        <span>↑ {WC.hhmm(data.sunrise.h, data.sunrise.m)}</span>
        <span>↓ {WC.hhmm(data.sunset.h, data.sunset.m)}</span>
      </div>
    </div>
  );
}

/* ============================================================
   VARIAÇÃO A — "Céu" : full-bleed, cor segue o tempo
   ============================================================ */
function CardSky({ data, format }) {
  const p = data.palette, tone = p.text;
  const txt = tone === "light" ? "#fff" : "#13171b";
  const sub = tone === "light" ? "rgba(255,255,255,.78)" : "rgba(20,24,28,.6)";
  const bg = `linear-gradient(165deg, ${p.grad[0]}, ${p.grad[1]} 52%, ${p.grad[2]})`;
  const mobile = format === "mobile";
  return (
    <div className="wx-card wx-sky" style={{ background: bg, color: txt }}>
      <Atmosphere data={data} />
      <div className="wx-content">
        <div className="wx-top">
          <div className="wx-loc">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={txt} strokeWidth="2.2"><path d="M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/></svg>
            <span>{data.city}</span>
          </div>
          <span style={{ color: sub }}>{WC.hhmm(data.now.h, data.now.m)}</span>
        </div>

        <div className="wx-hero">
          <WxIcon k={data.cond.key} night={data.isNight} size={mobile ? 64 : 88} cls="wx-hero-ico" />
          <div className="wx-hero-r">
            <div className="wx-temp">{data.temp}<span className="wx-deg">°</span></div>
            <div className="wx-cond">{data.cond.label}</div>
            <div className="wx-feels" style={{ color: sub }}>Sensação {data.feels}° · ↑{data.max}° ↓{data.min}°</div>
          </div>
        </div>

        {!mobile && <HourStrip data={data} tone={tone} variant="sky" />}

        {!mobile && (
          <div className="wx-foot">
            <div className="wx-foot-col">
              <div className="wx-mlbl" style={{ color: sub }}>Índice UV</div>
              <UvBar uv={data.uv} tone={tone} />
              <div className="wx-mini-row" style={{ color: sub }}>
                <span>💧 {data.humidity}%</span><span>🌬 {data.wind} km/h</span>
              </div>
            </div>
            <div className="wx-foot-col wx-foot-arc">
              <SunArc data={data} tone={tone} />
            </div>
          </div>
        )}

        {mobile && (
          <div className="wx-mobile-stats" style={{ color: sub }}>
            <span>UV {data.uv}</span><span>💧 {data.humidity}%</span><span>🌬 {data.wind}</span><span>↑{data.max}° ↓{data.min}°</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   VARIAÇÃO B — "Vidro" : glassmorphism sobre céu atmosférico
   ============================================================ */
function CardGlass({ data, format }) {
  const p = data.palette;
  const txt = "#fff";
  const sub = "rgba(255,255,255,.74)";
  const bg = `linear-gradient(160deg, ${p.grad[0]}, ${p.grad[1]} 55%, ${p.grad[2]})`;
  const glass = "rgba(255,255,255,.14)";
  const glassBd = "rgba(255,255,255,.22)";
  const mobile = format === "mobile";
  return (
    <div className="wx-card wx-glass" style={{ background: bg, color: txt }}>
      <Atmosphere data={data} />
      <div className="wx-glow-accent" style={{ background: `radial-gradient(60% 60% at 78% 8%, ${withAlpha(p.accent, .45)}, transparent 65%)` }} />
      <div className="wx-content">
        <div className="wx-top">
          <div className="wx-loc"><span className="wx-loc-pin" style={{ background: p.accent }} />{data.city} · {data.uf}</div>
          <span style={{ color: sub }}>{WC.hhmm(data.now.h, data.now.m)}</span>
        </div>

        <div className="wx-glass-hero" style={{ background: glass, borderColor: glassBd }}>
          <WxIcon k={data.cond.key} night={data.isNight} size={mobile ? 58 : 70} cls="wx-float" />
          <div>
            <div className="wx-temp" style={{ fontSize: mobile ? 44 : 56 }}>{data.temp}<span className="wx-deg">°</span></div>
            <div className="wx-cond">{data.cond.label}</div>
            <div className="wx-feels" style={{ color: sub }}>Sensação {data.feels}°</div>
          </div>
          <div className="wx-glass-maxmin">
            <span>↑ {data.max}°</span><span style={{ color: sub }}>↓ {data.min}°</span>
          </div>
        </div>

        {!mobile && (
          <div className="wx-glass-panel" style={{ background: glass, borderColor: glassBd }}>
            <HourStrip data={data} tone="light" variant="glass" />
          </div>
        )}

        {!mobile && (
          <div className="wx-chips">
            <div className="wx-chip" style={{ background: glass, borderColor: glassBd }}>
              <span className="wx-chip-k" style={{ color: sub }}>UV</span>
              <span className="wx-chip-v">{data.uv} · {WC.uvInfo(data.uv).label}</span>
            </div>
            <div className="wx-chip" style={{ background: glass, borderColor: glassBd }}>
              <span className="wx-chip-k" style={{ color: sub }}>Umidade</span><span className="wx-chip-v">{data.humidity}%</span>
            </div>
            <div className="wx-chip" style={{ background: glass, borderColor: glassBd }}>
              <span className="wx-chip-k" style={{ color: sub }}>Vento</span><span className="wx-chip-v">{data.wind} km/h</span>
            </div>
            <div className="wx-chip" style={{ background: glass, borderColor: glassBd }}>
              <span className="wx-chip-k" style={{ color: sub }}>{data.isNight ? "Nascer" : "Pôr do sol"}</span>
              <span className="wx-chip-v">{data.isNight ? WC.hhmm(data.sunrise.h, data.sunrise.m) : WC.hhmm(data.sunset.h, data.sunset.m)}</span>
            </div>
          </div>
        )}

        {mobile && (
          <div className="wx-glass-mstats">
            <span><i style={{ color: sub }}>UV</i> {data.uv}</span>
            <span><i style={{ color: sub }}>Umid.</i> {data.humidity}%</span>
            <span><i style={{ color: sub }}>Vento</i> {data.wind}km/h</span>
            <span><i style={{ color: sub }}>{data.isNight ? "Nascer" : "Pôr"}</i> {data.isNight ? WC.hhmm(data.sunrise.h, data.sunrise.m) : WC.hhmm(data.sunset.h, data.sunset.m)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   VARIAÇÃO C — "Editorial" : card claro, tipografia forte, sparkline
   ============================================================ */
function Sparkline({ data, accent }) {
  const pts = data.hourly.slice(0, 9).map(h => h.temp);
  const W = 296, H = 56, pad = 6;
  const min = Math.min(...pts), max = Math.max(...pts), span = Math.max(1, max - min);
  const xy = pts.map((t, i) => {
    const x = pad + (i / (pts.length - 1)) * (W - pad * 2);
    const y = pad + (1 - (t - min) / span) * (H - pad * 2);
    return [x, y];
  });
  const line = xy.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = line + ` L${W - pad} ${H} L${pad} ${H} Z`;
  return (
    <svg className="wx-spark" width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs><linearGradient id="wxSpkF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={withAlpha(accent, .28)} /><stop offset="100%" stopColor={withAlpha(accent, 0)} />
      </linearGradient></defs>
      <path d={area} fill="url(#wxSpkF)" />
      <path d={line} fill="none" stroke={accent} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={xy[0][0]} cy={xy[0][1]} r="3.6" fill={accent} stroke="#fff" strokeWidth="1.6" />
    </svg>
  );
}

function CardEditorial({ data, format }) {
  const p = data.palette;
  const accent = data.isNight ? "#5b6b88" : p.grad[0];
  const tint = withAlpha(accent, data.isNight ? .12 : .1);
  const mobile = format === "mobile";
  return (
    <div className="wx-card wx-editorial" style={{ "--acc": accent }}>
      <div className="wx-ed-top">
        <div>
          <div className="wx-ed-loc">{data.city}</div>
          <div className="wx-ed-time">{data.cond.label} · {WC.hhmm(data.now.h, data.now.m)}</div>
        </div>
        <span className="wx-ed-iconwrap" style={{ background: tint }}>
          <WxIcon k={data.cond.key} night={data.isNight} size={mobile ? 42 : 52} cls="wx-float" />
        </span>
      </div>

      <div className="wx-ed-hero">
        <div className="wx-ed-temp">{data.temp}<span className="wx-ed-deg">°C</span></div>
        <div className="wx-ed-maxmin">
          <div><span className="wx-ed-k">Sensação</span><b>{data.feels}°</b></div>
          <div><span className="wx-ed-k">Máx/Mín</span><b>{data.max}° / {data.min}°</b></div>
        </div>
      </div>

      {!mobile && (
        <div className="wx-ed-chart">
          <Sparkline data={data} accent={accent} />
          <div className="wx-ed-hourrow">
            {data.hourly.slice(0, 9).filter((_, i) => i % 2 === 0).map((h, i) => (
              <span key={i}>{i === 0 ? "agora" : WC.pad(h.h)}</span>
            ))}
          </div>
        </div>
      )}

      <div className={"wx-ed-metrics" + (mobile ? " is-mobile" : "")}>
        <div className="wx-ed-m"><span className="wx-ed-k">UV</span><b style={{ color: WC.uvInfo(data.uv).color }}>{data.uv}{mobile ? "" : " " + WC.uvInfo(data.uv).label}</b></div>
        <div className="wx-ed-m"><span className="wx-ed-k">Umidade</span><b>{data.humidity}%</b></div>
        <div className="wx-ed-m"><span className="wx-ed-k">Vento</span><b>{data.wind} km/h</b></div>
        {!mobile && <div className="wx-ed-m"><span className="wx-ed-k">{data.isNight ? "Nascer do sol" : "Pôr do sol"}</span><b>{data.isNight ? WC.hhmm(data.sunrise.h, data.sunrise.m) : WC.hhmm(data.sunset.h, data.sunset.m)}</b></div>}
      </div>
    </div>
  );
}

Object.assign(window, { CardSky, CardGlass, CardEditorial, WxIcon });
