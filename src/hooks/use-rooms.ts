"use client"

import { api } from "@/trpc/react"
import { useCallback } from "react"

export function useRooms() {
  const utils = api.useUtils();

  // Queries
  const roomsQuery = api.room.list.useQuery()

  const getRoomsByFloor = useCallback((floor: number) => {
    const roomsByFloorQuery = api.room.list.useQuery({ floor })
    return roomsByFloorQuery.data ?? []
  }, [])

  // Mutations
  const createRoom = api.room.create.useMutation({
    onSuccess: async () => {
      await utils.room.list.invalidate()
    },
  })

  const updateRoom = api.room.update.useMutation({
    onSuccess: async () => {
      await utils.room.list.invalidate()
    },
  })

  const deleteRoom = api.room.delete.useMutation({
    onSuccess: async () => {
      await utils.room.list.invalidate()
    },
  })

  const checkAvailability = useCallback(
    async (roomId: string, start: Date, end: Date) => {
      const result = await utils.client.room.checkAvailability.query({
        roomId,
        start,
        end,
      })
      return result
    },
    [utils.client.room.checkAvailability],
  )

  return {
    rooms: roomsQuery.data ?? [],
    isLoading: roomsQuery.isLoading,
    getRoomsByFloor,
    createRoom,
    updateRoom,
    deleteRoom,
    checkAvailability,
  }
}

