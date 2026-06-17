/* ============================================================
   VISÃO DO CLIENTE — catálogo de solicitações (estilo limpo)
   ============================================================ */

const SECTOR_ICON = {
  "TI": I.admin, "Compras": I.cart, "Marketing": I.mega,
  "Infraestrutura": I.settings, "Marketing ": I.mega,
};

function statusPill(status, small) {
  const m = window.STATUS_META[status];
  return (
    <span className={"pill tone-" + m.tone} style={small ? { fontSize: 10.5, padding: "2px 8px" } : null}>
      <span className={"dot " + m.tone} /> {m.short}
    </span>
  );
}

function CatalogRow({ form, onOpen, nav }) {
  const Icon = SECTOR_ICON[form.sector] || I.form;
  return (
    <div className="cat-row" onClick={() => onOpen(form)}>
      <div className="cat-ic"><Icon size={20} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
          <span className="cat-title">{form.title}</span>
          {form.popular && <span className="pill" style={{ color: "hsl(var(--accent))", borderColor: "hsl(var(--accent) / .35)", fontSize: 10.5, padding: "2px 8px" }}>Mais usado</span>}
        </div>
        <p className="cat-desc">{form.desc}</p>
        <div className="cat-meta">
          <span>{form.sector}</span>
          <span className="dotsep" />
          <span>{form.fields} campos</span>
          <span className="dotsep" />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><I.clock size={12} /> Resposta em {form.sla}</span>
        </div>
      </div>
      <div className="cat-actions">
        <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); nav.form(form.id); }}>
          <I.eye size={14} /> Ver
        </button>
        <button className="btn btn-accent btn-sm" onClick={(e) => { e.stopPropagation(); nav.respond(form.id); }}>
          Abrir solicitação <I.arrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

function MyRequestCard({ r }) {
  return (
    <div className="myreq">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span className="mono faint" style={{ fontSize: 12 }}>#{r.id}</span>
        {statusPill(r.status, true)}
      </div>
      <div className="myreq-title">{r.form}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span className="faint" style={{ fontSize: 11.5 }}>{r.age}</span>
        {r.waiting
          ? <span style={{ fontSize: 11.5, color: "hsl(38 92% 55%)", fontWeight: 600 }}>Aguardando você</span>
          : <span className="faint" style={{ fontSize: 11.5 }}>{r.assignee ?? "Sem responsável"}</span>}
      </div>
    </div>
  );
}

function Drawer({ form, onClose, nav }) {
  if (!form) return null;
  const Icon = SECTOR_ICON[form.sector] || I.form;
  return (
    <div className="drawer-wrap" onClick={onClose}>
      <div className="drawer fade-in-r" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
          <div className="cat-ic"><Icon size={20} /></div>
          <div style={{ flex: 1 }}>
            <div className="cat-title" style={{ fontSize: 17 }}>{form.title}</div>
            <div className="cat-meta" style={{ marginTop: 4 }}>
              <span>{form.sector}</span><span className="dotsep" /><span>{form.fields} campos</span>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><I.plus size={20} style={{ transform: "rotate(45deg)" }} /></button>
        </div>
        <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.6, margin: "8px 0 18px" }}>{form.desc}</p>

        <div className="drawer-info">
          <div><span className="faint">Setor responsável</span><strong>{form.sector}</strong></div>
          <div><span className="faint">Prazo de resposta</span><strong>{form.sla}</strong></div>
          <div><span className="faint">Em aberto agora</span><strong>{form.open} solicitações</strong></div>
        </div>

        <div className="sep" style={{ margin: "18px 0" }} />
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "hsl(var(--muted))", marginBottom: 12 }}>Campos do formulário</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Array.from({ length: Math.min(form.fields, 5) }).map((_, i) => (
            <div key={i} className="field-skel">
              <div className="fs-label" style={{ width: 90 + (i % 3) * 30 }} />
              <div className="fs-input" />
            </div>
          ))}
          {form.fields > 5 && <span className="faint" style={{ fontSize: 12 }}>+ {form.fields - 5} outros campos</span>}
        </div>

        <div className="drawer-foot">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-accent" style={{ flex: 1 }} onClick={() => { onClose(); nav.respond(form.id); }}>
            <I.send size={15} /> Iniciar solicitação
          </button>
        </div>
      </div>
    </div>
  );
}

