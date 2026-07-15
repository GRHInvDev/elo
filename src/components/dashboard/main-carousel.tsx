"use client"

import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { cn } from "@/lib/utils"
import { OptimizedImage } from "@/components/ui/optimized-image"
import Link from "next/link"
import { useEffect, useState } from "react"

interface MainCarouselProps {
  itens: {
    imageRef: string
    title: string
    /** Quando presente, o banner vira clicável (links externos abrem em nova aba). */
    href?: string | null
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

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const interval = setInterval(() => {
      carouselApi.scrollNext();
    }, 5500);

    return () => clearInterval(interval);
  }, [carouselApi]);


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
          {itens.map((item, index) => {
            const isExternal = item.href?.startsWith("http") ?? false
            const image = (
              <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg">
                <OptimizedImage
                  alt={item.title}
                  src={item.imageRef || "/placeholder.svg"}
                  fill
                  className="object-cover"
                />
              </div>
            )

            return (
              <CarouselItem key={index} className="w-full h-96">
                {item.href ? (
                  <Link
                    href={item.href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    aria-label={item.title}
                    className="block w-full h-full"
                  >
                    {image}
                  </Link>
                ) : (
                  image
                )}
              </CarouselItem>
            )
          })}
        </CarouselContent>
      </Carousel>

      {/* Indicators */}
      {count > 0 && (
        <div className="flex justify-center gap-2 relative -mb-4 -translate-y-8">
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

