import { api } from "@/trpc/server";
import { type Tool } from "ai";
import { z } from "zod"

const createBookingSchemaForAI = z.object({
  id: z.string().optional(),
  roomId: z.string().describe('ID da sala a ser reservada'),
  title: z.string().min(1, "Title is required").describe('Título da reunião ou evento (ex.: "Reunião de Alinhamento TI")'),
  start: z.string().describe('Data e hora de início em ISO UTC (ex.: "2025-04-15T14:00:00Z")'),
  end: z.string().describe('Data e hora de término em ISO UTC (ex.: "2025-04-15T15:00:00Z")'),
});

export const createBooking: Tool = {
  description: `
Cria uma nova reserva de sala de reunião para o usuário autenticado.

**Quando usar:** usuário quer reservar, agendar ou marcar uma sala.

**Fluxo obrigatório antes de chamar:**
1. Use listNowAvailableRooms para verificar se a sala está livre no horário desejado.
2. Colete: sala (roomId), título da reunião, data/hora de início (ISO UTC) e fim (ISO UTC).
3. Confirme o resumo com o usuário antes de executar.

**IDs das salas disponíveis:**
- Refeitório: cm7p9houy0000oygx8tt0kyl9
- Sala de feedback: cm7p9ijgx0001oygxjhhokllg
- Lounge: cm7p9jw3v0003oygxexri8alb
- Sala de treinamentos: cm7p9kqdt0004oygx5se6fmu2
- Sala de reunião 3° andar: cm7p9liib0005oygxov5kv4uy
- Aquário (sala de vidro): cm7p9m6490006oygxj84zmx05

**Problemas comuns:**
- Tentar reservar uma sala já ocupada no intervalo resulta em erro — verifique disponibilidade primeiro.
- Horários devem estar em UTC; se o usuário informar horário local (ex.: 14h Brasília = 17:00 UTC-3, ajuste conforme necessário).
- Não chame sem confirmar todos os parâmetros — reservas incorretas precisam de cancelamento manual.

**O que NÃO fazer:**
- Não assuma o roomId sem listar ou confirmar a sala.
- Não reserve sem checar disponibilidade com listNowAvailableRooms.
- Não use o mesmo horário de início e fim.
`,
  parameters: createBookingSchemaForAI,
  execute: async ({ roomId, title, start, end }: z.infer<typeof createBookingSchemaForAI>) => {
    try {
      const booking = await api.booking.create({
          roomId,
          title,
          start: new Date(start),
          end: new Date(end),
      });
      return ({
        message:"✅ Reserva criada com sucesso!",
        room: booking.roomId
      });
    } catch (error) {
      return `error: ${JSON.stringify(error)}`;
    }
  },
}

export const listBookingByDate: Tool = {
  description: `
Lista todas as reservas de salas (de qualquer usuário) dentro de um intervalo de datas/horários.

**Quando usar:**
- Verificar quais salas estão ocupadas em um período específico.
- Ajudar o usuário a encontrar horários livres comparando com os ocupados.
- Consultar a agenda geral de reuniões de um dia.

**Como usar:**
- Informe start (início) e end (fim) em ISO UTC.
- Para ver o dia todo: start = "2025-04-15T00:00:00Z" e end = "2025-04-15T23:59:59Z".

**O que NÃO fazer:**
- Não use para listar reservas do próprio usuário — use listUserBooking ou getMySchedule.
- Não substitui listNowAvailableRooms para checar disponibilidade em tempo real.

**Problemas comuns:**
- Intervalo muito amplo pode retornar muitos registros; prefira intervalos de até 1 semana.
`,
  parameters: z.object({
    start: z.string().describe('Data e hora de início em ISO UTC (ex.: "2025-04-15T00:00:00Z")'),
    end: z.string().describe('Data e hora de fim em ISO UTC (ex.: "2025-04-15T23:59:59Z")'),
  }),
  execute: async ({start, end}:{start:string, end:string}) => {
    try {
      const bookings = await api.booking.list({
        startDate: new Date(start),
        endDate:  new Date(end)
      })
      return bookings;
    } catch (error) {
      return `error: ${JSON.stringify(error)}`
    }
  }
}

export const deleteBooking: Tool = {
  description: `
Cancela/exclui uma reserva de sala pelo seu ID. A operação é irreversível.

**Quando usar:**
- Usuário quer cancelar, remover ou desmarcar uma reserva de sala.

**Fluxo obrigatório antes de chamar:**
1. Use listUserBooking ou getMySchedule para obter o ID correto da reserva.
2. Mostre ao usuário: sala, título, data/hora de início e fim.
3. Aguarde confirmação explícita antes de executar.

**O que NÃO fazer:**
- Nunca delete sem confirmar os dados com o usuário — a ação não pode ser desfeita.
- Não tente adivinhar o bookingId; sempre obtenha via listagem.

**Problemas comuns:**
- Tentar deletar uma reserva de outro usuário (sem permissão admin) retorna erro.
- Confirmar apenas o título pode não ser suficiente se o usuário tiver múltiplas reservas com o mesmo nome.
`,
  parameters: z.object({
    id: z.string().describe('ID único da reserva (obtido via listUserBooking ou getMySchedule)'),
  }),
  execute: async ({ id }:{ id:string }) => {
    try {
      const bookings = await api.booking.delete({id})
      return bookings;
    } catch (error) {
      return `error: ${JSON.stringify(error)}`
    }
  }
}