function ClientView({ nav }) {
  const [q, setQ] = React.useState("");
  const [cat, setCat] = React.useState("Todos");
  const [drawer, setDrawer] = React.useState(null);
  const cats = ["Todos", "TI", "Compras", "Marketing", "Infraestrutura"];

  const forms = window.FORMS.filter(f =>
    (cat === "Todos" || f.sector === cat) &&
    (q === "" || f.title.toLowerCase().includes(q.toLowerCase()) || f.desc.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="fade-in">
      <style>{clientCss}</style>

      {/* header */}
      <div className="cv-head">
        <div>
          <h1 className="h-title">Solicitações</h1>
          <p className="h-sub">Escolha um tipo de solicitação e abra um chamado para o setor responsável.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost" onClick={nav.mine}><I.file size={16} /> Minhas solicitações</button>
          <button className="btn btn-primary"><I.plus size={16} /> Criar formulário</button>
        </div>
      </div>

      {/* KPIs discretos */}
      <div className="kpi-strip" style={{ margin: "22px 0 26px" }}>
        <div className="kpi"><span className="v">1</span><span className="l">Em aberto</span></div>
        <div className="kpi"><span className="v warn">1</span><span className="l">Aguardando você</span></div>
        <div className="kpi"><span className="v">2</span><span className="l">Concluídas no mês</span></div>
        <div className="kpi"><span className="v accent">~6h</span><span className="l">Tempo médio de resposta</span></div>
      </div>

      <div className="cv-grid">
        {/* main: catalog */}
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <div className="search">
              <I.search size={16} />
              <input placeholder="Buscar tipo de solicitação…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <div className="chips" style={{ marginBottom: 16 }}>
            {cats.map(c => (
              <button key={c} className={"chip" + (cat === c ? " active" : "")} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>

          <div className="cat-list">
            {forms.map(f => <CatalogRow key={f.id} form={f} onOpen={setDrawer} nav={nav} />)}
            {forms.length === 0 && (
              <div className="card" style={{ padding: 40, textAlign: "center", color: "hsl(var(--muted))" }}>
                <I.inbox size={32} style={{ opacity: .5, marginBottom: 8 }} />
                <div>Nenhum tipo encontrado para “{q}”.</div>
              </div>
            )}
          </div>
        </div>

        {/* rail: my requests */}
        <aside>
          <div className="card" style={{ padding: 18, position: "sticky", top: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontWeight: 600, fontSize: 14.5 }}>Minhas solicitações</span>
              <button className="link-btn" onClick={nav.mine}>Ver todas</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {window.MY_REQUESTS.map(r => <MyRequestCard key={r.id} r={r} />)}
            </div>
            <div className="sep" style={{ margin: "16px 0 14px" }} />
            <button className="btn btn-ghost" style={{ width: "100%" }} onClick={nav.mine}><I.board size={15} /> Abrir o Kanban</button>
          </div>
        </aside>
      </div>

      <Drawer form={drawer} onClose={() => setDrawer(null)} nav={nav} />
    </div>
  );
}

const clientCss = `
.cv-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
.cv-grid { display: grid; grid-template-columns: 1fr 320px; gap: 24px; align-items: start; }
@media (max-width: 1100px) { .cv-grid { grid-template-columns: 1fr; } }
.chips { display: flex; gap: 8px; flex-wrap: wrap; }
.cat-list { display: flex; flex-direction: column; gap: 10px; }
.cat-row {
  display: flex; align-items: center; gap: 16px; padding: 18px;
  background: hsl(var(--card) / .9); border: 1px solid hsl(var(--border-soft));
  border-radius: var(--radius); cursor: pointer; transition: all .16s; backdrop-filter: blur(6px);
}
.cat-row:hover { border-color: hsl(var(--accent) / .4); transform: translateY(-1px); box-shadow: var(--shadow); }
.cat-ic {
  width: 42px; height: 42px; border-radius: 11px; flex-shrink: 0;
  display: grid; place-items: center; color: hsl(var(--accent));
  background: hsl(var(--accent) / .1); border: 1px solid hsl(var(--accent) / .2);
}
.cat-title { font-size: 15px; font-weight: 600; letter-spacing: -.01em; }
.cat-desc { color: hsl(var(--muted)); font-size: 13px; margin: 4px 0 8px; line-height: 1.5; max-width: 62ch; }
.cat-meta { display: flex; align-items: center; gap: 9px; font-size: 12px; color: hsl(var(--faint)); }
.dotsep { width: 3px; height: 3px; border-radius: 50%; background: hsl(var(--faint)); }
.cat-actions { display: flex; gap: 8px; flex-shrink: 0; }
@media (max-width: 720px) { .cat-actions { display: none; } }

.myreq {
  padding: 12px 13px; border-radius: 10px; border: 1px solid hsl(var(--border-soft));
  background: hsl(var(--card-2) / .6); display: flex; flex-direction: column; gap: 7px; cursor: pointer; transition: border-color .15s;
}
.myreq:hover { border-color: hsl(var(--border)); }
.myreq-title { font-size: 13px; font-weight: 500; line-height: 1.35; }
.link-btn { font-size: 12.5px; color: hsl(var(--accent)); font-weight: 600; }

/* drawer */
.drawer-wrap { position: fixed; inset: 0; z-index: 50; background: rgba(0,0,0,.45); display: flex; justify-content: flex-end; }
.drawer { width: 460px; max-width: 92vw; height: 100%; overflow-y: auto; background: hsl(var(--panel)); border-left: 1px solid hsl(var(--border)); padding: 24px; }
.fade-in-r { animation: slideR .26s cubic-bezier(.2,.8,.2,1); }
@keyframes slideR { from { transform: translateX(40px); opacity: .4; } to { transform: none; opacity: 1; } }
.drawer-info { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; padding: 16px; border-radius: 11px; background: hsl(var(--card-2) / .7); border: 1px solid hsl(var(--border-soft)); }
.drawer-info > div { display: flex; flex-direction: column; gap: 3px; }
.drawer-info span.faint { font-size: 11px; }
.drawer-info strong { font-size: 13.5px; }
.field-skel { display: flex; flex-direction: column; gap: 6px; }
.fs-label { height: 9px; border-radius: 4px; background: hsl(var(--border)); }
.fs-input { height: 36px; border-radius: 8px; background: hsl(var(--card-2)); border: 1px solid hsl(var(--border-soft)); }
.drawer-foot { display: flex; gap: 10px; margin-top: 24px; padding-top: 18px; border-top: 1px solid hsl(var(--border-soft)); }
`;

window.ClientView = ClientView;
window.statusPill = statusPill;
