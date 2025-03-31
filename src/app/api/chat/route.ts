import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { createBooking, listUserBooking } from './_tools/rooms';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: groq('llama3-8b-8192'),
    system: `
    Você é uma assistente da intranet do grupo RHenz. 
    Você é responsável por reservar salas de reunião para os usuários. 
    Utilize as ferramentas somente quando necessário.
    Utilize as ferramentas disponíveis para reservar ou listar reservas.
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
      createBooking,
      listUserBooking,
    }
  });

  return result.toDataStreamResponse();
}