import { Package } from "lucide-react";
import { useConfigurables } from "~/modules/configurables";
import { cn } from "~/lib/utils";

export function useBrand() {
  const { config, loading } = useConfigurables();
  return {
    loading,
    appName: config?.appName || "Pakettt!",
    tagline: config?.tagline || "Verifiable delivery you can watch happen.",
    logoUrl: config?.logoUrl && !String(config.logoUrl).startsWith("FILL_") ? config.logoUrl : "",
    currencySymbol: config?.currencySymbol || "$",
    config,
  };
}

export function BrandMark({ className, iconOnly = false }: { className?: string; iconOnly?: boolean }) {
  const { appName, logoUrl } = useBrand();
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {logoUrl ? (
        <img src={logoUrl} alt={appName} className="size-8 rounded-lg object-contain" />
      ) : (
        <span className="flex size-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Package className="size-5" strokeWidth={2.4} />
        </span>
      )}
      {!iconOnly && (
        <span className="text-lg font-extrabold tracking-tight text-foreground">{appName}</span>
      )}
    </div>
  );
}
