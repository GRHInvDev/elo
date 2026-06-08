/* ============================================================
   VISÃO DO TÉCNICO — workspace resolutivo (fila + detalhe / quadro)
   ============================================================ */

const TECH_USER = "Gilnei Wolf";
const STATUS_ORDER = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"];

function priorityDot(p) {
  return <span className={"dot " + p} title={window.PRIORITY_META[p].label} />;
}

function Avatar({ initials, size = 26 }) {
  return (
    <span className="t-avatar" style={{ width: size, height: size, fontSize: size * 0.4 }}>{initials}</span>
  );
}

/* ---------- linha da fila ---------- */
function QueueRow({ t, active, onClick }) {
  const sm = window.STATUS_META[t.status];
  return (
    <button className={"q-row" + (active ? " active" : "")} onClick={onClick}>
      <span className={"q-prio dot " + t.priority} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="q-top">
          <span className="mono faint" style={{ fontSize: 11.5 }}>#{t.id}</span>
          {t.isNew && <span className="q-new">Novo</span>}
          <span className={"q-status tone-" + sm.tone}>{sm.short}</span>
        </div>
        <div className="q-title">{t.summary}</div>
        <div className="q-meta">
          <Avatar initials={t.initials} size={18} />
          <span className="truncate">{t.requester}</span>
          <span className="dotsep" />
          <span className={t.slaRisk ? "sla-risk" : ""} style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
            <I.clock size={11} /> {t.sla}
          </span>
        </div>
      </div>
    </button>
  );
}

