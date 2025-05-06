"use client"

import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useEffect, useState } from "react"

interface BirthdayCarouselProps {
  itens: {
    imageRef: string
    title: string
  }[],
  className?: string
}

export function BirthdaysCarousel({ itens, className }: BirthdayCarouselProps) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!carouselApi) {
      return
    }

    setCount(carouselApi.scrollSnapList().length)
    setCurrent(carouselApi.selectedScrollSnap())

    carouselApi.on("select", () => {
      setCurrent(carouselApi.selectedScrollSnap())
    })
  }, [carouselApi])

  return (
    <div className={cn(className)}>
      <div className="-mt-11 flex justify-between backdrop-blur-sm items-center translate-y-11 relative z-40 bg-gradient-to-b from-black/50 pb-4 to-transparent">
        <h2 className="text-xl font-semibold ml-2 text-white drop-shadow-md z-50">Aniversariantes do mês 🎉</h2>
      </div>
      <Carousel
        className="w-full"
        setApi={setCarouselApi}
        opts={{
          loop: true,
          align: "center",
        }}
      >
        <CarouselContent>
          {itens.map((item, index) => (
            <CarouselItem key={index} className="aspect-square md:h-96">
              <div className="relative w-full h-full">
                <Image
                  alt={item.title}
                  src={item.imageRef || "/placeholder.svg"}
                  fill
                  className="object-cover"
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Indicators */}
      {count > 0 && (
        <div className="flex justify-center gap-2 relative -mb-4 -translate-y-8">
          <div className="rounded-full bg-muted/50 flex items-center">
            {Array.from({ length: count }).map((_, index) => (
              <button
                key={index}
                className={`transition-all my-1 rounded-full duration-500
                  ${current === index ? "bg-foreground" : "bg-muted-foreground"}
                  ${ index < current-3 || index > current+3 ? "size-1 mx-[2px]" : "size-2 mx-1"}`}
                onClick={() => carouselApi?.scrollTo(index)}
                aria-label={`Ir para slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

