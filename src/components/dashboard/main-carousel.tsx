"use client"

import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"

interface MainCarouselProps {
  itens: {
    imageRef: string
    title: string
  }[],
  className?: string
}

export function MainCarousel({ itens, className }: MainCarouselProps) {
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
      <Carousel
        className="w-full"
        setApi={setCarouselApi}
        opts={{
          loop: true,
          align: "center",
        }}
      >
        <CarouselContent>
          <CarouselItem className="object-contain w-full h-96 aspect-video">
            <div className="size-full">
              <Link className="relative size-full flex items-center" href="https://painel.umentor.com.br/cadastro_treinamento/?con_cod=ges449602&pla=5">
                <Image className="object-cover" fill src="/banners/banner box wide.png" alt="box" sizes="(max-width: 1920px) 100vw, 256px"/>
              </Link>
            </div>
          </CarouselItem>
          {itens.map((item, index) => (
            <CarouselItem key={index} className="w-full h-96">
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
        <div className="flex justify-center gap-2 relative -translate-y-8">
          <div className="rounded-full bg-muted/50 flex items-center gap-2 p-1">
            {Array.from({ length: count }).map((_, index) => (
              <button
                key={index}
                className={`size-2 md:size-3 rounded-full transition-colors ${current === index ? "bg-foreground" : "bg-muted-foreground"}`}
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

