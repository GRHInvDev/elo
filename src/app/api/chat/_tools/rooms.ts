import { bookingRouter } from "@/server/api/routers/booking";
import { api } from "@/trpc/server";
import { Tool } from "ai";
import { z } from "zod"

const createBookingSchemaForAI = z.object({
  id: z.string().optional(),
  roomId: z.string().describe('The ID of the room to book'),
  title: z.string().min(1, "Title is required").describe('The title of the booking'),
  start: z.string().describe('The start date and time in ISO format (e.g., "2023-04-15T14:00:00Z")'),
  end: z.string().describe('The end date and time in ISO format (e.g., "2023-04-15T15:00:00Z")'),
});

export const createBooking: Tool = {
  description: `Create a new room booking.
    the availble rooms ids are:
    (roomName: roomId)
    Refeitório: cm7p9houy0000oygx8tt0kyl9
    Sala de feedback: cm7p9ijgx0001oygxjhhokllg
    Lounge: cm7p9jw3v0003oygxexri8alb
    Sala de treinamentos: cm7p9kqdt0004oygx5se6fmu2
    Sala de reunião 3° andar: cm7p9liib0005oygxov5kv4uy
    Aquario (Sala de reunião de vidro): cm7p9m6490006oygxj84zmx05
    `, 
  parameters: createBookingSchemaForAI,
  execute: async ({ roomId, title, start, end, id }) => {
    try {
      // Transform string dates to Date objects
      const booking = await bookingRouter.create({
        roomId,
        title,
        start: new Date(start),
        end: new Date(end),
        ...(id && { id }),
      });
      
      return ({
        message:"✅ Booking created successfully!",
        room: booking.roomId
      }
      );
    } catch (error) {
      return 'error';
    }
  },
}

export const listUserBooking: Tool = {
  description: 'The user bookings',
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