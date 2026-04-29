"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewStarsProps {
  value: number;
  onChange?: (next: number) => void;
  size?: number;
  className?: string;
}

export function ReviewStars({ value, onChange, size = 18, className }: ReviewStarsProps) {
  const stars = Array.from({ length: 5 }, (_, idx) => idx + 1);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {stars.map((star) => {
        const active = star <= value;

        if (!onChange) {
          return (
            <Star
              key={star}
              className={cn("text-gray-300", active && "fill-amber-400 text-amber-400")}
              size={size}
            />
          );
        }

        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label={`Chon ${star} sao`}
          >
            <Star
              className={cn(
                "text-gray-300 transition-colors",
                active && "fill-amber-400 text-amber-400",
                "hover:text-amber-300"
              )}
              size={size}
            />
          </button>
        );
      })}
    </div>
  );
}
