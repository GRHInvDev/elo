import { api } from "@/trpc/server";
import { type Tool } from "ai";
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
  execute: async ({ roomId, title, start, end }: z.infer<typeof createBookingSchemaForAI>) => {
    try {
      // Transform string dates to Date objects
      const booking = await api.booking.create({
          roomId,
          title,
          start: new Date(start),
          end: new Date(end),
      });

      return ({
        message:"✅ Booking created successfully!",
        room: booking.roomId
      }
      );
    } catch (error) {
      return `error: ${JSON.stringify(error)}`;
    }
  },
}

export const listBookingByDate: Tool = {
  description: 'List the bookings by date',
  parameters: z.object({
    start: z.string().describe('The start date and time in ISO format (e.g., "2023-04-15T14:00:00Z")'),
    end: z.string().describe('The end date and time in ISO format (e.g., "2023-04-15T15:00:00Z")'),
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
  description: 'Delete the bookings by id',
  parameters: z.object({
    id: z.string().describe('The booking Id'),
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

export const listRooms: Tool = {
  description: 'List the rooms',
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
  description: 'List the available rooms at certain date',
  parameters: z.object({
    date: z.string().describe('The date in ISO format (e.g., "2023-04-15T14:00:00Z")')
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