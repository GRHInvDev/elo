/* ============================================================
   VISÃO CLÁSSICA (o "antes") — recriação aproximada das telas atuais
   ============================================================ */

function ClassicCard({ form }) {
  return (
    <div className="cl-card">
      <div className="cl-card-title">{form.title.toUpperCase()}</div>
      <div className="faint" style={{ fontSize: 12.5, marginTop: 3 }}>Criado há cerca de 1 ano</div>
      <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
        <button className="btn btn-ghost btn-sm"><I.edit size={13} /> Editar</button>
      </div>
      <p className="muted" style={{ fontSize: 13, marginTop: 16, lineHeight: 1.5, flex: 1 }}>{form.desc}</p>
      <div className="faint" style={{ fontSize: 13, marginTop: 12 }}>{form.fields} campos</div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 18, paddingTop: 14, borderTop: "1px solid hsl(var(--border-soft))" }}>
        <button className="btn btn-ghost btn-sm"><I.eye size={13} /> Ver</button>
        <button className="btn btn-primary btn-sm"><I.file size={13} /> Abrir nova solicitação</button>
      </div>
    </div>
  );
}

function ClassicClient() {
  return (
    <div>
      <div className="cv-head">
        <div>
          <h1 className="h-title">Solicitações</h1>
          <p className="h-sub">Crie, gerencie e responda solicitações personalizadas.</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-ghost"><I.file size={16} /> Minhas solicitações</button>
          <button className="btn btn-primary"><I.plus size={16} /> Criar um novo formulário</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, margin: "20px 0 24px" }}>
        <button className="btn btn-ghost btn-sm">Tutorial <I.file size={13} /></button>
        <button className="btn btn-ghost btn-sm"><I.board size={13} /> Kanban</button>
      </div>
      <div className="cl-grid">
        {window.FORMS.map(f => <ClassicCard key={f.id} form={f} />)}
      </div>
    </div>
  );
}

function ClassicKanbanCard({ t }) {
  return (
    <div className="clk-card">
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <span className="mono faint" style={{ fontSize: 12 }}>#{t.id}</span>
        <span style={{ fontSize: 12.5, fontWeight: 600, flex: 1 }}>{t.form.toUpperCase()}</span>
        {t.isNew && <span className="q-new">Novo</span>}
      </div>
      {t.tag && <span className="clk-tag">{t.tag}</span>}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 8, fontSize: 12.5 }}>
        <I.user size={13} className="faint" /> {t.requester}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 5, fontSize: 12 }} className="faint">
        <I.calendar size={12} /> {t.age}
      </div>
      <button className="btn btn-primary btn-sm" style={{ width: "100%", marginTop: 12 }}><I.msg size={13} /> Detalhes</button>
    </div>
  );
}

function ClassicTech() {
  const cols = [
    { key: "NOT_STARTED", label: "Não Iniciado", n: 18, accent: "0 72% 50%" },
    { key: "IN_PROGRESS", label: "Em Progresso", n: 21, accent: "45 90% 50%" },
    { key: "COMPLETED", label: "Concluído", n: 746, accent: "158 64% 42%" },
  ];
  return (
    <div>
      <div className="cv-head">
        <div>
          <h1 className="h-title">Kanban de Solicitações</h1>
          <p className="h-sub">Visualize e organize as respostas recebidas nos seus formulários.</p>
        </div>
        <button className="btn btn-primary"><I.tag size={15} /> Gerenciar Tags</button>
      </div>

      <div className="card" style={{ padding: 18, margin: "22px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, fontWeight: 600, marginBottom: 14 }}>
          <I.filter size={16} /> Filtros Avançados <I.chevDown size={15} className="faint" />
        </div>
        <div className="cl-filters">
          {["Número", "Solicitante", "Setor", "Formulário", "Status", "Prioridade", "Tags", "Período"].map(f => (
            <div key={f}>
              <div className="faint" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>{f}</div>
              <div className="cl-input" />
            </div>
          ))}
        </div>
      </div>

      <div className="clk-board">
        {cols.map(c => (
          <div key={c.key} className="clk-col" style={{ borderTop: `3px solid hsl(${c.accent})` }}>
            <div className="clk-col-head" style={{ color: `hsl(${c.accent})` }}>{c.label} ({c.n})</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {window.TICKETS.filter(t => t.status === c.key).map(t => <ClassicKanbanCard key={t.id} t={t} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ClassicView({ role, setRole }) {
  return (
    <div className="fade-in">
      <style>{classicCss}</style>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <RoleSwitch role={role} setRole={setRole} />
      </div>
      {role === "client" ? <ClassicClient /> : <ClassicTech />}
    </div>
  );
}

const classicCss = `
.cl-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
@media (max-width: 1000px) { .cl-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 700px) { .cl-grid { grid-template-columns: 1fr; } }
.cl-card { display: flex; flex-direction: column; padding: 20px; border-radius: var(--radius); background: hsl(var(--card) / .85); border: 1px solid hsl(var(--border-soft)); min-height: 290px; }
.cl-card-title { font-size: 15px; font-weight: 700; line-height: 1.3; letter-spacing: -.01em; }
.cl-filters { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
@media (max-width: 900px) { .cl-filters { grid-template-columns: 1fr 1fr; } }
.cl-input { height: 38px; border-radius: 9px; background: hsl(var(--card-2)); border: 1px solid hsl(var(--border-soft)); }
.clk-board { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; align-items: start; }
@media (max-width: 1000px) { .clk-board { grid-template-columns: 1fr; } }
.clk-col { background: hsl(var(--card) / .5); border: 1px solid hsl(var(--border-soft)); border-radius: var(--radius); padding: 14px; }
.clk-col-head { font-size: 16px; font-weight: 700; margin-bottom: 14px; }
.clk-card { padding: 13px; border-radius: 10px; background: hsl(var(--card)); border: 1px solid hsl(var(--border-soft)); }
.clk-tag { display: inline-block; margin-top: 8px; font-size: 11px; font-weight: 600; color: #fff; background: linear-gradient(90deg, hsl(330 80% 55%), hsl(280 70% 55%)); padding: 2px 10px; border-radius: 99px; }
`;

window.ClassicView = ClassicView;