export const listUserBooking: Tool = {
  description: `
Retorna todas as reservas de sala do usuário autenticado (todas as datas futuras e passadas).

**Quando usar:**
- Usuário pergunta "quais são minhas reservas?", "tenho alguma sala reservada?", "me mostra minhas reservas".
- Quando precisar do ID de uma reserva para cancelá-la via deleteBooking.

**Diferença de getMySchedule:**
- listUserBooking retorna TODAS as reservas sem filtro de data.
- getMySchedule filtra por um dia específico (preferível quando a pergunta é sobre "hoje" ou uma data concreta).

**Como interpretar o retorno:**
- Cada item traz: id, title, room (sala), start, end.
- Use o campo id para deleteBooking se o usuário quiser cancelar.

**Problemas comuns:**
- Retorna reservas passadas também; filtre visualmente por data ao apresentar ao usuário.
- Retorna 'No bookings found!' quando não há nenhuma reserva.
`,
  parameters: z.object({}),
  execute: async () => {
    try {
      const bookings = await api.booking.listMine()
      if (bookings.length>0){
        return bookings
      } else {
        return 'No bookings found!'
      }
    } catch (error) {
      return `error listing bookings ${JSON.stringify(error)}`
    }
  }
}

export const listRooms: Tool = {
  description: `
Lista todas as salas de reunião cadastradas no sistema (nome, ID e metadados).

**Quando usar:**
- Usuário pergunta "quais salas existem?", "me mostra as salas disponíveis" (no sentido de quais existem, não disponibilidade real).
- Para descobrir o ID de uma sala específica antes de criar uma reserva.
- Quando precisar apresentar as opções de sala ao usuário.

**O que NÃO fazer:**
- Não use para verificar disponibilidade — esta ferramenta mostra TODAS as salas, ocupadas ou não.
- Para checar se uma sala está livre agora, use listNowAvailableRooms.

**Problemas comuns:**
- Pode confundir o usuário se ele quiser saber quais estão "disponíveis agora" — redirecione para listNowAvailableRooms nesses casos.
`,
  parameters: z.object({}),
  execute: async () => {
    try {
      const bookings = await api.room.list()
      if (bookings.length>0){
        return bookings
      } else {
        return 'No rooms found!'
      }
    } catch (error) {
      return `error listing rooms ${JSON.stringify(error)}`
    }
  }
}

export const listNowAvailableRooms: Tool = {
  description: `
Retorna as salas que NÃO possuem reserva no horário exato informado — ou seja, que estão livres e disponíveis para uso.

**Quando usar:**
- Usuário pergunta "quais salas estão livres agora?", "tem sala disponível às 15h?", "preciso de uma sala para agora".
- Como verificação obrigatória ANTES de criar uma reserva com createBooking.

**Como usar:**
- Informe a data/hora desejada em ISO UTC.
- Se o usuário disser "agora", use o timestamp atual em UTC.
- Atenção ao fuso: o servidor pode operar em UTC; se necessário, some 3 horas ao horário de Brasília para converter (Brasília = UTC-3).

**O que NÃO fazer:**
- Não use listRooms para verificar disponibilidade — ela lista todas as salas sem filtro de reservas.
- Não apresente ao usuário IDs internos; mostre apenas os nomes das salas.

**Problemas comuns:**
- Se o horário informado for inválido, a ferramenta retornará erro.
- Resultado vazio ("No rooms found!") significa todas as salas estão ocupadas naquele momento; sugira outro horário.
- Não indica por quanto tempo a sala ficará livre — se necessário, combine com listBookingByDate para saber quando a próxima reserva começa.

**Uso combinado ideal:**
1. listNowAvailableRooms → usuário escolhe a sala
2. createBooking → efetiva a reserva
`,
  parameters: z.object({
    date: z.string().describe('Data e hora em ISO UTC para checar disponibilidade (ex.: "2025-04-15T14:00:00Z")')
  }),
  execute: async ({date}:{date:string}) => {
    try {
      const bookings = await api.room.listAvailable({
        date: new Date(date)
      })
      if (bookings.length>0){
        return bookings
      } else {
        return 'No rooms found!'
      }
    } catch (error) {
      return `error listing rooms ${JSON.stringify(error)}`
    }
  }
}
