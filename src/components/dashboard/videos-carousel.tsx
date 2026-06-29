"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import type { Enterprise } from "@/types/enterprise";

interface MainCarouselProps {
  itens: {
    imageRef: string;
    title: string;
  }[];
  className?: string;
  enterprise?: Enterprise | null;
}

export function VideosCarousel({
  itens,
  className,
  enterprise,
}: MainCarouselProps) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    setCount(carouselApi.scrollSnapList().length);
    setCurrent(carouselApi.selectedScrollSnap());

    carouselApi.on("select", () => {
      setCurrent(carouselApi.selectedScrollSnap());
    });
  }, [carouselApi]);

  return (
    <div className={cn("w-full", className)}>
      {/* Grid estático no desktop - 3 colunas */}
      <div className="mt-8 hidden w-full gap-4 md:grid md:grid-cols-3 md:gap-6">
        {/* Primeira coluna - Vídeos */}
        {itens.map((item, index) => (
          <div key={index} className="h-[400px] w-full">
            <div className="relative h-full w-full overflow-hidden rounded-2xl shadow-lg">
              <iframe
                src={item.imageRef}
                title={item.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                className="h-full w-full"
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          </div>
        ))}
      </div>

      {/* Carrossel no mobile */}
      <div className="mt-4 md:hidden">
        <Carousel
          className="w-full"
          setApi={setCarouselApi}
          opts={{
            loop: true,
            align: "center",
            inViewThreshold: 1,
            dragFree: true,
          }}
        >
          <CarouselContent
            className="-ml-2 md:-ml-4"
            style={{ touchAction: "pan-x pan-y" }}
          >
            {itens.map((item, index) => (
              <CarouselItem
                key={index}
                className="basis-full pl-2 md:pl-4"
                style={{ touchAction: "pan-x" }}
              >
                <div
                  className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-lg"
                  style={{ touchAction: "pan-x" }}
                >
                  <iframe
                    src={item.imageRef}
                    title={item.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    className="absolute inset-0 h-full w-full"
                    allowFullScreen
                    loading="lazy"
                    style={{ touchAction: "pan-x pinch-zoom" }}
                  ></iframe>
                </div>
              </CarouselItem>
            ))}
            <CarouselItem className="basis-full pl-2 md:pl-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-lg">
                <iframe
                  src="https://www.youtube.com/embed/iSdz3gxUpAI"
                  title="Box"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  className="absolute inset-0 h-full w-full"
                  allowFullScreen
                  loading="lazy"
                  style={{ touchAction: "pan-x pinch-zoom" }}
                ></iframe>
              </div>
            </CarouselItem>
            <CarouselItem className="basis-full pl-2 md:pl-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl shadow-lg">
                <WeatherWidget className="h-full" enterprise={enterprise} />
              </div>
            </CarouselItem>
          </CarouselContent>
        </Carousel>

        {/* Indicators - Apenas no mobile */}
        {count > 0 && (
          <div className="relative z-10 flex -translate-y-8 justify-center gap-2">
            <div className="flex items-center gap-2 rounded-full bg-muted/50 p-1.5 backdrop-blur-sm">
              {Array.from({ length: count }).map((_, index) => (
                <button
                  key={index}
                  className={`size-2 rounded-full transition-all duration-200 ${current === index ? "w-6 bg-foreground" : "bg-muted-foreground/50"}`}
                  onClick={() => carouselApi?.scrollTo(index)}
                  aria-label={`Ir para slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
