"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Button } from "./button";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  wide,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
  size?: "md" | "lg" | "xl";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isXl = size === "xl";

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex justify-center px-3 sm:px-4",
        isXl ? "items-stretch py-3 sm:py-5" : "items-start pt-[12vh]",
      )}
    >
      <button
        aria-label="Close dialog backdrop"
        className="absolute inset-0 bg-ink/30 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        className={cn(
          "relative z-10 flex w-full animate-in flex-col rounded-[var(--radius-lg)] border border-border bg-bg-elevated shadow-[var(--shadow-md)]",
          isXl
            ? "max-h-[calc(100vh-1.5rem)] max-w-5xl sm:max-h-[calc(100vh-2.5rem)]"
            : wide || size === "lg"
              ? "max-w-2xl"
              : "max-w-md",
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <h2 id="dialog-title" className="font-serif text-lg text-ink">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-[13px] text-ink-secondary">{description}</p>
            ) : null}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div
          className={cn(
            "px-4 py-4",
            isXl && "flex min-h-0 flex-1 flex-col overflow-hidden",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
