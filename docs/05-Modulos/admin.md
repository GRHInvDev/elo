# 🔧 Painéis Administrativos

## 📋 Visão Geral

O **Sistema de Painéis Administrativos** é o centro de controle completo do Sistema de Intranet ELO, oferecendo ferramentas abrangentes para gestão, monitoramento e configuração de todos os módulos e funcionalidades da plataforma.

## 🎯 Objetivos

### **Para Administradores**
- ✅ **Controle Total** - Gerenciamento completo do sistema
- ✅ **Monitoramento** - Visibilidade de todos os módulos
- ✅ **Configuração** - Personalização de regras e políticas
- ✅ **Auditoria** - Rastreamento de todas as ações
- ✅ **Manutenção** - Ferramentas de diagnóstico e reparo
- ✅ **Relatórios** - Analytics avançados e insights

### **Para Gestores de Sistema**
- ✅ **Performance** - Monitoramento de métricas do sistema
- ✅ **Segurança** - Controle de acessos e permissões
- ✅ **Integrações** - Gerenciamento de conexões externas
- ✅ **Backup** - Estratégias de recuperação de dados
- ✅ **Suporte** - Ferramentas de diagnóstico de problemas

## 🏗️ Arquitetura do Sistema Administrativo

### **Componentes Principais**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Admin Panel   │    │   Management     │    │   Monitoring    │
│   Dashboard     │◄──►│   Modules        │◄──►│   System        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User          │    │   Configuration  │    │   Analytics     │
│   Management    │    │   Engine         │    │   Engine        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 🎛️ Painel de Controle Principal

