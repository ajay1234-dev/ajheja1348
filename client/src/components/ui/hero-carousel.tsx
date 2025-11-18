import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";

interface HeroCarouselProps {
  images: Array<{
    src: string;
    alt: string;
  }>;
  className?: string;
  autoPlayInterval?: number;
  showControls?: boolean;
  showIndicators?: boolean;
  children?: React.ReactNode;
}

export function HeroCarousel({
  images,
  className,
  autoPlayInterval = 5000,
  showControls = true,
  showIndicators = true,
  children,
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-play functionality
  useEffect(() => {
    if (!isPaused && images.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, autoPlayInterval);

      return () => clearInterval(interval);
    }
  }, [currentIndex, isPaused, images.length, autoPlayInterval]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div
      className={cn("relative overflow-hidden rounded-lg group", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Images Container */}
      <div className="relative w-full h-full">
        {images.map((image, index) => (
          <div
            key={index}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-in-out",
              index === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            )}
          >
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover"
              loading={index === 0 ? "eager" : "lazy"}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          </div>
        ))}
      </div>

      {/* Content Overlay */}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          {children}
        </div>
      )}

      {/* Navigation Controls */}
      {showControls && images.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={goToPrevious}
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={goToNext}
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}

      {/* Indicators */}
      {showIndicators && images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentIndex
                  ? "bg-white w-8"
                  : "bg-white/50 hover:bg-white/75"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Medical-themed image collections
export const PATIENT_CAROUSEL_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200&h=600&fit=crop&crop=center&q=80",
    alt: "Medical healthcare dashboard",
  },
  {
    src: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1200&h=600&fit=crop&crop=center&q=80",
    alt: "Healthcare professional with stethoscope",
  },
  {
    src: "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=1200&h=600&fit=crop&crop=center&q=80",
    alt: "Medical examination and care",
  },
  {
    src: "https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1200&h=600&fit=crop&crop=center&q=80",
    alt: "Modern hospital environment",
  },
  {
    src: "https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=1200&h=600&fit=crop&crop=center&q=80",
    alt: "Healthcare team collaboration",
  },
];

export const DOCTOR_CAROUSEL_IMAGES = [
  {
    src: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=1200&h=600&fit=crop&crop=center&q=80",
    alt: "Doctor's professional workspace",
  },
  {
    src: "https://images.unsplash.com/photo-1551076805-e1869033e561?w=1200&h=600&fit=crop&crop=center&q=80",
    alt: "Medical team collaboration",
  },
  {
    src: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=1200&h=600&fit=crop&crop=center&q=80",
    alt: "Doctor examining patient",
  },
  {
    src: "https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=1200&h=600&fit=crop&crop=center&q=80",
    alt: "Modern medical equipment",
  },
  {
    src: "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=1200&h=600&fit=crop&crop=center&q=80",
    alt: "Healthcare professionals in hospital",
  },
];
