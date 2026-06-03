import * as React from "react";
import { cn } from "~/lib/utils";

export function Avatar({
  name,
  src,
  className,
}: {
  name?: string;
  src?: string;
  className?: string;
}) {
  const initials = (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary",
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line jsx-a11y/alt-text
        <img src={src} className="size-full object-cover" alt={name ?? "avatar"} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}
