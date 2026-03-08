"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/components/MarkdownContent";
import type { AppSettingsOverrides } from "@/lib/app-settings";
import { Send, Loader2, Sparkles, Check } from "lucide-react";
import type {
  AppConfig,
  GeneratedFile,
  ChatMessage,
  GenerationDebugData,
  GenerationResult,
  FileUpdateMeta,
} from "@/types";

interface ChatRefinementProps {
  config: AppConfig;
  files: GeneratedFile[];
  settingsOverrides: AppSettingsOverrides;
  onFilesUpdated: (files: GeneratedFile[], meta?: FileUpdateMeta) => void;
  onRegeneratingChange?: (regenerating: boolean) => void;
  embedded?: boolean;
}

export function ChatRefinement({
  config,
  files,
  settingsOverrides,
  onFilesUpdated,
  onRegeneratingChange,
  embedded = false,
}: ChatRefinementProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enhancing, setEnhancing] = useState(false);
  const [enhanced, setEnhanced] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const canEnhance =
    input.trim().length > 0 && !enhancing && !sending;

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleEnhance = async () => {
    if (!canEnhance) return;

    setEnhancing(true);
    setEnhanced(false);
    setEnhanceError(null);

    try {
      const response = await fetch("/api/enhance-refinement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          refinementPrompt: input.trim(),
          config,
          settings: settingsOverrides,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error ||
            `Enhancement failed (${response.status})`
        );
      }

      const result: { refinementPrompt: string } = await response.json();
      setInput(result.refinementPrompt || input);
      setEnhanced(true);
      setTimeout(() => setEnhanced(false), 3000);
    } catch (err) {
      setEnhanceError(
        err instanceof Error ? err.message : "Enhancement failed"
      );
    } finally {
      setEnhancing(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);
    setError(null);
    onRegeneratingChange?.(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          config,
          existingFiles: files,
          chatMessage: text,
          settings: settingsOverrides,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(
          (errData as { error?: string }).error ||
            `Request failed (${response.status})`
        );
      }

      const result: GenerationResult = await response.json();

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content:
          result.message ||
          `Updated ${result.files.length} file${result.files.length === 1 ? "" : "s"}.`,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (result.files.length > 0) {
        // Merge: updated files replace existing, new files are added
        const fileMap = new Map(files.map((f) => [f.path, f]));
        for (const f of result.files) {
          fileMap.set(f.path, f);
        }
        onFilesUpdated(Array.from(fileMap.values()), {
          message: result.message,
          chatSummary: text,
          debug: result.debug,
          changeSource: "refinement",
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to refine";
      setError(msg);
      const errMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `Error: ${msg}`,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
      onRegeneratingChange?.(false);
    }
  };

  return (
    <div
      className={
        embedded
          ? "flex h-full min-h-0 flex-col"
          : "border rounded-lg overflow-hidden"
      }
    >
      {!embedded && (
        <div className="px-3 py-2 bg-muted border-b">
          <p className="text-xs font-medium text-muted-foreground">
            Refine your app with chat
          </p>
        </div>
      )}

      <div
        className={
          embedded
            ? "flex-1 overflow-y-auto p-4 space-y-3"
            : "max-h-48 overflow-y-auto p-3 space-y-2"
        }
      >
        {messages.length === 0 && embedded && (
          <div className="rounded-lg border border-dashed px-4 py-6 text-center">
            <p className="text-sm font-medium text-foreground">
              Refine the generated app
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Describe the change you want, then enhance or send it to update
              the current files.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`text-xs ${
              msg.role === "user" ? "text-right" : "text-left"
            }`}
          >
            <div
              className={`inline-block px-2.5 py-1.5 rounded-lg max-w-[85%] ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              {msg.role === "assistant" ? (
                <MarkdownContent content={msg.content} className="text-xs" />
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <div
        className={
          embedded
            ? "border-t bg-background px-4 py-3 space-y-3"
            : "p-2 border-t space-y-2"
        }
      >
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
        {enhanceError && (
          <p className="text-xs text-destructive">{enhanceError}</p>
        )}
        <textarea
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setEnhanceError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="e.g. Add a search bar to filter results..."
          disabled={sending}
          rows={embedded ? 5 : 3}
          className="flex min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-primary focus-visible:ring-primary/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 resize-y"
        />
        <div
          className={
            embedded
              ? "space-y-2"
              : "flex items-center justify-between gap-2"
          }
        >
          <p className="text-[11px] text-muted-foreground">
            Press Ctrl+Enter or Cmd+Enter to send
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleEnhance}
              disabled={!canEnhance}
              className="h-8 gap-1.5 shrink-0"
            >
              {enhancing ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Enhancing...
                </>
              ) : enhanced ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  Enhanced
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Enhance
                </>
              )}
            </Button>
            <Button
              size="sm"
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="h-8 px-3 shrink-0"
            >
              {sending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {embedded ? "Sending..." : null}
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  {embedded ? "Refine App" : null}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
