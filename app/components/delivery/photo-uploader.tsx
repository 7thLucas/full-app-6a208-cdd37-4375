import { useRef, useState } from "react";
import { Camera, Loader2, CheckCircle2 } from "lucide-react";
import { deliveryApi } from "~/lib/delivery/delivery.api";
import { cn } from "~/lib/utils";

export function PhotoUploader({
  label = "Add photo",
  value,
  onUploaded,
}: {
  label?: string;
  value?: string;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const res = await deliveryApi.upload(file);
      if (res?.url) onUploaded(res.url);
      else setError("Upload failed. Try again.");
    } catch {
      setError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={cn(
          "relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed text-sm transition-colors",
          value ? "border-secondary bg-secondary/5" : "border-border bg-muted/40 hover:bg-muted",
        )}
      >
        {value ? (
          <>
            <img src={value} alt={label} className="absolute inset-0 size-full object-cover" />
            <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-emerald-600 shadow-sm">
              <CheckCircle2 className="size-3.5" /> Saved
            </span>
          </>
        ) : uploading ? (
          <>
            <Loader2 className="size-5 animate-spin text-primary" />
            <span className="text-muted-foreground">Uploading…</span>
          </>
        ) : (
          <>
            <Camera className="size-6 text-muted-foreground" />
            <span className="font-medium text-foreground">{label}</span>
          </>
        )}
      </button>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
