import { api } from "@/trpc/server";
import { type Tool } from "ai";
import { z } from "zod"


export const listCars: Tool = {
  description: `
Lista todos os veículos cadastrados na frota da empresa, independentemente de estarem disponíveis ou alugados.

**Quando usar:**
- Usuário pergunta "quais carros existem?", "me mostra a frota", "quais veículos têm disponíveis" (quando quer ver tudo).
- Para encontrar o modelo, placa ou ID de um veículo específico antes de alugar.
- Quando o usuário menciona um veículo pelo modelo ou placa e você precisa confirmar o vehicleId.

**O que NÃO fazer:**
- Não use para verificar disponibilidade real — esta ferramenta lista TODOS os veículos, inclusive os que já estão alugados.
- Para saber quais carros estão livres agora, use listAvailableVehiclesNow.

**O que retorna:**
- id, modelo, placa, empresa (enterprise) de cada veículo.

**Problemas comuns:**
- Usuário pede "carro disponível" mas espera uma lista filtrada; nesse caso prefira listAvailableVehiclesNow.
`,
  parameters: z.object({}),
  execute: async () => {
    return await api.vehicle.getAll();
  }
}

export const listAvailableVehiclesNow: Tool = {
  description: `
Lista os veículos da frota que estão LIVRES (sem aluguel ativo sobreposto) para um intervalo de tempo.

**Quando usar:**
- Usuário pergunta "qual carro está disponível agora?", "tem algum carro livre?", "preciso de um carro para hoje".
- Como verificação obrigatória ANTES de chamar rentVehicle — sempre confirme disponibilidade primeiro.

**Parâmetros:**
- startIso (opcional): início do período em ISO UTC. Se omitido, usa o momento atual.
- endIso (opcional): fim do período em ISO UTC. Se omitido, usa início + 4 horas.

**Como interpretar o retorno:**
- Retorna id, modelo, placa e empresa de cada veículo disponível.
- Use o id retornado para rentVehicle.
- Se retornar mensagem vazia ("Nenhum veículo disponível neste intervalo"), informe o usuário e sugira verificar outro horário.

**O que NÃO fazer:**
- Não use listCars para checar disponibilidade — ela lista todos os veículos sem filtro de aluguéis.
- Não passe um startIso >= endIso; isso retorna "Intervalo inválido".
- Não assuma que o carro está disponível sem chamar esta ferramenta antes.

**Problemas comuns:**
- Se o usuário não souber o horário de retorno, use o padrão (+4h) e depois ajuste com rentVehicle.possibleEnd.
- Veículos de outras empresas (enterprise) podem aparecer mas não ser alugáveis pelo usuário.
`,
  parameters: z.object({
    startIso: z.string().optional().describe("Início do período em ISO UTC; padrão: agora"),
    endIso: z.string().optional().describe("Fim do período em ISO UTC; padrão: início + 4 horas"),
  }),
  execute: async ({ startIso, endIso }: { startIso?: string; endIso?: string }) => {
    try {
      const startDate = startIso ? new Date(startIso) : new Date()
      const endDate = endIso
        ? new Date(endIso)
        : new Date(startDate.getTime() + 4 * 60 * 60 * 1000)
      if (startDate >= endDate) {
        return "Intervalo inválido: a data/hora de início deve ser anterior ao fim."
      }
      const cars = await api.vehicle.getAvailable({ startDate, endDate })
      if (cars.length === 0) {
        return "Nenhum veículo disponível neste intervalo."
      }
      return cars.map((v) => ({
        id: v.id,
        model: v.model,
        plate: v.plate,
        enterprise: v.enterprise,
      }))
    } catch (e) {
      return `Erro ao listar veículos disponíveis: ${e instanceof Error ? e.message : String(e)}`
    }
  },
}

