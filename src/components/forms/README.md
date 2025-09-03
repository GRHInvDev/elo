# Componentes de Formulários

## UserSearch

Componente de busca de usuários com autocomplete para seleção múltipla.

### Funcionalidades

- **Busca em Tempo Real**: Filtra usuários por nome, email ou setor
- **Seleção Múltipla**: Permite selecionar vários usuários
- **Interface Intuitiva**: Popover com lista de resultados
- **Seleção em Lote**: Opção para selecionar/deselecionar todos os resultados
- **Visualização de Selecionados**: Badges com opção de remoção individual
- **Responsivo**: Funciona bem em mobile e desktop

### Uso

```tsx
import { UserSearch } from "@/components/forms/user-search"

function MyComponent() {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  
  const users = [
    {
      id: "1",
      name: "João Silva",
      email: "joao@empresa.com",
      setor: "TI"
    },
    // ... mais usuários
  ]

  return (
    <UserSearch
      users={users}
      selectedUsers={selectedUsers}
      onSelectionChange={setSelectedUsers}
      placeholder="Buscar colaboradores..."
      maxHeight="300px"
    />
  )
}
```

### Props

| Prop | Tipo | Descrição |
|------|------|-----------|
| `users` | `User[]` | Lista de usuários disponíveis |
| `selectedUsers` | `string[]` | IDs dos usuários selecionados |
| `onSelectionChange` | `(userIds: string[]) => void` | Callback quando a seleção muda |
| `placeholder` | `string` | Texto do placeholder (opcional) |
| `maxHeight` | `string` | Altura máxima da lista (opcional) |

### Interface User

```typescript
interface User {
  id: string
  name: string
  email: string
  setor: string | null
}
```

### Exemplo de Integração

O componente é usado no `FormBuilderWithSave` para permitir que administradores selecionem usuários específicos que podem acessar formulários privados.

### Melhorias Futuras

- [ ] Busca por inicial do nome
- [ ] Ordenação por relevância
- [ ] Histórico de seleções
- [ ] Importação em lote via CSV
- [ ] Filtros avançados (por setor, cargo, etc.)
