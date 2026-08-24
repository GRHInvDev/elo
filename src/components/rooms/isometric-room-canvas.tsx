"use client"

import React, { useState } from "react"
import Image from "next/image"
import { Maximize2, Box } from "lucide-react"
import {
  type IsometricRoomModel,
} from "@/types/isometric-room"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

interface IsometricRoomCanvasProps {
  model?: IsometricRoomModel | null
  className?: string
  viewMode?: "compact" | "standard" | "large"
  showLabels?: boolean
  interactive?: boolean
  highlightStatus?: "available" | "occupied" | "idle"
}

export function IsometricRoomCanvas({
  model,
  className = "",
  interactive = true,
  highlightStatus = "idle",
}: IsometricRoomCanvasProps) {
  const [isZoomOpen, setIsZoomOpen] = useState(false)

  // Imagem real da maquete 3D gerada para esta sala específica
  const dioramaImageUrl = model?.imageUrl

  if (!dioramaImageUrl) {
    return (
      <div
        className={`relative w-full h-full flex flex-col items-center justify-center bg-[#000000] rounded-2xl overflow-hidden p-6 text-center select-none border border-white/10 ${className}`}
      >
        <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-2">
          <Box className="size-6 text-primary/70" />
        </div>
        <p className="text-sm font-medium text-white">Maquete 3D Isométrica</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
          {model?.detectedAtmosphere ??
            "Envie as fotos no cadastro para a IA gerar a maquete 3D desta sala."}
        </p>
      </div>
    )
  }

  return (
    <>
      <div
        className={`relative w-full h-full flex items-center justify-center bg-[#000000] rounded-2xl overflow-hidden group select-none border border-white/10 shadow-2xl ${className}`}
      >
        {/* Glow de estúdio no fundo */}
        <div className="absolute inset-0 bg-radial from-slate-900/40 via-transparent to-black pointer-events-none" />

        {/* Imagem Real da Maquete Isométrica 3D da Sala */}
        <Image
          src={dioramaImageUrl}
          alt={model?.detectedAtmosphere ?? "Maquete Isométrica 3D da Sala"}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-contain scale-[1.25] sm:scale-[1.25] transition-transform duration-500 ease-out group-hover:scale-[1.45]"
          unoptimized={dioramaImageUrl.startsWith("data:")}
        />

        {/* HUD Flutuante com Status de Disponibilidade */}
        {highlightStatus !== "idle" && (
          <div className="absolute top-3 left-3 z-10">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md border shadow-lg ${highlightStatus === "available"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : "bg-rose-500/20 text-rose-400 border-rose-500/40"
                }`}
            >
              <span
                className={`size-2 rounded-full ${highlightStatus === "available" ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                  }`}
              />
              {highlightStatus === "available" ? "Disponível Agora" : "Ocupada"}
            </div>
          </div>
        )}

        {/* Botão de Zoom / Expandir Maquete */}
        {interactive && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setIsZoomOpen(true)
            }}
            className="absolute top-3 right-3 z-10 size-7 rounded-lg bg-black/60 hover:bg-black/90 border border-white/10 text-white/80 hover:text-white flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            title="Expandir Maquete 3D"
          >
            <Maximize2 className="size-3.5" />
          </button>
        )}
      </div>

      {/* Modal de Zoom em Alta Resolução */}
      <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
        <DialogContent className="max-w-4xl p-2 bg-black border-white/10 rounded-2xl overflow-hidden">
          <DialogTitle className="sr-only">Visualização Ampliada da Maquete 3D</DialogTitle>
          <div className="relative w-full aspect-square max-h-[80vh] flex items-center justify-center bg-black">
            <Image
              src={dioramaImageUrl}
              alt="Maquete 3D Ampliada"
              fill
              sizes="(max-width: 1200px) 100vw, 896px"
              className="object-contain rounded-xl"
              unoptimized={dioramaImageUrl.startsWith("data:")}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
