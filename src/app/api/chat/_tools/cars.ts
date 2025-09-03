import { api } from "@/trpc/server";
import { type Tool } from "ai";
import { z } from "zod"


export const listCars: Tool = {
  description: `
    List all existing cars
    `,
  parameters: z.object({}),
  execute: async () => {
    return await api.vehicle.getAll();
  }
}

export const getUserRentedVehicle: Tool = {
  description: "get the user current vehicle rent.",
  parameters: z.object({}),
  execute: async () => {
    return await api.vehicleRent.getMyActiveRent()
  }
}

export const rentVehicle: Tool = {
  description: "rent a vehicle for the user.",
  parameters: z.object({
    destiny: z.string().describe("The rent trip destiny"),
    driver: z.string().describe("The driver for the car"),
    possibleEnd: z.string().describe('The possible end date and time in ISO format (e.g., "2023-04-15T14:00:00Z")'),
    vehicleId: z.string().describe('the vehicle ID. Use the tool listCars to get the Id by car'),
    passangers: z.string().optional().describe('The passengers for the trip'),
    startDate: z.string().optional().describe('The start date and time in ISO format (e.g., "2023-04-15T14:00:00Z")')
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