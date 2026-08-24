"use client"

import React from "react"
import { Loader2, Trash2 } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import type { Room } from "@/types/room"

interface RoomDeleteDialogProps {
  room: Room | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (roomId: string) => Promise<void> | void
  isPending?: boolean
}

export function RoomDeleteDialog({
  room,
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: RoomDeleteDialogProps) {
  if (!room) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Excluir Sala de Reunião
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Tem certeza que deseja excluir permanentemente a sala{" "}
              <strong className="text-foreground">{room.name}</strong> (Filial{" "}
              {room.filial ?? "SCS"}, {room.floor}º Andar)?
            </p>
            <p className="text-xs text-red-500 bg-red-100 p-2.5 rounded border border-red-200">
              <strong>Atenção:</strong> Todas as reservas agendadas nesta sala também serão
              canceladas automaticamente.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={isPending}
            onClick={() => onConfirm(room.id)}
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Sim, Excluir Sala"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
