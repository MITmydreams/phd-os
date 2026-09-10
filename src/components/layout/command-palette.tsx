"use client";

import { searchAll } from "@/lib/selectors";
import { useData } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const data = useData();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const results = useMemo(() => searchAll(data, query), [data, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && results[active]) {
        e.preventDefault();
        router.push(results[active].href);
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, results, active, router]);

  if (!open) return null;

  const grouped = results.reduce<Record<string, typeof results>>((acc, r) => {
    (acc[r.type] ??= []).push(r);
    return acc;
  }, {});

  let flatIndex = -1;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[14vh]">
      <button
        className="absolute inset-0 bg-ink/35 backdrop-blur-[1px]"
        aria-label="Close search"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label="Command palette"
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-[var(--radius-lg)] border border-border bg-bg-elevated shadow-[var(--shadow-md)]"
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <Search className="h-4 w-4 text-ink-faint" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search applications, professors, papers, tasks…"
            className="h-12 w-full bg-transparent text-[14px] outline-none placeholder:text-ink-faint"
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-ink-muted sm:inline">
            ESC
          </kbd>
        </div>

        <div className="scroll-thin max-h-[50vh] overflow-y-auto p-2">
          {!query.trim() ? (
            <div className="px-3 py-6 text-[13px] text-ink-muted">
              Type to search across your application season.
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-6 text-[13px] text-ink-muted">
              No matches for “{query}”.
            </div>
          ) : (
            Object.entries(grouped).map(([type, items]) => (
              <div key={type} className="mb-2">
                <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-ink-faint">
                  {type}
                </div>
                {items.map((item) => {
                  flatIndex += 1;
                  const index = flatIndex;
                  return (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      onMouseEnter={() => setActive(index)}
                      onClick={() => {
                        router.push(item.href);
                        onClose();
                      }}
                      className={cn(
                        "flex w-full flex-col rounded-[var(--radius)] px-2.5 py-2 text-left",
                        active === index ? "bg-accent-soft" : "hover:bg-bg-hover",
                      )}
                    >
                      <span className="text-[13px] font-medium text-ink">{item.title}</span>
                      {item.subtitle ? (
                        <span className="text-[12px] text-ink-muted">{item.subtitle}</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