export const getUserRentedVehicle: Tool = {
  description: `
Retorna o aluguel de veículo ativo do usuário autenticado no momento.

**Quando usar:**
- Usuário pergunta "qual carro eu peguei?", "qual é meu carro hoje?", "tenho algum carro reservado?", "quando devo devolver o carro?".
- Antes de tentar criar um novo aluguel — para verificar se o usuário já possui um ativo.

**O que retorna (quando há aluguel ativo):**
- Modelo e placa do veículo.
- Destino (destiny) e motorista (driver).
- Passageiros (passengers), se informados.
- Data de início (startDate) e data prevista de devolução (possibleEnd).

**O que retorna (sem aluguel ativo):**
- null ou objeto vazio — informe o usuário que não há aluguel ativo no momento.

**O que NÃO fazer:**
- Não confunda com listCars (lista toda a frota) ou listAvailableVehiclesNow (veículos livres).
- Não use para verificar aluguéis de outros usuários.
`,
  parameters: z.object({}),
  execute: async () => {
    return await api.vehicleRent.getMyActiveRent()
  }
}

export const rentVehicle: Tool = {
  description: `
Cria um registro de aluguel de veículo para o usuário autenticado.

**Quando usar:**
- Usuário quer reservar, pegar ou alugar um carro da frota.

**Fluxo obrigatório antes de chamar:**
1. Use listAvailableVehiclesNow para verificar quais veículos estão livres no período desejado.
2. Colete e confirme com o usuário:
   - destiny: descrição do destino/finalidade da viagem (obrigatório).
   - driver: nome do motorista — pode ser o próprio usuário (obrigatório).
   - possibleEnd: data/hora prevista de devolução em ISO UTC (obrigatório).
   - vehicleId: ID do veículo escolhido, obtido de listAvailableVehiclesNow (obrigatório).
   - passangers: lista de passageiros (opcional, texto livre).
   - startDate: data/hora de saída em ISO UTC (opcional, padrão: agora).
3. Apresente um resumo completo e aguarde confirmação do usuário antes de executar.

**O que NÃO fazer:**
- Não chame sem confirmar o vehicleId — passe sempre um id válido de listAvailableVehiclesNow.
- Não crie aluguel sem saber o destino e o motorista.
- Não tente alugar um veículo de outra empresa sem verificar permissões.

**Problemas comuns:**
- Tentar alugar um carro já ocupado retorna erro de sobreposição — sempre verifique disponibilidade primeiro.
- possibleEnd deve ser posterior a startDate; verifique lógica temporal antes de chamar.
- O campo passangers é um texto livre (ex.: "João, Maria, Pedro") e não valida nomes individualmente.

**O que retorna:**
- Confirmação do aluguel criado com ID, veículo, destino, driver e datas.
`,
  parameters: z.object({
    destiny: z.string().describe("Descrição do destino ou finalidade da viagem (ex.: 'Reunião em São Paulo')"),
    driver: z.string().describe("Nome completo do motorista responsável pelo veículo"),
    possibleEnd: z.string().describe('Data e hora prevista de devolução em ISO UTC (ex.: "2025-04-15T18:00:00Z")'),
    vehicleId: z.string().describe('ID do veículo a ser alugado — obtenha via listAvailableVehiclesNow'),
    passangers: z.string().optional().describe('Lista de passageiros em texto livre (ex.: "Ana Silva, Carlos Souza")'),
    startDate: z.string().optional().describe('Data e hora de saída em ISO UTC; padrão: agora')
  }),
  execute: async ({destiny, driver, possibleEnd, vehicleId, passangers, startDate}: {
    destiny: string,
    driver: string,
    possibleEnd: string,
    vehicleId: string,
    passangers?: string,
    startDate?: string
  }) => {
    return await api.vehicleRent.create({
      destiny,
      driver,
      possibleEnd: new Date(possibleEnd),
      vehicleId,
      passangers,
      startDate: startDate ? new Date(startDate) : new Date()
    })
  }
}
