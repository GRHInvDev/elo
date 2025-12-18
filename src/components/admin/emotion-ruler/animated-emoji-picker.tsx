"use client"

import { useState } from "react"
import { availableEmojis, emojiToId } from "@/lib/emoji-utils"
import { getEmojiImageUrl } from "@/lib/emoji-image-map"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Smile } from "lucide-react"
import { cn } from "@/lib/utils"

interface AnimatedEmojiPickerProps {
  value: string | null
  onEmojiSelect: (emoji: string) => void
  className?: string
}

const categoryLabels: Record<keyof typeof availableEmojis, string> = {
  happy: "Felizes",
  neutral: "Neutras",
  sad: "Tristes",
  angry: "Zangadas",
}

export function AnimatedEmojiPicker({
  value,
  onEmojiSelect,
  className,
}: AnimatedEmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji)
    setIsOpen(false)
  }

  // Obter URL da imagem se o emoji tiver suporte
  const emojiId = value ? emojiToId(value) : null
  const imageUrl = emojiId ? getEmojiImageUrl(emojiId) : null

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("w-16 h-12 p-0 overflow-hidden relative", className)}
        >
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={value ?? "Emoji"}
                width={48}
                height={48}
                className="object-contain w-full h-full"
                onError={(e) => {
                  // Fallback para emoji Unicode se a imagem falhar
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent && value) {
                    const existingFallback = parent.querySelector('.emoji-fallback-preview')
                    if (!existingFallback) {
                      const fallback = document.createElement('span')
                      fallback.className = 'emoji-fallback-preview text-2xl'
                      fallback.textContent = value
                      parent.appendChild(fallback)
                    } else if (existingFallback instanceof HTMLElement) {
                      existingFallback.style.display = 'block'
                    }
                  }
                }}
              />
              {value && (
                <span 
                  className="emoji-fallback-preview text-2xl hidden absolute inset-0 flex items-center justify-center"
                >
                  {value}
                </span>
              )}
            </>
          ) : value ? (
            <span className="text-2xl">{value}</span>
          ) : (
            <Smile className="h-5 w-5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[95vw] sm:w-[700px] md:w-[800px] lg:w-[900px] p-0" align="start">
        <Tabs defaultValue="happy" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            {Object.keys(availableEmojis).map((category) => (
              <TabsTrigger key={category} value={category} className="text-sm">
                {categoryLabels[category as keyof typeof categoryLabels]}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(availableEmojis).map(([category, emojis]) => (
            <TabsContent
              key={category}
              value={category}
              className="max-h-[70vh] sm:max-h-[75vh] md:max-h-[80vh] overflow-y-auto p-4"
            >
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-4">
                {emojis.map((emojiItem, index) => (
                  <button
                    key={`${emojiItem.id}-${index}`}
                    type="button"
                    onClick={() => handleEmojiClick(emojiItem.emoji)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-lg",
                      "hover:bg-muted transition-all duration-200",
                      "border-2 border-transparent",
                      "hover:scale-105 hover:shadow-md",
                      value === emojiItem.emoji && "border-primary bg-primary/10 ring-2 ring-primary/20"
                    )}
                    title={emojiItem.label}
                  >
                    <div className="mb-2 flex items-center justify-center min-h-[64px] relative">
                      {(() => {
                        const imageUrl = getEmojiImageUrl(emojiItem.id)
                        if (imageUrl) {
                          return (
                            <>
                              <img
                                src={imageUrl}
                                alt={emojiItem.label}
                                width={56}
                                height={56}
                                className="object-contain"
                                onError={(e) => {
                                  // Fallback para emoji Unicode se a imagem falhar
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  const parent = target.parentElement
                                  if (parent) {
                                    let fallback = parent.querySelector('.emoji-fallback')
                                    if (!fallback) {
                                      fallback = document.createElement('span')
                                      fallback.className = 'emoji-fallback text-4xl absolute inset-0 flex items-center justify-center'
                                      if (fallback instanceof HTMLElement) {
                                        fallback.style.fontSize = '56px'
                                      }
                                      fallback.textContent = emojiItem.emoji
                                      parent.appendChild(fallback)
                                    } else if (fallback instanceof HTMLElement) {
                                      fallback.style.display = 'flex'
                                    }
                                  }
                                }}
                              />
                              <span 
                                className="emoji-fallback text-4xl hidden absolute inset-0 flex items-center justify-center"
                                style={{ fontSize: '56px' }}
                              >
                                {emojiItem.emoji}
                              </span>
                            </>
                          )
                        }
                        // Fallback para emoji Unicode quando não há imagem
                        return (
                          <span className="text-4xl" style={{ fontSize: '56px' }}>
                            {emojiItem.emoji}
                          </span>
                        )
                      })()}
                    </div>
                    <span className="text-xs text-muted-foreground text-center line-clamp-2 leading-tight px-1">
                      {emojiItem.label}
                    </span>
                  </button>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
