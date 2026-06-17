/* ============================================================
   SUB-PÁGINAS DO MÓDULO (visão cliente)
   - FormRootPage   → /forms/{slug}
   - RespondPage    → /forms/{slug}/responder
   - MyResponsesPage→ /forms/minhas-solicitacoes
   Espelha FormsSubPageShell + FormResponseComponent + UserResponsesList
   ============================================================ */

/* ---------- trilha de navegação (breadcrumb) ---------- */
function Breadcrumb({ items }) {
  return (
    <nav className="bc">
      {items.map((it, i) => {
        const last = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            {it.onClick && !last
              ? <button className="bc-link" onClick={it.onClick}>{it.label}</button>
              : <span className={last ? "bc-cur" : "bc-link"}>{it.label}</span>}
            {!last && <I.chev size={13} className="bc-sep" />}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

/* ---------- casca padrão das sub-páginas ---------- */
function SubPageShell({ breadcrumbs, backFn, title, titlePrefix, description, actions, children }) {
  return (
    <div className="fade-in">
      <style>{pagesCss}</style>
      {breadcrumbs && <Breadcrumb items={breadcrumbs} />}
      <div className="sp-head">
        <div style={{ minWidth: 0 }}>
          {backFn && (
            <button className="sp-back" onClick={backFn}><I.arrowLeft size={14} /> Voltar</button>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
            {titlePrefix}
            <h1 className="h-title">{title}</h1>
          </div>
          {description && <div className="sp-desc">{description}</div>}
        </div>
        {actions && <div className="sp-actions">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

function Panel({ children, style }) {
  return <div className="sp-panel" style={style}>{children}</div>;
}

/* ============================================================
   CONTROLES DE CAMPO (renderiza por tipo, como no codebase real)
   ============================================================ */
function MultiCombo({ field, value, onChange, disabled }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  const toggle = (v) => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  return (
    <div className="fr-ms" ref={ref}>
      <button type="button" className="fr-select-wrap fr-ms-box" disabled={disabled} onClick={() => setOpen(o => !o)}>
        {value.length === 0
          ? <span className="fr-ms-ph">{field.placeholder || "Selecione opções"}</span>
          : <span className="fr-ms-chips">{value.map(v => <span key={v} className="fr-chip">{v}</span>)}</span>}
        <I.chevDown size={16} className="fr-select-ic" />
      </button>
      {open && !disabled && (
        <div className="fr-ms-menu">
          {field.options.map(o => (
            <button type="button" key={o.value} className={"fr-ms-opt" + (value.includes(o.value) ? " on" : "")} onClick={() => toggle(o.value)}>
              <span className="fr-ms-check">{value.includes(o.value) && <I.check size={13} />}</span>{o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FileInput({ field, value, onChange, disabled }) {
  const id = "file-" + field.name;
  return (
    <label htmlFor={id} className={"fr-file" + (disabled ? " disabled" : "")}>
      <I.paperclip size={16} />
      <span>{value ? value : "Selecionar arquivo" + (field.multipleFiles ? "(s)" : "")}</span>
      <span className="fr-file-hint">{field.acceptedFileTypes}</span>
      <input id={id} type="file" accept={field.acceptedFileTypes} multiple={field.multipleFiles} disabled={disabled}
        onChange={(e) => {
          const fs = Array.from(e.target.files || []);
          onChange(fs.length ? fs.map(f => f.name).join(", ") : "");
        }} />
    </label>
  );
}

function FieldInput({ field, value, onChange, disabled, error }) {
  const f = field;
  const errC = error ? " fr-err" : "";
  if (f.type === "text" || f.type === "formatted")
    return <input className={"fr-input" + errC} type="text" placeholder={f.placeholder} value={value ?? ""} disabled={disabled} onChange={e => onChange(e.target.value)} />;
  if (f.type === "number")
    return <input className={"fr-input" + errC} type="number" min={f.min} max={f.max} placeholder={f.placeholder} value={value ?? ""} disabled={disabled} onChange={e => onChange(e.target.value)} />;
  if (f.type === "textarea")
    return <textarea className={"fr-textarea" + errC} rows={f.rows || 3} placeholder={f.placeholder} value={value ?? ""} disabled={disabled} onChange={e => onChange(e.target.value)} />;
  if (f.type === "checkbox")
    return (
      <label className={"fr-check" + (disabled ? " disabled" : "")}>
        <input type="checkbox" checked={!!value} disabled={disabled} onChange={e => onChange(e.target.checked)} />
        <span className="fr-check-box">{value && <I.check size={13} />}</span>
        <span>{f.placeholder || "Sim"}</span>
      </label>
    );
  if (f.type === "combobox" && !f.multiple)
    return (
      <div className={"fr-select-wrap" + errC}>
        <select className="fr-select" value={value ?? ""} disabled={disabled} onChange={e => onChange(e.target.value)}>
          <option value="" disabled>{f.placeholder || "Selecione uma opção"}</option>
          {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <I.chevDown size={16} className="fr-select-ic" />
      </div>
    );
  if (f.type === "combobox" && f.multiple)
    return <MultiCombo field={f} value={value || []} onChange={onChange} disabled={disabled} />;
  if (f.type === "file")
    return <FileInput field={f} value={value} onChange={onChange} disabled={disabled} />;
  if (f.type === "dynamic")
    return (
      <div className="fr-dynamic">
        <span className="fr-dyn-val">{value || <em className="faint">Coletando seu {f.dynamicType === "user_name" ? "nome" : "setor"}…</em>}</span>
        <span className="fr-dyn-lock"><I.lock size={12} /> Preenchido automaticamente</span>
      </div>
    );
  return null;
}

function FieldRow({ field, value, onChange, disabled, error }) {
  return (
    <div className="fr-row">
      <label className="fr-label">{field.label}{field.required && <span className="fr-req">*</span>}</label>
      <FieldInput field={field} value={value} onChange={onChange} disabled={disabled} error={error} />
      {field.helpText && <p className="fr-help">{field.helpText}</p>}
      {error && <p className="fr-errmsg">{error}</p>}
    </div>
  );
}

/* ============================================================
   1) PÁGINA RAIZ DO FORMULÁRIO  /forms/{slug}
   ============================================================ */
function FormRootPage({ form, nav }) {
  const fields = window.FORM_FIELDS[form.id] || [];
  return (
    <SubPageShell
      breadcrumbs={[
        { label: "Home", onClick: nav.catalog },
        { label: "Solicitações", onClick: nav.catalog },
        { label: form.title },
      ]}
      title={form.title}
      description={
        <>
          <span className="faint">Criado há 2 meses · {form.sector}</span>
          <p style={{ marginTop: 6 }}>{form.desc}</p>
        </>
      }
      actions={
        <>
          <button className="btn btn-ghost" onClick={nav.mine}><I.file size={16} /> Minhas solicitações</button>
          <button className="btn btn-accent" onClick={() => nav.respond(form.id)}><I.send size={15} /> Abrir nova solicitação</button>
        </>
      }
    >
      {/* faixa de info */}
      <div className="info-grid">
        <div><span className="faint">Setor responsável</span><strong><I.building size={14} /> {form.sector}</strong></div>
        <div><span className="faint">Prazo de resposta</span><strong><I.clock size={14} /> {form.sla}</strong></div>
        <div><span className="faint">Campos</span><strong><I.file size={14} /> {form.fields} ao todo</strong></div>
        <div><span className="faint">Em aberto agora</span><strong><I.inbox size={14} /> {form.open} solicitações</strong></div>
      </div>

      <Panel>
        <div className="prev-head">
          <h2 className="prev-title">{form.title}</h2>
          <span className="pill tone-neutral"><I.eye size={13} /> Pré-visualização</span>
        </div>
        <p className="muted" style={{ fontSize: 13.5, marginBottom: 22 }}>
          Estes são os campos que você vai preencher. Clique em <strong>Abrir nova solicitação</strong> para começar.
        </p>
        <div className="fr-form">
          {fields.map(f => <FieldRow key={f.name} field={f} value={f.type === "dynamic" ? (f.dynamicType === "user_name" ? window.CURRENT_USER.name : window.CURRENT_USER.sector) : (f.type === "checkbox" ? false : "")} onChange={() => {}} disabled />)}
        </div>
        <div className="prev-foot">
          <button className="btn btn-accent" onClick={() => nav.respond(form.id)}><I.send size={15} /> Abrir nova solicitação</button>
        </div>
      </Panel>
    </SubPageShell>
  );
}

/* ============================================================
   2) RESPONDER  /forms/{slug}/responder
   ============================================================ */
function RespondForm({ form, nav }) {
  const fields = window.FORM_FIELDS[form.id] || [];
  const initial = () => {
    const v = {};
    fields.forEach(f => {
      if (f.type === "dynamic") v[f.name] = f.dynamicType === "user_name" ? window.CURRENT_USER.name : window.CURRENT_USER.sector;
      else if (f.type === "checkbox") v[f.name] = false;
      else if (f.type === "combobox" && f.multiple) v[f.name] = [];
      else v[f.name] = "";
    });
    return v;
  };
  const [vals, setVals] = React.useState(initial);
  const [errs, setErrs] = React.useState({});
  const [sent, setSent] = React.useState(false);

  const set = (name, val) => { setVals(v => ({ ...v, [name]: val })); setErrs(e => { if (!e[name]) return e; const n = { ...e }; delete n[name]; return n; }); };

  const submit = (e) => {
    e.preventDefault();
    const ne = {};
    fields.forEach(f => {
      if (!f.required) return;
      const v = vals[f.name];
      const empty = v == null || v === "" || (Array.isArray(v) && v.length === 0) || (f.type === "checkbox" && !v);
      if (empty) ne[f.name] = "Este campo é obrigatório";
    });
    setErrs(ne);
    if (Object.keys(ne).length === 0) { setSent(true); window.scrollTo({ top: 0 }); }
  };

  const reset = () => { setVals(initial()); setErrs({}); setSent(false); };

  if (sent) {
    return (
      <Panel>
        <div className="fr-success">
          <div className="fr-success-ic"><I.checkCircle size={26} /></div>
          <div>
            <h3>Solicitação enviada com sucesso!</h3>
            <p className="muted">Os dados foram registrados e os responsáveis pelo setor <strong>{form.sector}</strong> serão notificados. Acompanhe o andamento em “Minhas solicitações”.</p>
          </div>
        </div>
        <div className="fr-success-foot">
          <button className="btn btn-ghost" onClick={nav.mine}><I.file size={15} /> Ver minhas solicitações</button>
          <button className="btn btn-accent" onClick={reset}><I.refresh size={15} /> Abrir nova solicitação</button>
        </div>
      </Panel>
    );
  }

  const required = fields.filter(f => f.required).length;
  return (
    <Panel>
      <div className="prev-head">
        <h2 className="prev-title">Preencha sua solicitação</h2>
        <span className="faint" style={{ fontSize: 12.5 }}>{required} campos obrigatórios · marcados com <span className="fr-req">*</span></span>
      </div>
      <form className="fr-form" onSubmit={submit} style={{ marginTop: 18 }}>
        {fields.map(f => (
          <FieldRow key={f.name} field={f} value={vals[f.name]} onChange={(v) => set(f.name, v)} error={errs[f.name]} />
        ))}
        <div className="prev-foot">
          <button type="button" className="btn btn-ghost" onClick={() => nav.form(form.id)}>Cancelar</button>
          <button type="submit" className="btn btn-accent"><I.send size={15} /> Enviar solicitação</button>
        </div>
      </form>
    </Panel>
  );
}

function RespondPage({ form, nav }) {
  return (
    <SubPageShell
      breadcrumbs={[
        { label: "Home", onClick: nav.catalog },
        { label: "Solicitações", onClick: nav.catalog },
        { label: form.title, onClick: () => nav.form(form.id) },
        { label: "Responder" },
      ]}
      title={form.title}
      description={<p>{form.desc}</p>}
    >
      <RespondForm form={form} nav={nav} />
    </SubPageShell>
  );
}

/* ============================================================
   3) MINHAS SOLICITAÇÕES  /forms/minhas-solicitacoes
   ============================================================ */
function mineStatusPill(status) {
  const m = window.STATUS_META[status];
  return <span className={"pill tone-" + m.tone}><span className={"dot " + m.tone} /> {m.short}</span>;
}

function RequestRow({ r, onOpen }) {
  return (
    <button className="mr-row" onClick={() => onOpen(r)}>
      <div className="mr-row-main">
        <div className="mr-row-top">
          <span className="mono faint" style={{ fontSize: 12 }}>#{r.id}</span>
          {mineStatusPill(r.status)}
          {r.waiting && <span className="mr-waiting">Aguardando você</span>}
        </div>
        <div className="mr-row-title">{r.form}</div>
        {r.statusComment && <div className="mr-row-comment"><I.msg size={12} /> {r.statusComment}</div>}
        <div className="mr-row-meta">
          <span>{r.sector}</span><span className="dotsep" />
          <span>Enviada {r.age}</span><span className="dotsep" />
          <span>{r.assignee ? "Responsável: " + r.assignee : "Sem responsável"}</span>
        </div>
      </div>
      <span className="mr-row-go"><I.arrowRight size={16} /></span>
    </button>
  );
}

function RequestBoardCard({ r, onOpen }) {
  return (
    <button className="b-card2" onClick={() => onOpen(r)}>
      <div className="mr-row-top">
        <span className="mono faint" style={{ fontSize: 11 }}>#{r.id}</span>
        {r.waiting && <span className="mr-waiting">Aguardando você</span>}
      </div>
      <div className="b-card2-title">{r.form}</div>
      {r.statusComment && <div className="mr-row-comment" style={{ marginBottom: 2 }}>{r.statusComment}</div>}
      <div className="b-card2-foot">
        <span className="faint" style={{ fontSize: 11 }}>{r.age}</span>
        <span className="faint" style={{ fontSize: 11 }}>{r.assignee ? r.assignee.split(" ")[0] : "—"}</span>
      </div>
    </button>
  );
}

function RequestDrawer({ req, onClose, onReply }) {
  const [msg, setMsg] = React.useState("");
  if (!req) return null;
  const send = () => { if (msg.trim()) { onReply(req.id, msg.trim()); setMsg(""); } };
  return (
    <div className="pg-drawer-wrap" onClick={onClose}>
      <div className="pg-drawer fade-in-r" onClick={e => e.stopPropagation()}>
        <div className="pg-drawer-head">
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span className="mono faint" style={{ fontSize: 13 }}>#{req.id}</span>
              {mineStatusPill(req.status)}
            </div>
            <h3 className="pg-drawer-title">{req.form}</h3>
            <span className="faint" style={{ fontSize: 12 }}>{req.sector} · Enviada {req.age}</span>
          </div>
          <button className="icon-btn" onClick={onClose}><I.plus size={20} style={{ transform: "rotate(45deg)" }} /></button>
        </div>

        <div className="pg-drawer-body">
          {req.statusComment && (
            <div className="pg-status-note">
              <span className={"dot " + window.STATUS_META[req.status].tone} />
              <span>{req.statusComment}</span>
            </div>
          )}

          <div className="pg-section-label">Dados enviados</div>
          <div className="pg-fields">
            {req.fieldsData.map(([k, v], i) => (
              <div key={i} className="pg-field"><span className="faint">{k}</span><span>{v}</span></div>
            ))}
          </div>

          <div className="pg-section-label" style={{ display: "flex", alignItems: "center", gap: 7 }}><I.msg size={14} /> Conversa</div>
          <div className="pg-thread">
            {req.thread.map((m, i) => {
              const mine = m.role === "Você";
              return (
                <div key={i} className={"pg-bubble-row" + (mine ? " mine" : "")}>
                  <div className={"pg-bubble" + (mine ? " mine" : "")}>
                    <div className="pg-bubble-head"><strong>{m.who}</strong><span className="faint">{m.role} · {m.time}</span></div>
                    <p>{m.msg}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pg-reply">
          <input placeholder="Escrever uma mensagem…" value={msg}
            onChange={e => setMsg(e.target.value)} onKeyDown={e => { if (e.key === "Enter") send(); }} />
          <button className="btn btn-accent btn-sm" onClick={send} disabled={!msg.trim()}><I.send size={14} /> Enviar</button>
        </div>
      </div>
    </div>
  );
}

function MyResponsesPage({ nav }) {
  const [reqs, setReqs] = React.useState(() => JSON.parse(JSON.stringify(window.MY_REQUESTS)));
  const [view, setView] = React.useState("lista"); // lista | quadro
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState("ALL");
  const [open, setOpen] = React.useState(null);

  const onReply = (id, message) => {
    setReqs(rs => rs.map(r => r.id === id ? { ...r, thread: [...r.thread, { who: window.CURRENT_USER.name, role: "Você", time: "agora", msg: message }] } : r));
    setOpen(o => o && o.id === id ? { ...o, thread: [...o.thread, { who: window.CURRENT_USER.name, role: "Você", time: "agora", msg: message }] } : o);
  };

  const filtered = reqs.filter(r =>
    (filter === "ALL" || r.status === filter) &&
    (q === "" || (r.form + r.id + r.sector).toLowerCase().includes(q.toLowerCase()))
  );

  const counts = {
    all: reqs.length,
    open: reqs.filter(r => r.status !== "COMPLETED").length,
    waiting: reqs.filter(r => r.waiting).length,
    done: reqs.filter(r => r.status === "COMPLETED").length,
  };
  const cols = window.STATUS_META;
  const STATUS_ORDER = ["NOT_STARTED", "IN_PROGRESS", "COMPLETED"];

  return (
    <SubPageShell
      breadcrumbs={[
        { label: "Home", onClick: nav.catalog },
        { label: "Solicitações", onClick: nav.catalog },
        { label: "Minhas solicitações" },
      ]}
      title="Minhas solicitações"
      description={<p>Visualize e acompanhe o status de todas as suas respostas a solicitações.</p>}
      actions={<button className="btn btn-accent" onClick={nav.catalog}><I.plus size={16} /> Nova solicitação</button>}
    >
      <div className="kpi-strip" style={{ margin: "20px 0 24px" }}>
        <div className="kpi"><span className="v">{counts.all}</span><span className="l">Total</span></div>
        <div className="kpi"><span className="v">{counts.open}</span><span className="l">Em aberto</span></div>
        <div className="kpi"><span className="v warn">{counts.waiting}</span><span className="l">Aguardando você</span></div>
        <div className="kpi"><span className="v accent">{counts.done}</span><span className="l">Concluídas</span></div>
      </div>

      <div className="mr-toolbar">
        <div className="search" style={{ maxWidth: 340 }}>
          <I.search size={16} />
          <input placeholder="Buscar por nº, formulário…" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div style={{ flex: 1 }} />
        <div className="seg">
          <button className={view === "lista" ? "active" : ""} onClick={() => setView("lista")}><I.list size={15} /> Lista</button>
          <button className={view === "quadro" ? "active" : ""} onClick={() => setView("quadro")}><I.board size={15} /> Quadro</button>
        </div>
      </div>

      {view === "lista" && (
        <div className="chips" style={{ margin: "0 0 16px" }}>
          {[["ALL", "Todas"], ["NOT_STARTED", "Não iniciadas"], ["IN_PROGRESS", "Em andamento"], ["COMPLETED", "Concluídas"]].map(([k, l]) => (
            <button key={k} className={"chip" + (filter === k ? " active" : "")} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>
      )}

      {view === "lista" ? (
        <div className="mr-list">
          {filtered.map(r => <RequestRow key={r.id} r={r} onOpen={setOpen} />)}
          {filtered.length === 0 && (
            <div className="card" style={{ padding: 40, textAlign: "center", color: "hsl(var(--muted))" }}>
              <I.inbox size={32} style={{ opacity: .5, marginBottom: 8 }} />
              <div>Nenhuma solicitação encontrada.</div>
            </div>
          )}
        </div>
      ) : (
        <div className="board">
          {STATUS_ORDER.map(s => {
            const items = reqs.filter(r => r.status === s);
            return (
              <div className="b-col" key={s}>
                <div className="b-col-head">
                  <span className={"dot " + cols[s].tone} />
                  <span className="b-col-title">{cols[s].label}</span>
                  <span className="b-col-count">{items.length}</span>
                </div>
                <div className="b-col-body">
                  {items.map(r => <RequestBoardCard key={r.id} r={r} onOpen={setOpen} />)}
                  {items.length === 0 && <div className="b-empty">Nenhuma solicitação aqui</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RequestDrawer req={open} onClose={() => setOpen(null)} onReply={onReply} />
    </SubPageShell>
  );
}

const pagesCss = `
/* breadcrumb */
.bc { display: flex; align-items: center; gap: 6px; margin-bottom: 16px; flex-wrap: wrap; }
.bc-link { font-size: 12.5px; color: hsl(var(--muted)); font-weight: 500; transition: color .14s; }
.bc-link:hover { color: hsl(var(--text)); }
button.bc-link { cursor: pointer; }
.bc-cur { font-size: 12.5px; color: hsl(var(--text)); font-weight: 600; }
.bc-sep { color: hsl(var(--faint)); opacity: .6; }

/* shell head */
.sp-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
.sp-back { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 10px; padding: 5px 10px; border-radius: 8px;
  font-size: 12px; font-weight: 500; color: hsl(var(--muted)); border: 1px solid hsl(var(--border-soft)); background: hsl(var(--card)); }
.sp-back:hover { color: hsl(var(--text)); border-color: hsl(var(--border)); }
.sp-desc { margin-top: 8px; max-width: 70ch; font-size: 14px; color: hsl(var(--muted)); line-height: 1.55; }
.sp-actions { display: flex; gap: 10px; flex-wrap: wrap; }

/* info grid (form root) */
.info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; margin: 24px 0; border-radius: var(--radius);
  overflow: hidden; border: 1px solid hsl(var(--border-soft)); background: hsl(var(--border-soft)); }
.info-grid > div { background: hsl(var(--card) / .9); padding: 15px 18px; display: flex; flex-direction: column; gap: 6px; }
.info-grid .faint { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
.info-grid strong { font-size: 14px; display: inline-flex; align-items: center; gap: 7px; }
.info-grid strong svg { color: hsl(var(--faint)); }
@media (max-width: 860px) { .info-grid { grid-template-columns: 1fr 1fr; } }

/* panel */
.sp-panel { background: hsl(var(--card) / .8); border: 1px solid hsl(var(--border-soft)); border-radius: var(--radius);
  padding: 26px 28px; backdrop-filter: blur(6px); box-shadow: var(--shadow-sm); }
.prev-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.prev-title { font-size: 19px; font-weight: 650; letter-spacing: -.02em; }
.prev-foot { display: flex; justify-content: flex-end; gap: 10px; margin-top: 26px; padding-top: 22px; border-top: 1px solid hsl(var(--border-soft)); }

/* form */
.fr-form { display: flex; flex-direction: column; gap: 20px; max-width: 680px; }
.fr-row { display: flex; flex-direction: column; gap: 8px; }
.fr-label { font-size: 13.5px; font-weight: 600; }
.fr-req { color: hsl(0 72% 58%); margin-left: 3px; }
.fr-help { font-size: 12px; color: hsl(var(--muted)); }
.fr-errmsg { font-size: 12.5px; font-weight: 500; color: hsl(0 72% 60%); }
.fr-input, .fr-textarea, .fr-select {
  width: 100%; font-family: inherit; font-size: 14px; color: hsl(var(--text));
  background: hsl(var(--card-2) / .7); border: 1px solid hsl(var(--border)); border-radius: 9px; outline: none; transition: border-color .15s, box-shadow .15s;
}
.fr-input { height: 42px; padding: 0 14px; }
.fr-textarea { padding: 11px 14px; resize: vertical; line-height: 1.5; }
.fr-input:focus, .fr-textarea:focus, .fr-select:focus { border-color: hsl(var(--accent) / .6); box-shadow: 0 0 0 3px hsl(var(--accent) / .12); }
.fr-input::placeholder, .fr-textarea::placeholder { color: hsl(var(--faint)); }
.fr-input:disabled, .fr-textarea:disabled, .fr-select:disabled { opacity: .7; cursor: default; }
.fr-err { border-color: hsl(0 72% 55% / .7) !important; }
.fr-select-wrap { position: relative; display: block; }
.fr-select { height: 42px; padding: 0 38px 0 14px; appearance: none; cursor: pointer; text-align: left; }
.fr-select-ic { position: absolute; right: 13px; top: 50%; transform: translateY(-50%); color: hsl(var(--muted)); pointer-events: none; }
.fr-select option { color: initial; }

/* checkbox */
.fr-check { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px; user-select: none; }
.fr-check input { position: absolute; opacity: 0; width: 0; height: 0; }
.fr-check-box { width: 20px; height: 20px; border-radius: 6px; border: 1px solid hsl(var(--border)); background: hsl(var(--card-2));
  display: grid; place-items: center; color: #fff; transition: all .15s; flex-shrink: 0; }
.fr-check input:checked + .fr-check-box { background: hsl(var(--accent)); border-color: hsl(var(--accent)); }
.fr-check.disabled { opacity: .7; cursor: default; }

/* multiselect */
.fr-ms { position: relative; }
.fr-ms-box { width: 100%; min-height: 42px; height: auto; padding: 6px 38px 6px 10px; cursor: pointer; display: flex; align-items: center; }
.fr-ms-ph { color: hsl(var(--faint)); font-size: 14px; padding-left: 4px; }
.fr-ms-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.fr-chip { display: inline-flex; align-items: center; padding: 3px 9px; border-radius: 7px; font-size: 12.5px; font-weight: 500;
  background: hsl(var(--accent) / .14); color: hsl(var(--accent)); border: 1px solid hsl(var(--accent) / .25); }
:root[data-theme="light"] .fr-chip { color: hsl(184 100% 26%); }
.fr-ms-menu { position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 30; padding: 5px;
  background: hsl(var(--panel)); border: 1px solid hsl(var(--border)); border-radius: 10px; box-shadow: var(--shadow); max-height: 240px; overflow-y: auto; }
.fr-ms-opt { display: flex; align-items: center; gap: 9px; width: 100%; padding: 8px 10px; border-radius: 7px; font-size: 13.5px; color: hsl(var(--text)); text-align: left; }
.fr-ms-opt:hover { background: hsl(var(--card-2)); }
.fr-ms-check { width: 18px; height: 18px; border-radius: 5px; border: 1px solid hsl(var(--border)); display: grid; place-items: center; color: #fff; flex-shrink: 0; }
.fr-ms-opt.on .fr-ms-check { background: hsl(var(--accent)); border-color: hsl(var(--accent)); }

/* file */
.fr-file { display: flex; align-items: center; gap: 10px; min-height: 46px; padding: 0 16px; border-radius: 9px; cursor: pointer;
  border: 1px dashed hsl(var(--border)); background: hsl(var(--card-2) / .5); color: hsl(var(--muted)); font-size: 13.5px; transition: all .15s; }
.fr-file:hover { border-color: hsl(var(--accent) / .5); color: hsl(var(--text)); }
.fr-file input { display: none; }
.fr-file-hint { margin-left: auto; font-size: 11.5px; color: hsl(var(--faint)); font-family: var(--mono); }
.fr-file.disabled { opacity: .7; cursor: default; }

/* dynamic */
.fr-dynamic { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 42px;
  padding: 0 14px; border-radius: 9px; background: hsl(var(--card-2) / .5); border: 1px solid hsl(var(--border-soft)); }
.fr-dyn-val { font-size: 14px; font-weight: 500; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fr-dyn-lock { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: hsl(var(--faint)); flex-shrink: 0; }

/* success */
.fr-success { display: flex; gap: 16px; align-items: flex-start; padding: 8px 0 4px; }
.fr-success-ic { width: 48px; height: 48px; border-radius: 12px; flex-shrink: 0; display: grid; place-items: center;
  color: hsl(158 64% 45%); background: hsl(158 64% 45% / .12); border: 1px solid hsl(158 64% 45% / .25); }
.fr-success h3 { font-size: 17px; font-weight: 650; margin-bottom: 6px; }
.fr-success p { font-size: 13.5px; line-height: 1.55; max-width: 60ch; }
.fr-success-foot { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; padding-top: 20px; border-top: 1px solid hsl(var(--border-soft)); }

/* my responses */
.mr-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.mr-list { display: flex; flex-direction: column; gap: 10px; }
.mr-row { display: flex; align-items: center; gap: 16px; width: 100%; text-align: left; padding: 16px 18px;
  background: hsl(var(--card) / .9); border: 1px solid hsl(var(--border-soft)); border-radius: var(--radius); cursor: pointer; transition: all .15s; backdrop-filter: blur(6px); }
.mr-row:hover { border-color: hsl(var(--accent) / .4); transform: translateY(-1px); box-shadow: var(--shadow); }
.mr-row-main { flex: 1; min-width: 0; }
.mr-row-top { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
.mr-waiting { font-size: 11px; font-weight: 600; color: hsl(38 92% 55%); background: hsl(38 92% 50% / .12); padding: 2px 8px; border-radius: 99px; }
:root[data-theme="light"] .mr-waiting { color: hsl(32 90% 40%); }
.mr-row-title { font-size: 15px; font-weight: 600; letter-spacing: -.01em; margin: 7px 0 6px; }
.mr-row-comment { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: hsl(var(--muted)); margin-bottom: 8px; }
.mr-row-comment svg { flex-shrink: 0; opacity: .7; }
.mr-row-meta { display: flex; align-items: center; gap: 9px; font-size: 12px; color: hsl(var(--faint)); flex-wrap: wrap; }
.mr-row-go { color: hsl(var(--faint)); flex-shrink: 0; transition: transform .15s, color .15s; }
.mr-row:hover .mr-row-go { color: hsl(var(--accent)); transform: translateX(2px); }

/* board cards (cliente) */
.b-card2 { text-align: left; width: 100%; padding: 14px; border-radius: 11px; background: hsl(var(--card)); border: 1px solid hsl(var(--border-soft));
  display: flex; flex-direction: column; gap: 8px; transition: all .14s; cursor: pointer; }
.b-card2:hover { border-color: hsl(var(--accent) / .45); transform: translateY(-1px); box-shadow: var(--shadow); }
.b-card2-title { font-size: 13.5px; font-weight: 600; line-height: 1.4; }
.b-card2-foot { display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid hsl(var(--border-soft)); }

/* drawer (cliente) */
.pg-drawer-wrap { position: fixed; inset: 0; z-index: 60; background: rgba(0,0,0,.45); display: flex; justify-content: flex-end; }
.pg-drawer { width: 480px; max-width: 94vw; height: 100%; display: flex; flex-direction: column; background: hsl(var(--panel)); border-left: 1px solid hsl(var(--border)); }
.pg-drawer-head { display: flex; align-items: flex-start; gap: 12px; padding: 22px 22px 16px; border-bottom: 1px solid hsl(var(--border-soft)); }
.pg-drawer-title { font-size: 16px; font-weight: 650; letter-spacing: -.01em; margin: 8px 0 4px; }
.pg-drawer-body { flex: 1; overflow-y: auto; padding: 20px 22px; }
.pg-status-note { display: flex; align-items: flex-start; gap: 9px; padding: 12px 14px; border-radius: 11px;
  background: hsl(var(--card-2) / .7); border: 1px solid hsl(var(--border-soft)); font-size: 13px; margin-bottom: 22px; }
.pg-status-note .dot { margin-top: 6px; }
.pg-section-label { font-size: 11.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: hsl(var(--muted)); margin: 4px 0 12px; }
.pg-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 1px; border-radius: 11px; overflow: hidden; border: 1px solid hsl(var(--border-soft)); background: hsl(var(--border-soft)); margin-bottom: 24px; }
.pg-field { background: hsl(var(--card)); padding: 11px 14px; display: flex; flex-direction: column; gap: 3px; }
.pg-field .faint { font-size: 11px; }
.pg-field span:last-child { font-size: 13px; font-weight: 500; }
.pg-field:nth-last-child(1):nth-child(odd) { grid-column: 1 / -1; }
.pg-thread { display: flex; flex-direction: column; gap: 12px; }
.pg-bubble-row { display: flex; }
.pg-bubble-row.mine { justify-content: flex-end; }
.pg-bubble { max-width: 82%; padding: 10px 13px; border-radius: 13px; border-top-left-radius: 4px; background: hsl(var(--card-2)); border: 1px solid hsl(var(--border-soft)); }
.pg-bubble.mine { background: hsl(var(--accent) / .12); border-color: hsl(var(--accent) / .25); border-top-left-radius: 13px; border-top-right-radius: 4px; }
.pg-bubble-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; }
.pg-bubble-head strong { font-size: 12.5px; }
.pg-bubble-head .faint { font-size: 10.5px; }
.pg-bubble p { font-size: 13px; line-height: 1.5; }
.pg-reply { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-top: 1px solid hsl(var(--border-soft)); background: hsl(var(--panel) / .6); }
.pg-reply input { flex: 1; height: 38px; padding: 0 13px; border-radius: 9px; font-size: 13.5px; color: hsl(var(--text)); outline: none;
  background: hsl(var(--card-2)); border: 1px solid hsl(var(--border-soft)); }
.pg-reply input:focus { border-color: hsl(var(--accent) / .5); }
`;

Object.assign(window, { SubPageShell, FormRootPage, RespondPage, MyResponsesPage });
