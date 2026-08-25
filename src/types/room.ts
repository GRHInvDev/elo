import type { IsometricRoomModel } from "./isometric-room"

export interface Coordinates {
  x: number
  y: number
  width: number
  height: number
}

export interface Room {
  id: string
  name: string
  description?: string | null
  capacity: number
  floor: number
  filial?: string
  photos?: string[]
  visualModel?: IsometricRoomModel
  coordinates: Coordinates
  bookings?: Booking[]
  createdAt?: Date
  updatedAt?: Date
}
  
  export interface Booking {
    id: string
    roomId: string
    userId: string
    title: string
    start: Date
    end: Date
    createdAt?: Date
    updatedAt?: Date
  }
  
  