/* ---------- painel de detalhe ---------- */
function Detail({ t, onStatus, onReply, onAssign }) {
  const [msg, setMsg] = React.useState("");
  const [menu, setMenu] = React.useState(false);
  if (!t) {
    return (
      <div className="detail empty">
        <I.inbox size={40} style={{ opacity: .4 }} />
        <p className="muted">Selecione um chamado na fila para começar a atender.</p>
      </div>
    );
  }
  const sm = window.STATUS_META[t.status];
  const send = () => { if (msg.trim()) { onReply(t.id, msg.trim()); setMsg(""); } };

  return (
    <div className="detail" key={t.id}>
      {/* header */}
      <div className="d-head">
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span className="mono faint" style={{ fontSize: 13 }}>#{t.id}</span>
          {priorityDot(t.priority)}
          <span className="faint" style={{ fontSize: 12 }}>{window.PRIORITY_META[t.priority].label} prioridade</span>
          <span className="dotsep" />
          <span className="faint" style={{ fontSize: 12 }}>{t.form}</span>
        </div>
        <h2 className="d-title">{t.summary}</h2>

        <div className="d-actions">
          <div className="status-wrap">
            <button className={"btn btn-sm status-btn tone-" + sm.tone} onClick={() => setMenu(!menu)}>
              <span className={"dot " + sm.tone} /> {sm.label} <I.chevDown size={13} />
            </button>
            {menu && (
              <div className="status-menu" onMouseLeave={() => setMenu(false)}>
                {STATUS_ORDER.map(s => (
                  <button key={s} onClick={() => { onStatus(t.id, s); setMenu(false); }}
                    className={s === t.status ? "sel" : ""}>
                    <span className={"dot " + window.STATUS_META[s].tone} /> {window.STATUS_META[s].label}
                    {s === t.status && <I.check size={14} style={{ marginLeft: "auto" }} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          {!t.assignee
            ? <button className="btn btn-accent btn-sm" onClick={() => onAssign(t.id)}><I.bolt size={14} /> Assumir chamado</button>
            : <span className="assignee-pill"><Avatar initials={(t.assignee.split(" ").map(w=>w[0]).slice(0,2).join("")).toUpperCase()} size={20} /> {t.assignee}</span>}
          <button className="icon-btn" style={{ marginLeft: "auto" }}><I.more size={18} /></button>
        </div>
      </div>

      <div className="d-body">
        {/* requester + sla cards */}
        <div className="d-info">
          <div className="d-info-card">
            <span className="faint">Solicitante</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
              <Avatar initials={t.initials} size={28} />
              <div><strong style={{ fontSize: 13.5 }}>{t.requester}</strong><div className="faint" style={{ fontSize: 11.5 }}>{t.sector}</div></div>
            </div>
          </div>
          <div className="d-info-card">
            <span className="faint">SLA</span>
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 7 }}>
              <I.clock size={16} className={t.slaRisk ? "sla-risk" : "muted"} />
              <strong className={t.slaRisk ? "sla-risk" : ""} style={{ fontSize: 13.5 }}>{t.sla}</strong>
            </div>
            <div className="faint" style={{ fontSize: 11.5, marginTop: 2 }}>Aberto {t.age}</div>
          </div>
        </div>

        {/* submitted fields */}
        <div className="d-section-label">Dados da solicitação</div>
        <div className="d-fields">
          {t.fieldsData.map(([k, v], i) => (
            <div key={i} className="d-field">
              <span className="faint">{k}</span>
              <span>{v}</span>
            </div>
          ))}
        </div>

        {/* conversation */}
        <div className="d-section-label" style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <I.msg size={14} /> Conversa
        </div>
        <div className="thread">
          {t.thread.map((m, i) => {
            const mine = m.role !== "Solicitante";
            return (
              <div key={i} className={"bubble-row" + (mine ? " mine" : "")}>
                {!mine && <Avatar initials={t.initials} size={26} />}
                <div className={"bubble" + (mine ? " mine" : "")}>
                  <div className="bubble-head"><strong>{m.who}</strong><span className="faint">{m.role} · {m.time}</span></div>
                  <p>{m.msg}</p>
                </div>
                {mine && <Avatar initials="GW" size={26} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* reply */}
      <div className="d-reply">
        <button className="icon-btn"><I.paperclip size={18} /></button>
        <input placeholder="Responder ao solicitante…" value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }} />
        <button className="btn btn-accent btn-sm" onClick={send} disabled={!msg.trim()}>
          <I.send size={14} /> Enviar
        </button>
      </div>
    </div>
  );
}

/* ---------- quadro (kanban refinado) ---------- */
function Board({ tickets, onPick }) {
  return (
    <div className="board">
      {STATUS_ORDER.map(s => {
        const sm = window.STATUS_META[s];
        const items = tickets.filter(t => t.status === s);
        const total = window.BOARD_COUNTS[s];
        return (
          <div className="b-col" key={s}>
            <div className="b-col-head">
              <span className={"dot " + sm.tone} />
              <span className="b-col-title">{sm.label}</span>
              <span className="b-col-count">{total}</span>
            </div>
            <div className="b-col-body">
              {items.map(t => (
                <button className="b-card" key={t.id} onClick={() => onPick(t.id)}>
                  <div className="q-top">
                    <span className={"dot " + t.priority} />
                    <span className="mono faint" style={{ fontSize: 11 }}>#{t.id}</span>
                    {t.isNew && <span className="q-new">Novo</span>}
                  </div>
                  <div className="b-card-title">{t.summary}</div>
                  <div className="q-meta">
                    <Avatar initials={t.initials} size={18} />
                    <span className="truncate">{t.requester}</span>
                  </div>
                  <div className="b-card-foot">
                    <span className={t.slaRisk ? "sla-risk" : "faint"} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                      <I.clock size={11} /> {t.sla}
                    </span>
                    {t.assignee
                      ? <span className="faint" style={{ fontSize: 11 }}>{t.assignee.split(" ")[0]}</span>
                      : <span className="unassigned">Sem responsável</span>}
                  </div>
                </button>
              ))}
              {items.length === 0 && <div className="b-empty">Sem itens nesta amostra</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TechView() {
  const [tickets, setTickets] = React.useState(() => JSON.parse(JSON.stringify(window.TICKETS)));
  const [view, setView] = React.useState("fila"); // fila | quadro
  const [sel, setSel] = React.useState(tickets[0].id);
  const [tab, setTab] = React.useState("ALL");
  const [q, setQ] = React.useState("");

  const update = (id, patch) => setTickets(ts => ts.map(t => t.id === id ? { ...t, ...patch } : t));
  const onStatus = (id, status) => update(id, { status });
  const onAssign = (id) => update(id, { assignee: TECH_USER, status: tickets.find(t=>t.id===id).status === "NOT_STARTED" ? "IN_PROGRESS" : tickets.find(t=>t.id===id).status });
  const onReply = (id, message) => {
    setTickets(ts => ts.map(t => t.id === id ? {
      ...t, thread: [...t.thread, { who: TECH_USER, role: "Técnico", time: "agora", msg: message }],
      status: t.status === "NOT_STARTED" ? "IN_PROGRESS" : t.status,
    } : t));
  };

  const filtered = tickets.filter(t =>
    (tab === "ALL" || t.status === tab) &&
    (q === "" || (t.summary + t.requester + t.id).toLowerCase().includes(q.toLowerCase()))
  );
  const current = tickets.find(t => t.id === sel);

  const counts = {
    open: tickets.filter(t => t.status === "NOT_STARTED").length,
    prog: tickets.filter(t => t.status === "IN_PROGRESS").length,
    unassigned: tickets.filter(t => !t.assignee).length,
    risk: tickets.filter(t => t.slaRisk).length,
  };

  return (
    <div className="fade-in">
      <style>{techCss}</style>

      {/* header */}
      <div className="cv-head">
        <div>
          <h1 className="h-title">Central de chamados</h1>
          <p className="h-sub">Atenda, acompanhe e resolva as solicitações recebidas nos formulários.</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="btn btn-ghost"><I.tag size={15} /> Gerenciar Tags</button>
          <div className="seg">
            <button className={view === "fila" ? "active" : ""} onClick={() => setView("fila")}><I.list size={15} /> Fila</button>
            <button className={view === "quadro" ? "active" : ""} onClick={() => setView("quadro")}><I.board size={15} /> Quadro</button>
          </div>
        </div>
      </div>

      {/* KPIs discretos */}
      <div className="kpi-strip" style={{ margin: "20px 0 22px" }}>
        <div className="kpi"><span className="v">{window.BOARD_COUNTS.NOT_STARTED}</span><span className="l">Não iniciados</span></div>
        <div className="kpi"><span className="v warn">{window.BOARD_COUNTS.IN_PROGRESS}</span><span className="l">Em progresso</span></div>
        <div className="kpi"><span className="v danger">{counts.unassigned}</span><span className="l">Sem responsável</span></div>
        <div className="kpi"><span className="v danger">{counts.risk}</span><span className="l">SLA em risco</span></div>
        <div className="kpi"><span className="v accent">12</span><span className="l">Resolvidos hoje</span></div>
      </div>

      {view === "fila" ? (
        <div className="work">
          {/* queue */}
          <div className="queue">
            <div className="search" style={{ marginBottom: 10 }}>
              <I.search size={15} />
              <input placeholder="Buscar nº, solicitante…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <div className="q-tabs">
              {[["ALL", "Todos"], ["NOT_STARTED", "Novos"], ["IN_PROGRESS", "Andamento"], ["COMPLETED", "Concluídos"]].map(([k, l]) => (
                <button key={k} className={"q-tab" + (tab === k ? " active" : "")} onClick={() => setTab(k)}>{l}</button>
              ))}
            </div>
            <div className="q-list">
              {filtered.map(t => <QueueRow key={t.id} t={t} active={t.id === sel} onClick={() => setSel(t.id)} />)}
              {filtered.length === 0 && <div className="b-empty" style={{ margin: 20 }}>Nenhum chamado neste filtro</div>}
            </div>
          </div>
          {/* detail */}
          <Detail t={current} onStatus={onStatus} onReply={onReply} onAssign={onAssign} />
        </div>
      ) : (
        <Board tickets={tickets} onPick={(id) => { setSel(id); setView("fila"); }} />
      )}
    </div>
  );
}

const techCss = `
.t-avatar { border-radius: 50%; display: inline-grid; place-items: center; flex-shrink: 0;
  background: linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent) / .55)); color: #fff; font-weight: 600; }
.sla-risk { color: hsl(0 72% 58%) !important; font-weight: 600; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.work { display: grid; grid-template-columns: 372px 1fr; gap: 18px; height: calc(100vh - 290px); min-height: 520px; }
@media (max-width: 1100px) { .work { grid-template-columns: 1fr; height: auto; } }

/* queue */
.queue { display: flex; flex-direction: column; min-height: 0; }
.q-tabs { display: flex; gap: 4px; margin-bottom: 10px; }
.q-tab { padding: 6px 11px; border-radius: 8px; font-size: 12.5px; font-weight: 600; color: hsl(var(--muted)); border: 1px solid transparent; }
.q-tab:hover { color: hsl(var(--text)); }
.q-tab.active { background: hsl(var(--card-2)); color: hsl(var(--text)); border-color: hsl(var(--border-soft)); }
.q-list { display: flex; flex-direction: column; gap: 8px; overflow-y: auto; padding-right: 4px; flex: 1; }
.q-row { display: flex; gap: 11px; padding: 13px; border-radius: 11px; text-align: left; width: 100%;
  background: hsl(var(--card) / .8); border: 1px solid hsl(var(--border-soft)); transition: all .14s; }
.q-row:hover { border-color: hsl(var(--border)); }
.q-row.active { border-color: hsl(var(--accent) / .55); background: hsl(var(--accent) / .07); box-shadow: inset 0 0 0 1px hsl(var(--accent) / .25); }
.q-prio { margin-top: 6px; }
.q-top { display: flex; align-items: center; gap: 7px; }
.q-new { font-size: 9.5px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: hsl(0 72% 60%); background: hsl(0 72% 55% / .14); padding: 1px 6px; border-radius: 5px; }
.q-status { margin-left: auto; font-size: 11px; font-weight: 600; }
.q-title { font-size: 13.5px; font-weight: 500; line-height: 1.4; margin: 5px 0 7px; }
.q-meta { display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: hsl(var(--faint)); }

/* detail */
.detail { display: flex; flex-direction: column; min-height: 0; background: hsl(var(--card) / .75); border: 1px solid hsl(var(--border-soft)); border-radius: var(--radius); overflow: hidden; backdrop-filter: blur(6px); }
.detail.empty { align-items: center; justify-content: center; gap: 12px; text-align: center; }
.d-head { padding: 18px 20px 14px; border-bottom: 1px solid hsl(var(--border-soft)); }
.d-title { font-size: 18px; font-weight: 650; letter-spacing: -.02em; margin: 8px 0 14px; line-height: 1.3; }
.d-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.status-wrap { position: relative; }
.status-btn { border: 1px solid currentColor; background: transparent; }
.status-menu { position: absolute; top: calc(100% + 6px); left: 0; z-index: 20; min-width: 190px;
  background: hsl(var(--panel)); border: 1px solid hsl(var(--border)); border-radius: 10px; padding: 5px; box-shadow: var(--shadow); }
.status-menu button { display: flex; align-items: center; gap: 9px; width: 100%; padding: 8px 10px; border-radius: 7px; font-size: 13px; color: hsl(var(--text)); }
.status-menu button:hover { background: hsl(var(--card-2)); }
.status-menu button.sel { font-weight: 600; }
.assignee-pill { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 500; padding: 4px 10px 4px 4px; border-radius: 99px; background: hsl(var(--card-2)); border: 1px solid hsl(var(--border-soft)); }

.d-body { flex: 1; overflow-y: auto; padding: 18px 20px; }
.d-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
.d-info-card { padding: 13px 14px; border-radius: 11px; background: hsl(var(--card-2) / .6); border: 1px solid hsl(var(--border-soft)); }
.d-info-card .faint { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
.d-section-label { font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: hsl(var(--muted)); margin: 4px 0 12px; }
.d-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; border-radius: 11px; overflow: hidden; border: 1px solid hsl(var(--border-soft)); margin-bottom: 24px; background: hsl(var(--border-soft)); }
.d-field { background: hsl(var(--card)); padding: 11px 14px; display: flex; flex-direction: column; gap: 3px; }
.d-field .faint { font-size: 11px; }
.d-field span:last-child { font-size: 13px; font-weight: 500; }
.thread { display: flex; flex-direction: column; gap: 14px; }
.bubble-row { display: flex; gap: 9px; align-items: flex-start; }
.bubble-row.mine { flex-direction: row-reverse; }
.bubble { max-width: 78%; padding: 10px 13px; border-radius: 13px; background: hsl(var(--card-2)); border: 1px solid hsl(var(--border-soft)); border-top-left-radius: 4px; }
.bubble.mine { background: hsl(var(--accent) / .12); border-color: hsl(var(--accent) / .25); border-top-left-radius: 13px; border-top-right-radius: 4px; }
.bubble-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
.bubble-head strong { font-size: 12.5px; }
.bubble-head .faint { font-size: 10.5px; }
.bubble p { font-size: 13px; line-height: 1.5; }
.d-reply { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-top: 1px solid hsl(var(--border-soft)); background: hsl(var(--panel) / .5); }
.d-reply input { flex: 1; background: hsl(var(--card-2)); border: 1px solid hsl(var(--border-soft)); border-radius: 9px; height: 38px; padding: 0 13px; color: hsl(var(--text)); outline: none; font-size: 13.5px; }
.d-reply input:focus { border-color: hsl(var(--accent) / .5); }
.btn:disabled { opacity: .45; cursor: default; }

/* board */
.board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; align-items: start; }
@media (max-width: 1000px) { .board { grid-template-columns: 1fr; } }
.b-col { background: hsl(var(--card) / .55); border: 1px solid hsl(var(--border-soft)); border-radius: var(--radius); padding: 12px; }
.b-col-head { display: flex; align-items: center; gap: 8px; padding: 4px 6px 12px; }
.b-col-title { font-weight: 600; font-size: 14px; }
.b-col-count { margin-left: auto; font-family: var(--mono); font-size: 12px; color: hsl(var(--muted)); background: hsl(var(--card-2)); padding: 2px 9px; border-radius: 99px; }
.b-col-body { display: flex; flex-direction: column; gap: 9px; }
.b-card { text-align: left; width: 100%; padding: 13px; border-radius: 11px; background: hsl(var(--card)); border: 1px solid hsl(var(--border-soft)); display: flex; flex-direction: column; gap: 8px; transition: all .14s; }
.b-card:hover { border-color: hsl(var(--accent) / .45); transform: translateY(-1px); box-shadow: var(--shadow); }
.b-card-title { font-size: 13px; font-weight: 500; line-height: 1.4; }
.b-card-foot { display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid hsl(var(--border-soft)); }
.unassigned { font-size: 10.5px; color: hsl(0 72% 60%); font-weight: 600; }
.b-empty { font-size: 12px; color: hsl(var(--faint)); text-align: center; padding: 16px; }
`;

window.TechView = TechView;
