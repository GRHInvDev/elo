"use client";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { WeatherWidget } from "@/components/dashboard/weather-widget";
import type { Enterprise } from "@/types/enterprise";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  const updateScrollButtons = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons);
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [itens]);

  const scrollHorizontal = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!itens || itens.length === 0) {
    return null;
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Visualização Desktop (md+) */}
      <div className="mt-8 hidden w-full md:block">
        {/* Caso 1: Somente 1 vídeo (largura 100%, altura responsiva proporcional sem ficar gigante) */}
        {itens.length === 1 && (
          <div className="w-full">
            <div className="relative mx-auto aspect-video max-h-[480px] w-full overflow-hidden rounded-2xl shadow-lg lg:max-h-[520px]">
              <iframe
                src={itens[0]!.imageRef}
                title={itens[0]!.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                className="h-full w-full"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </div>
        )}

        {/* Caso 2: 2 vídeos (50% de cada meio a meio) */}
        {itens.length === 2 && (
          <div className="grid w-full grid-cols-2 gap-4 md:gap-6">
            {itens.map((item, index) => (
              <div key={index} className="h-[380px] w-full lg:h-[420px]">
                <div className="relative h-full w-full overflow-hidden rounded-2xl shadow-lg">
                  <iframe
                    src={item.imageRef}
                    title={item.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    className="h-full w-full"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Caso 3: 3 vídeos (3 colunas, como hoje) */}
        {itens.length === 3 && (
          <div className="grid w-full grid-cols-3 gap-4 md:gap-6">
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
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Caso 4: Mais que 3 vídeos (rolagem horizontal) */}
        {itens.length > 3 && (
          <div className="group relative w-full">
            <div
              ref={scrollContainerRef}
              className="flex w-full snap-x snap-mandatory gap-4 overflow-x-auto pb-4 pt-1 scroll-smooth md:gap-6 scrollbar-thin"
            >
              {itens.map((item, index) => (
                <div
                  key={index}
                  className="h-[400px] w-[calc(33.333%-1rem)] min-w-[340px] shrink-0 snap-start"
                >
                  <div className="relative h-full w-full overflow-hidden rounded-2xl shadow-lg">
                    <iframe
                      src={item.imageRef}
                      title={item.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      className="h-full w-full"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Botões de seta para navegação horizontal suave no desktop */}
            {canScrollLeft && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute -left-4 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full shadow-xl transition-transform hover:scale-110"
                onClick={() => scrollHorizontal("left")}
                aria-label="Rolar para a esquerda"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            {canScrollRight && (
              <Button
                variant="secondary"
                size="icon"
                className="absolute -right-4 top-1/2 z-10 h-10 w-10 -translate-y-1/2 rounded-full shadow-xl transition-transform hover:scale-110"
                onClick={() => scrollHorizontal("right")}
                aria-label="Rolar para a direita"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Carrossel no mobile (mantém o comportamento fluido com o WeatherWidget) */}
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
                  />
                </div>
              </CarouselItem>
            ))}
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