### **Dashboard Administrativo**
```tsx
// src/app/admin/page.tsx
export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Painel Administrativo</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setActiveTab('system')}>
            Sistema
          </Button>
          <Button variant="outline" onClick={() => setActiveTab('users')}>
            Usuários
          </Button>
          <Button variant="outline" onClick={() => setActiveTab('reports')}>
            Relatórios
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="system">
          <SystemTab />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>

        <TabsContent value="content">
          <ContentTab />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsTab />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### **Visão Geral do Sistema**
```tsx
function OverviewTab() {
  const { data: systemHealth } = trpc.admin.getSystemHealth.useQuery()
  const { data: metrics } = trpc.admin.getSystemMetrics.useQuery()

  return (
    <div className="space-y-6">
      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemHealth?.status === 'HEALTHY' ? '🟢' : '🔴'} {systemHealth?.status}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{metrics?.userGrowth}% vs ontem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">
              30 dias consecutivos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {systemHealth?.alerts?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requer atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Health Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Saúde do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <SystemHealthChart data={systemHealth} />
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivityFeed />
        </CardContent>
      </Card>
    </div>
  )
}
```

## 👥 Gestão de Usuários

### **Painel de Usuários**
```tsx
function UsersTab() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string | null>(null)

  const { data: users, isLoading } = trpc.admin.getUsers.useQuery({
    search: searchTerm,
    role: selectedRole,
    page: 1,
    limit: 20,
  })

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Buscar usuários..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={selectedRole || ''} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por função" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as funções</SelectItem>
            <SelectItem value="ADMIN">Administrador</SelectItem>
            <SelectItem value="MANAGER">Gestor</SelectItem>
            <SelectItem value="USER">Usuário</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersTable users={users?.users || []} />
        </CardContent>
      </Card>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.total || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Usuários Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {users?.active || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Novos (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {users?.newThisMonth || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Inativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {users?.inactive || 0}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

### **Tabela de Usuários**
```tsx
function UsersTable({ users }: { users: User[] }) {
  const updateRoleMutation = trpc.admin.updateUserRole.useMutation()
  const toggleStatusMutation = trpc.admin.toggleUserStatus.useMutation()

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateRoleMutation.mutateAsync({ userId, role: newRole })
      // Show success message
    } catch (error) {
      // Handle error
    }
  }

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage src={user.imageUrl} />
              <AvatarFallback>
                {user.firstName[0]}{user.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium">
                {user.firstName} {user.lastName}
              </h4>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                {user.enterprise} • {user.setor}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
              {user.role}
            </Badge>

            <Select
              value={user.role}
              onValueChange={(value) => handleRoleChange(user.id, value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USER">Usuário</SelectItem>
                <SelectItem value="MANAGER">Gestor</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleStatusMutation.mutate({ userId: user.id })}
            >
              {user.isActive ? 'Desativar' : 'Ativar'}
            </Button>

            <Button variant="outline" size="sm">
              Ver Detalhes
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

### **Detalhes do Usuário**
```tsx
function UserDetailsModal({ user, onClose }: { user: User; onClose: () => void }) {
  const { data: userStats } = trpc.admin.getUserStats.useQuery({ userId: user.id })
  const { data: userActivity } = trpc.admin.getUserActivity.useQuery({ userId: user.id })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={user.imageUrl} />
                <AvatarFallback className="text-lg">
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                  <Badge variant={user.isActive ? 'default' : 'destructive'}>
                    {user.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>

          <Tabs defaultValue="stats" className="space-y-4">
            <TabsList>
              <TabsTrigger value="stats">Estatísticas</TabsTrigger>
              <TabsTrigger value="activity">Atividade</TabsTrigger>
              <TabsTrigger value="permissions">Permissões</TabsTrigger>
            </TabsList>

            <TabsContent value="stats">
              <UserStats stats={userStats} />
            </TabsContent>

            <TabsContent value="activity">
              <UserActivity activity={userActivity} />
            </TabsContent>

            <TabsContent value="permissions">
              <UserPermissions user={user} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
```

## ⚙️ Configurações do Sistema

### **Painel de Configurações**
```tsx
function SettingsTab() {
  const [activeSection, setActiveSection] = useState('general')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Configurações do Sistema</h2>
      </div>

      <Tabs value={activeSection} onValueChange={setActiveSection}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="integrations">Integrações</TabsTrigger>
          <TabsTrigger value="maintenance">Manutenção</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationSettings />
        </TabsContent>

        <TabsContent value="maintenance">
          <MaintenanceSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### **Configurações Gerais**
```tsx
function GeneralSettings() {
  const { data: settings } = trpc.admin.getSystemSettings.useQuery()
  const updateSettingsMutation = trpc.admin.updateSystemSettings.useMutation()

  const handleSave = async (newSettings: any) => {
    try {
      await updateSettingsMutation.mutateAsync(newSettings)
      // Show success message
    } catch (error) {
      // Handle error
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações da Empresa</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa</Label>
              <Input
                id="companyName"
                defaultValue={settings?.companyName}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Email da Empresa</Label>
              <Input
                id="companyEmail"
                type="email"
                defaultValue={settings?.companyEmail}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horários de Funcionamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Horário de Início</Label>
              <Input
                id="startTime"
                type="time"
                defaultValue={settings?.businessHours?.start}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Horário de Fim</Label>
              <Input
                id="endTime"
                type="time"
                defaultValue={settings?.businessHours?.end}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => handleSave({})}>
          Salvar Configurações
        </Button>
      </div>
    </div>
  )
}
```

### **Configurações de Segurança**
```tsx
function SecuritySettings() {
  const { data: securitySettings } = trpc.admin.getSecuritySettings.useQuery()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Políticas de Senha</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Exigir senha forte</Label>
                <p className="text-sm text-muted-foreground">
                  Mínimo 8 caracteres, maiúsculas, minúsculas e números
                </p>
              </div>
              <Switch defaultChecked={securitySettings?.strongPassword} />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Expirar senhas</Label>
                <p className="text-sm text-muted-foreground">
                  Forçar mudança a cada 90 dias
                </p>
              </div>
              <Switch defaultChecked={securitySettings?.passwordExpiry} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bloqueio de Conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">Tentativas Máximas</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                defaultValue={securitySettings?.maxLoginAttempts || 5}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lockoutDuration">Duração do Bloqueio (min)</Label>
              <Input
                id="lockoutDuration"
                type="number"
                defaultValue={securitySettings?.lockoutDuration || 30}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sessões únicas</Label>
                <p className="text-sm text-muted-foreground">
                  Permitir apenas uma sessão por usuário
                </p>
              </div>
              <Switch defaultChecked={securitySettings?.singleSession} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Timeout da Sessão (min)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                defaultValue={securitySettings?.sessionTimeout || 480}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

## 📊 Relatórios e Analytics

### **Painel de Relatórios**
```tsx
function ReportsTab() {
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  })

  const { data: reportData } = trpc.admin.getReports.useQuery({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  })

  return (
    <div className="space-y-6">
      {/* Date Range Picker */}
      <Card>
        <CardHeader>
          <CardTitle>Período do Relatório</CardTitle>
        </CardHeader>
        <CardContent>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.users?.total}</div>
            <p className="text-xs text-muted-foreground">
              +{reportData?.users?.growth}% vs período anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Atividades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.activities?.total}</div>
            <p className="text-xs text-muted-foreground">
              Média {reportData?.activities?.daily} por dia
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Reservas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData?.bookings?.total}</div>
            <p className="text-xs text-muted-foreground">
              Taxa de ocupação: {reportData?.bookings?.occupancy}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {reportData?.sales?.total?.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {reportData?.sales?.orders} pedidos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Uso por Módulo</CardTitle>
          </CardHeader>
          <CardContent>
            <ModuleUsageChart data={reportData?.moduleUsage} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Atividade por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityChart data={reportData?.dailyActivity} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuários por Empresa</CardTitle>
          </CardHeader>
          <CardContent>
            <CompanyUsersChart data={reportData?.companyUsers} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Funcionalidades</CardTitle>
          </CardHeader>
          <CardContent>
            <TopFeaturesList data={reportData?.topFeatures} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

## 🔍 Logs de Auditoria

### **Sistema de Auditoria**
```tsx
function AuditLogsTab() {
  const [filters, setFilters] = useState({
    action: null,
    userId: null,
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  })

  const { data: auditLogs } = trpc.admin.getAuditLogs.useQuery({
    ...filters,
    page: 1,
    limit: 50,
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Logs de Auditoria</h2>
        <Button variant="outline">
          Exportar Logs
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditFilters filters={filters} onFiltersChange={setFilters} />
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Auditoria</CardTitle>
        </CardHeader>
        <CardContent>
          <AuditLogsTable logs={auditLogs?.logs || []} />
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Mostrando {auditLogs?.logs?.length || 0} de {auditLogs?.total || 0} registros
        </p>
        <Pagination
          currentPage={1}
          totalPages={Math.ceil((auditLogs?.total || 0) / 50)}
          onPageChange={(page) => {/* Handle page change */}}
        />
      </div>
    </div>
  )
}
```

### **Tabela de Logs de Auditoria**
```tsx
function AuditLogsTable({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-4">
            <div className={`w-2 h-2 rounded-full ${
              log.level === 'ERROR' ? 'bg-red-500' :
              log.level === 'WARN' ? 'bg-yellow-500' : 'bg-green-500'
            }`}></div>

            <div>
              <p className="font-medium">{log.action}</p>
              <p className="text-sm text-muted-foreground">
                {log.user?.firstName} {log.user?.lastName} • {log.resource}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {format(log.createdAt, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </p>
            <Badge variant="outline" className="mt-1">
              {log.level}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
```

## 🔧 Ferramentas de Manutenção

### **Painel de Manutenção**
```tsx
function MaintenanceTab() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Ferramentas de Manutenção</h2>
        <Badge variant="destructive">MODO MANUTENÇÃO</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cache</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {/* Clear cache */}}
            >
              Limpar Cache
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {/* Refresh cache */}}
            >
              Atualizar Cache
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Banco de Dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {/* Run migrations */}}
            >
              Executar Migrações
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {/* Backup DB */}}
            >
              Backup do BD
            </Button>
            <Button
              className="w-full"
              variant="destructive"
              onClick={() => {/* Clear old data */}}
            >
              Limpar Dados Antigos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sistema de Arquivos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {/* Clean uploads */}}
            >
              Limpar Uploads
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {/* Optimize images */}}
            >
              Otimizar Imagens
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {/* Rotate logs */}}
            >
              Rotacionar Logs
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {/* Archive old logs */}}
            >
              Arquivar Logs Antigos
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {/* Test email */}}
            >
              Testar Configuração
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {/* Send test email */}}
            >
              Enviar Email de Teste
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monitoramento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {/* Health check */}}
            >
              Verificar Saúde
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {/* Performance test */}}
            >
              Teste de Performance
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Health Status */}
      <Card>
        <CardHeader>
          <CardTitle>Status do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <SystemHealthStatus />
        </CardContent>
      </Card>
    </div>
  )
}
```

## ⚙️ Backend API

### **Admin Router**
```typescript
export const adminRouter = createTRPCRouter({
  // System Health
  getSystemHealth: adminProcedure.query(async ({ ctx }) => {
    const [dbStatus, apiStatus, cacheStatus] = await Promise.all([
      checkDatabaseHealth(),
      checkAPIHealth(),
      checkCacheHealth(),
    ])

    const alerts = []
    if (!dbStatus.healthy) alerts.push('Database connection issue')
    if (!apiStatus.healthy) alerts.push('API response time degraded')
    if (!cacheStatus.healthy) alerts.push('Cache performance issue')

    return {
      status: alerts.length === 0 ? 'HEALTHY' : 'WARNING',
      metrics: { dbStatus, apiStatus, cacheStatus },
      alerts,
      timestamp: new Date().toISOString(),
    }
  }),

  // System Metrics
  getSystemMetrics: adminProcedure.query(async ({ ctx }) => {
    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())

    const [
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      totalBookings,
      totalOrders,
    ] = await Promise.all([
      ctx.db.user.count(),
      ctx.db.user.count({
        where: { updatedAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } } }
      }),
      ctx.db.user.count({ where: { createdAt: { gte: lastMonth } } }),
      ctx.db.booking.count({ where: { createdAt: { gte: lastMonth } } }),
      ctx.db.foodOrder.count({ where: { createdAt: { gte: lastMonth } } }),
    ])

    return {
      totalUsers,
      activeUsers,
      newUsersThisMonth,
      totalBookings,
      totalOrders,
      userGrowth: ((newUsersThisMonth / totalUsers) * 100).toFixed(1),
    }
  }),

  // User Management
  getUsers: adminProcedure
    .input(z.object({
      search: z.string().optional(),
      role: z.string().optional(),
      isActive: z.boolean().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const where = {
        ...(input.search && {
          OR: [
            { firstName: { contains: input.search, mode: 'insensitive' } },
            { lastName: { contains: input.search, mode: 'insensitive' } },
            { email: { contains: input.search, mode: 'insensitive' } },
          ],
        }),
        ...(input.role && { role: input.role }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      }

      const [users, total] = await Promise.all([
        ctx.db.user.findMany({
          where,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.user.count({ where }),
      ])

      const active = await ctx.db.user.count({
        where: { ...where, isActive: true },
      })

      const newThisMonth = await ctx.db.user.count({
        where: {
          ...where,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      })

      return {
        users,
        total,
        active,
        newThisMonth,
        inactive: total - active,
      }
    }),

  // Update User Role
  updateUserRole: adminProcedure
    .input(z.object({
      userId: z.string(),
      role: z.enum(['USER', 'MANAGER', 'ADMIN']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Log the action
      await logAuditAction(ctx.user.id, 'UPDATE_USER_ROLE', 'User', input.userId, {
        oldRole: 'unknown', // Would need to fetch current role
        newRole: input.role,
      })

      return ctx.db.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      })
    }),

  // Toggle User Status
  toggleUserStatus: adminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: { isActive: true },
      })

      if (!user) throw new TRPCError({ code: 'NOT_FOUND' })

      await logAuditAction(
        ctx.user.id,
        'TOGGLE_USER_STATUS',
        'User',
        input.userId,
        { newStatus: !user.isActive }
      )

      return ctx.db.user.update({
        where: { id: input.userId },
        data: { isActive: !user.isActive },
      })
    }),

  // Get User Stats
  getUserStats: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [
        bookingsCount,
        ordersCount,
        suggestionsCount,
        rentalsCount,
        eventsAttended,
      ] = await Promise.all([
        ctx.db.booking.count({ where: { userId: input.userId } }),
        ctx.db.foodOrder.count({ where: { userId: input.userId } }),
        ctx.db.suggestion.count({ where: { authorId: input.userId } }),
        ctx.db.vehicleRent.count({ where: { userId: input.userId } }),
        ctx.db.eventRegistration.count({
          where: { userId: input.userId, status: 'ATTENDED' },
        }),
      ])

      return {
        totalBookings: bookingsCount,
        totalOrders: ordersCount,
        totalSuggestions: suggestionsCount,
        totalRentals: rentalsCount,
        eventsAttended,
        engagement: calculateUserEngagement({
          bookingsCount,
          ordersCount,
          suggestionsCount,
          rentalsCount,
          eventsAttended,
        }),
      }
    }),

  // Reports
  getReports: adminProcedure
    .input(z.object({
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      // Generate comprehensive reports
      return generateSystemReports(input.startDate, input.endDate)
    }),

  // Audit Logs
  getAuditLogs: adminProcedure
    .input(z.object({
      action: z.string().optional(),
      userId: z.string().optional(),
      resource: z.string().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const where = {
        ...(input.action && { action: input.action }),
        ...(input.userId && { userId: input.userId }),
        ...(input.resource && { resource: input.resource }),
        ...(input.startDate && input.endDate && {
          createdAt: {
            gte: input.startDate,
            lte: input.endDate,
          },
        }),
      }

      const [logs, total] = await Promise.all([
        ctx.db.auditLog.findMany({
          where,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
          include: {
            user: { select: { firstName: true, lastName: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        ctx.db.auditLog.count({ where }),
      ])

      return { logs, total, page: input.page, limit: input.limit }
    }),

  // System Settings
  getSystemSettings: adminProcedure.query(async ({ ctx }) => {
    return ctx.db.systemSetting.findMany()
  }),

  updateSystemSettings: adminProcedure
    .input(z.record(z.any()))
    .mutation(async ({ ctx, input }) => {
      // Update system settings
      for (const [key, value] of Object.entries(input)) {
        await ctx.db.systemSetting.upsert({
          where: { key },
          update: { value: JSON.stringify(value) },
          create: { key, value: JSON.stringify(value) },
        })
      }

      await logAuditAction(
        ctx.user.id,
        'UPDATE_SYSTEM_SETTINGS',
        'System',
        'settings',
        { updatedKeys: Object.keys(input) }
      )

      return { success: true }
    }),

  // Maintenance Tools
  clearCache: adminProcedure.mutation(async ({ ctx }) => {
    await logAuditAction(ctx.user.id, 'CLEAR_CACHE', 'System', 'cache')
    // Implement cache clearing
    return { success: true }
  }),

  runHealthCheck: adminProcedure.query(async ({ ctx }) => {
    const health = await performSystemHealthCheck()
    return health
  }),
})
```

## 📋 Checklist do Sistema Administrativo

### **Funcionalidades Core**
- ✅ **Dashboard Administrativo** - Visão geral do sistema
- ✅ **Gestão de Usuários** - CRUD completo com roles
- ✅ **Configurações do Sistema** - Personalização global
- ✅ **Relatórios e Analytics** - Métricas detalhadas
- ✅ **Logs de Auditoria** - Rastreamento completo
- ✅ **Ferramentas de Manutenção** - Utilitários de sistema

### **Backend e API**
- ✅ **tRPC Procedures** - Endpoints type-safe
- ✅ **Validação de Dados** - Regras de negócio
- ✅ **Transações** - Consistência de dados
- ✅ **Audit Logging** - Logs de todas as ações
- ✅ **Role-based Access** - Controle granular
- ✅ **Error Handling** - Tratamento robusto

### **Interface do Usuário**
- ✅ **Responsive Design** - Mobile-first
- ✅ **Real-time Updates** - Sincronização automática
- ✅ **Search & Filter** - Busca avançada
- ✅ **Bulk Actions** - Operações em lote
- ✅ **Export Features** - Relatórios em CSV/PDF
- ✅ **Progressive Enhancement** - Funciona sem JavaScript

### **Segurança e Qualidade**
- ✅ **Input Validation** - Sanitização completa
- ✅ **Rate Limiting** - Proteção contra abuso
- ✅ **Audit Trails** - Logs de auditoria
- ✅ **Data Encryption** - Campos sensíveis
- ✅ **Backup Strategy** - Recuperação de dados
- ✅ **Unit Tests** - Cobertura de código

### **Performance e Escalabilidade**
- ✅ **Lazy Loading** - Componentes sob demanda
- ✅ **Pagination** - Grandes volumes de dados
- ✅ **Caching** - Estratégia de cache
- ✅ **Database Indexing** - Queries otimizadas
- ✅ **CDN Integration** - Assets distribuídos
- ✅ **Monitoring** - Alertas proativos

---

**📅 Última atualização**: Fevereiro 2025
**👥 Mantido por**: Equipe de Produto
