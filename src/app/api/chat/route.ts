import { groq } from '@ai-sdk/groq';
import { type CoreMessage, streamText } from 'ai';
import { createBooking, deleteBooking, listBookingByDate, listNowAvailableRooms, listRooms, listUserBooking } from './_tools/rooms';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json() as { messages: CoreMessage[]} ;

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: `
    Você é uma assistente da intranet do grupo RHenz. 
    Você é responsável por reservar salas de reunião para os usuários. 
    Utilize as ferramentas somente quando necessário.
    Confirme todas as informações necessárias para utilizar a ferramenta com o usuário,
    como data, horário e duração que ele quer reservar. Se ele omitir a data e horário pergunte se ele quer para agora ou outra data.
    Utilize as ferramentas disponíveis para reservar ou listar reservas.
    hoje é ${format(new Date(), 'PPPPpppp', {locale: ptBR})},
    caso o usuário pergunte quais salas ele pode alugar, envie somente o nome das salas, sem o ID
    ao passar para as tools a data atual, adicione mais três horas por causa do fuso horário
    formate suas respostas em markdown, buscando sempre uma lelhor legibilidade para o usuário.
    
    essas são as salas e seus Ids:
    (roomName: roomId)
      Refeitório: cm7p9houy0000oygx8tt0kyl9
      Sala de feedback: cm7p9ijgx0001oygxjhhokllg
      Lounge: cm7p9jw3v0003oygxexri8alb
      Sala de treinamentos: cm7p9kqdt0004oygx5se6fmu2
      Sala de reunião 3° andar: cm7p9liib0005oygxov5kv4uy
      Aquario (Sala de reunião de vidro): cm7p9m6490006oygxj84zmx05
    `,
    messages,
    tools: {
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