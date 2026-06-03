import { useEffect, useRef, useState, useCallback } from "react";
import { Send } from "lucide-react";
import { deliveryApi } from "~/lib/delivery/delivery.api";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface Message {
  _id: string;
  sender_id: string;
  sender_role: string;
  body: string;
  createdAt: string;
}

export function ChatPanel({
  deliveryId,
  meId,
  className,
}: {
  deliveryId: string;
  meId: string;
  className?: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await deliveryApi.messages(deliveryId);
    if (res.success && Array.isArray(res.data)) setMessages(res.data as Message[]);
  }, [deliveryId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    const res = await deliveryApi.sendMessage(deliveryId, body);
    if (res.success) await load();
    setSending(false);
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex-1 space-y-2.5 overflow-y-auto p-1 no-scrollbar">
        {messages.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No messages yet. Say hello to coordinate the handoff.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === meId;
          return (
            <div key={m._id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                  mine
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-bl-md bg-muted text-foreground",
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={cn("mt-0.5 text-[10px] tabular-nums", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {new Date(m.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a message…"
          className="h-10 flex-1 rounded-full border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button size="icon" className="size-10 shrink-0 rounded-full" onClick={send} disabled={sending}>
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
