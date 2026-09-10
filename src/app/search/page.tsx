"use client";

import { PageHeader, Panel } from "@/components/ui/panel";
import { searchAll } from "@/lib/selectors";
import { useData } from "@/lib/store";
import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export default function SearchPage() {
  const data = useData();
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchAll(data, query), [data, query]);

  const grouped = results.reduce<Record<string, typeof results>>((acc, r) => {
    (acc[r.type] ??= []).push(r);
    return acc;
  }, {});

  return (
    <div>
      <PageHeader
        title="Search"
        description="Find applications, professors, papers, tasks, and documents"
      />

      <div className="mb-6 flex items-center gap-2 rounded-[var(--radius-lg)] border border-border bg-bg-elevated px-3">
        <Search className="h-4 w-4 text-ink-faint" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try “Stanford”, “Chen”, or “SOP”"
          className="h-11 w-full bg-transparent text-[14px] outline-none placeholder:text-ink-faint"
        />
        <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-ink-muted sm:inline">
          ⌘K
        </kbd>
      </div>

      {!query.trim() ? (
        <Panel className="px-4 py-10 text-[13px] text-ink-muted">
          Search across your full application season. You can also open the command
          palette from anywhere with ⌘K.
        </Panel>
      ) : results.length === 0 ? (
        <Panel className="px-4 py-10 text-[13px] text-ink-muted">
          No matches for “{query}”.
        </Panel>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([type, items]) => (
            <section key={type}>
              <h2 className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-ink-faint">
                {type}
              </h2>
              <Panel>
                <ul className="divide-y divide-border">
                  {items.map((item) => (
                    <li key={`${item.type}-${item.id}`}>
                      <Link
                        href={item.href}
                        className="block px-4 py-3 hover:bg-bg-hover"
                      >
                        <div className="text-[13px] font-medium">{item.title}</div>
                        {item.subtitle ? (
                          <div className="text-[12px] text-ink-muted">{item.subtitle}</div>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
