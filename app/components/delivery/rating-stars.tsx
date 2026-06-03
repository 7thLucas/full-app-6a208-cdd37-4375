import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "~/lib/utils";

export function RatingStars({
  value,
  onChange,
  size = "md",
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const px = size === "lg" ? "size-8" : size === "sm" ? "size-3.5" : "size-5";
  const display = hover || value;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => !readOnly && setHover(i)}
          onMouseLeave={() => !readOnly && setHover(0)}
          onClick={() => !readOnly && onChange?.(i)}
          className={cn(!readOnly && "cursor-pointer", readOnly && "cursor-default")}
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              px,
              i <= display ? "fill-accent text-accent" : "fill-transparent text-muted-foreground/40",
            )}
            strokeWidth={1.8}
          />
        </button>
      ))}
    </div>
  );
}
