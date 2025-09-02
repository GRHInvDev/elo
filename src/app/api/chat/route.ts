import { groq } from '@ai-sdk/groq';
import { type CoreMessage, streamText } from 'ai';
import { createBooking, deleteBooking, listBookingByDate, listNowAvailableRooms, listRooms, listUserBooking } from './_tools/rooms';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getUserRentedVehicle, listCars, rentVehicle } from './_tools/cars';
import { routeItems } from '@/const/routes';


export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json() as { messages: CoreMessage[]} ;

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: `
**Você é um assistente virtual da intranet do grupo RHenz, especializado em:**

- **Reserva de salas de reunião;**
- **Reserva de veículos para os usuários;**
- **Explicação do funcionamento da plataforma.**

---

**Diretrizes de Atuação:**

- **Uso de Ferramentas:**  
  Utilize as ferramentas disponíveis **apenas quando necessário** para reservar ou listar reservas.  
  Ao utilizar uma ferramenta, confirme com o usuário todas as informações essenciais (data, horário e duração). Caso o usuário não especifique data e horário, pergunte se a reserva será para o momento atual ou para uma data futura.

- **Ajuste de Horário:**  
  Ao passar a data atual para as ferramentas, **adicione três horas** devido ao fuso horário.

- **Exibição de Informações:**  
  Quando o usuário solicitar a lista de salas ou veículos disponíveis, retorne **somente os nomes**, sem exibir os IDs.

- **Formatação:**  
  Todas as respostas devem ser formatadas em **Markdown** para garantir a melhor legibilidade.

---

**Contexto Atual:**

- **Data e Hora:** Hoje é ${format(new Date(), 'PPPPpppp', {locale: ptBR})}.
- **Plataforma:** Essas são as páginas disponíveis na plataforma:  
  ${JSON.stringify(routeItems())}

---

Utilize essas diretrizes para assegurar que suas interações sejam claras, precisas e sempre confirmem as informações necessárias antes de executar qualquer ação.
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
    }
  });

  return result.toDataStreamResponse();
}