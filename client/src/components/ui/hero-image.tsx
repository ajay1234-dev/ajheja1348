import { cn } from "@/lib/utils";

interface HeroImageProps {
  src: string;
  alt: string;
  className?: string;
  overlay?: boolean;
}

export function HeroImage({
  src,
  alt,
  className,
  overlay = true,
}: HeroImageProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)}>
      <img src={src} alt={alt} className="w-full h-full object-cover" />
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      )}
    </div>
  );
}

// Medical-themed placeholder images
export const MEDICAL_IMAGES = {
  hero: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=600&fit=crop&crop=center",
  dashboard:
    "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=400&fit=crop&crop=center",
  reports:
    "https://images.unsplash.com/photo-1576091160550-2173dba0ef83?w=800&h=400&fit=crop&crop=center",
  doctor:
    "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&h=400&fit=crop&crop=center",
  upload:
    "https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=1200&h=400&fit=crop&crop=center&q=80",
  health:
    "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&h=400&fit=crop&crop=center",
} as const;
