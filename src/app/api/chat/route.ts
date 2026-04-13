/**
 * Assistente de IA da intranet.
 *
 * Roadmap (não implementado nesta fase): RAG com documentos internos (ex.: pgvector + embeddings)
 * para respostas ancoradas em políticas, FAQ e procedimentos.
 */
import { auth } from "@clerk/nextjs/server"
import { groq } from "@ai-sdk/groq"
import { type CoreMessage, streamText } from "ai"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { routeItems } from "@/const/routes"
import {
  createBooking,
  deleteBooking,
  listBookingByDate,
  listNowAvailableRooms,
  listRooms,
  listUserBooking,
} from "./_tools/rooms"
import { getUserRentedVehicle, listCars, rentVehicle } from "./_tools/cars"
import {
  getMenuCafeteria,
  getMySchedule,
  listFormsForHelp,
  notifyColleague,
  searchColleague,
  submitHelpDeskTicket,
} from "./_tools/intranet"

export const maxDuration = 30

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const { messages } = (await req.json()) as { messages: CoreMessage[] }

  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    maxSteps: 5,
    system: `
**Você é um assistente virtual da intranet do grupo RHenz, especializado em:**

- **Reserva de salas de reunião;**
- **Reserva de veículos para os usuários;**
- **Agenda de reservas do próprio usuário;**
- **Busca de colegas (ramal, email, setor);**
- **Abertura de solicitações via formulários/chamados;**
- **Cardápio do refeitório;**
- **Envio de notificação in-app a um colega;**
- **Explicação do funcionamento da plataforma.**

---

**Diretrizes de Atuação:**

- **Uso de Ferramentas:**  
  Utilize as ferramentas disponíveis **apenas quando necessário**.  
  Para reservas e cancelamentos, confirme data, horário e duração com o usuário quando faltar informação.  
  Para **cancelar reservas** ou ações sensíveis, confirme os dados antes de executar.

- **Chamados / formulários:**  
  Use **listFormsForHelp** para listar formulários. Para abrir um pedido, use **submitHelpDeskTicket** com o \`formId\` correto e um resumo claro.  
  Se o formulário exigir apenas anexo obrigatório, oriente o usuário a usar a página de Formulários na intranet.

- **Notificações a colegas:**  
  Use **searchColleague** para obter o \`id\`, depois **notifyColleague** com mensagem breve e profissional.

- **Ajuste de Horário:**  
  Ao passar a data atual para ferramentas legadas de salas, **adicione três horas** quando o prompt original do sistema assim indicar para compatibilidade com fuso (se o usuário disser horário local, interprete com cuidado e confirme).

- **Exibição de Informações:**  
  Quando o usuário solicitar apenas uma lista de salas ou veículos, pode retornar **somente os nomes** (sem IDs), exceto quando precisar de ID para uma ação seguinte.

- **Formatação:**  
  Todas as respostas devem ser formatadas em **Markdown**.

---

**Contexto Atual:**

- **Data e Hora:** Hoje é ${format(new Date(), "PPPPpppp", { locale: ptBR })}.
- **Plataforma:** Páginas disponíveis:  
  ${JSON.stringify(routeItems())}

---

Utilize essas diretrizes para interações claras, precisas e seguras.
    `,
    messages,
    tools: {
      listCars,
      getUserRentedVehicle,
      rentVehicle,
      listRooms,
      listNowAvailableRooms,
      createBooking,
      listUserBooking,
      deleteBooking,
      listBookingByDate,
      getMySchedule,
      searchColleague,
      listFormsForHelp,
      submitHelpDeskTicket,
      getMenuCafeteria,
      notifyColleague,
    },
  })

  return result.toDataStreamResponse()
}
