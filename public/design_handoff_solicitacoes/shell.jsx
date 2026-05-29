/* ============================================================
   Shell do elo: sidebar + topbar + orquestração de visões
   ============================================================ */

function NavItem({ icon: Icon, label, active, hasChildren, open, onClick, sub }) {
  return (
    <button className={"nav-item" + (active ? " active" : "")} onClick={onClick}>
      <Icon size={sub ? 16 : 18} />
      <span>{label}</span>
      {hasChildren && <I.chev className="chev" size={15} />}
    </button>
  );
}

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="glyph"><EloGlyph size={26} /></span>
        <span className="word">elo</span>
      </div>
      <nav className="nav">
        <NavItem icon={I.dash} label="Dashboard" />
        <NavItem icon={I.reserve} label="Reserva de Recursos" hasChildren />
        <NavItem icon={I.mega} label="Anúncios" hasChildren />
        <div className="nav-group open">
          <NavItem icon={I.file} label="Formulários" hasChildren active />
          <div className="subnav">
            <NavItem icon={I.bulb} label="Minhas Ideias" sub />
            <NavItem icon={I.form} label="Solicitações" sub active />
          </div>
        </div>
        <NavItem icon={I.cart} label="Lojinha" />
        <NavItem icon={I.phone} label="Lista de ramais" />
        <NavItem icon={I.admin} label="Admin" />
      </nav>
      <div className="sidebar-foot">
        <NavItem icon={I.spark} label="Novidades" />
        <NavItem icon={I.settings} label="Configurações" />
      </div>
    </aside>
  );
}

function Topbar({ theme, setTheme, collapsed, setCollapsed, newLayout, setNewLayout, role }) {
  return (
    <header className="topbar">
      <button className="icon-btn" onClick={() => setCollapsed(!collapsed)} title="Menu"><I.menu size={20} /></button>
      <div className="org">Grupo R Henz</div>
      <div style={{ flex: 1 }} />

      <button
        className={"layout-switch" + (newLayout ? " on" : "")}
        onClick={() => setNewLayout(!newLayout)}
        title="Alternar o visual da página para você"
      >
        <I.bolt size={15} />
        <span>Novo layout</span>
        <span className="pip" />
      </button>

      <button className="icon-btn" title="Assistente"><I.spark size={19} /></button>
      <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} title="Tema">
        {theme === "dark" ? <I.sun size={19} /> : <I.moon size={19} />}
      </button>
      <div className="avatar">{role === "tech" ? "GW" : "R"}</div>
    </header>
  );
}

function App() {
  const [theme, setThemeState] = React.useState("dark");
  const [collapsed, setCollapsed] = React.useState(false);
  const [newLayout, setNewLayout] = React.useState(true);
  const [role, setRole] = React.useState("client"); // client | tech

  const setTheme = (t) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
  };
  React.useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, []);

  return (
    <div className={"app" + (collapsed ? " collapsed" : "")}>
      <div className="glow" />
      <Sidebar />
      <div className="main">
        <Topbar
          theme={theme} setTheme={setTheme}
          collapsed={collapsed} setCollapsed={setCollapsed}
          newLayout={newLayout} setNewLayout={setNewLayout}
          role={role}
        />
        <div className="content">
          <div className="content-inner">
            {/* Banner explicando o toggle quando ligado */}
            {newLayout && (
              <div className="card fade-in" style={{
                display: "flex", alignItems: "center", gap: 12, padding: "11px 16px", marginBottom: 22,
                borderColor: "hsl(var(--accent) / .3)", background: "hsl(var(--accent) / .07)"
              }}>
                <I.bolt size={16} style={{ color: "hsl(var(--accent))" }} />
                <span style={{ fontSize: 13 }}>
                  <strong>Novo layout do módulo de Solicitações</strong>
                  <span className="muted"> — ativado só para você. Use o botão no topo para voltar ao visual atual.</span>
                </span>
                <div style={{ flex: 1 }} />
                <RoleSwitch role={role} setRole={setRole} />
              </div>
            )}

            {newLayout
              ? (role === "client" ? <ClientView /> : <TechView />)
              : <ClassicView role={role} setRole={setRole} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleSwitch({ role, setRole }) {
  return (
    <div className="seg">
      <button className={role === "client" ? "active" : ""} onClick={() => setRole("client")}>
        <I.user size={15} /> Visão do cliente
      </button>
      <button className={role === "tech" ? "active" : ""} onClick={() => setRole("tech")}>
        <I.bolt size={15} /> Visão do técnico
      </button>
    </div>
  );
}

window.App = App;
window.RoleSwitch = RoleSwitch;
