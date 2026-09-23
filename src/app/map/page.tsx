"use client";

import { UsProfessorMap } from "@/components/map/us-professor-map";
import {
  EmptyState,
  PageHeader,
  Panel,
  Section,
  StatStrip,
} from "@/components/ui/panel";
import { useData } from "@/lib/store";
import {
  OUTSIDE_US,
  UNKNOWN_REGION,
  groupProfessorsByRegion,
  regionLabel,
} from "@/lib/us-geography";
import { cn } from "@/lib/utils";
import { Globe2, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function MapPage() {
  const data = useData();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const { byState, outside, unknown, groups } = useMemo(
    () => groupProfessorsByRegion(data.professors),
    [data.professors],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const [code, list] of byState) c[code] = list.length;
    return c;
  }, [byState]);

  const usCount = data.professors.length - outside.length - unknown.length;
  const stateCount = byState.size;

  const focusGroup = useMemo(() => {
    if (!selected) return null;
    if (selected === OUTSIDE_US) {
      return {
        code: OUTSIDE_US,
        label: regionLabel(OUTSIDE_US),
        professors: outside,
      };
    }
    if (selected === UNKNOWN_REGION) {
      return {
        code: UNKNOWN_REGION,
        label: regionLabel(UNKNOWN_REGION),
        professors: unknown,
      };
    }
    const list = byState.get(selected) ?? [];
    return {
      code: selected,
      label: regionLabel(selected),
      professors: list,
    };
  }, [selected, byState, outside, unknown]);

  if (data.professors.length === 0) {
    return (
      <div>
        <PageHeader
          eyebrow="Geography"
          title="Professor map"
          description="See where your target faculty sit across the United States."
        />
        <EmptyState
          title="No professors yet"
          description="Add professors first, then return here to see their state distribution on the map."
          actionLabel="Go to Professors"
          onAction={() => router.push("/professors")}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Geography"
        title="Professor map"
        description="Interactive U.S. map of faculty you’ve added — hover for counts, click a state to inspect."
      />

      <StatStrip
        items={[
          { label: "Professors", value: data.professors.length },
          { label: "U.S. states", value: stateCount },
          { label: "In the U.S.", value: usCount },
          { label: "Outside U.S.", value: outside.length },
        ]}
      />

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.9fr)]">
        <Panel className="overflow-hidden p-4 sm:p-5">
          <UsProfessorMap
            counts={counts}
            selected={selected && selected.length === 2 ? selected : null}
            onSelect={setSelected}
          />
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel className="flex-1 p-4 sm:p-5">
            <Section
              title={focusGroup ? focusGroup.label : "All regions"}
              description={
                focusGroup
                  ? `${focusGroup.professors.length} professor${focusGroup.professors.length === 1 ? "" : "s"}`
                  : "Select a state on the map, or pick a region below."
              }
              actions={
                selected ? (
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="text-[12px] text-ink-muted hover:text-accent"
                  >
                    Clear
                  </button>
                ) : null
              }
            >
              <ul className="mt-3 space-y-2">
                {(focusGroup ? focusGroup.professors : data.professors).map(
                  (p, i) => (
                    <li
                      key={p.id}
                      className="animate-in rounded-[var(--radius)] border border-border bg-bg px-3 py-2.5 transition-colors hover:border-border-strong"
                      style={{ animationDelay: `${i * 30}ms` }}
                    >
                      <Link
                        href={`/professors/${p.id}`}
                        className="block font-medium text-ink hover:text-accent"
                      >
                        {p.name}
                      </Link>
                      <div className="mt-0.5 flex items-start gap-1.5 text-[12px] text-ink-secondary">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-ink-faint" />
                        <span>{p.institution}</span>
                      </div>
                      {p.researchAreas.length > 0 ? (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {p.researchAreas.slice(0, 3).map((a) => (
                            <span
                              key={a}
                              className="rounded-sm bg-bg-muted px-1.5 py-0.5 text-[10px] text-ink-muted"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </li>
                  ),
                )}
                {focusGroup && focusGroup.professors.length === 0 ? (
                  <li className="py-6 text-center text-[13px] text-ink-muted">
                    No professors mapped to this state yet.
                  </li>
                ) : null}
              </ul>
            </Section>
          </Panel>

          {(outside.length > 0 || unknown.length > 0) && (
            <Panel className="p-4 sm:p-5">
              <div className="mb-2 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.08em] text-ink-muted">
                <Globe2 className="h-3.5 w-3.5" />
                Beyond the map
              </div>
              <div className="space-y-2">
                {outside.length > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSelected(
                        selected === OUTSIDE_US ? null : OUTSIDE_US,
                      )
                    }
                    className={cn(
                      "flex w-full items-center justify-between rounded-[var(--radius)] border px-3 py-2 text-left text-[13px] transition-colors",
                      selected === OUTSIDE_US
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-border hover:border-border-strong",
                    )}
                  >
                    <span>Outside the U.S.</span>
                    <span className="font-mono text-[12px]">{outside.length}</span>
                  </button>
                ) : null}
                {unknown.length > 0 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSelected(
                        selected === UNKNOWN_REGION ? null : UNKNOWN_REGION,
                      )
                    }
                    className={cn(
                      "flex w-full items-center justify-between rounded-[var(--radius)] border px-3 py-2 text-left text-[13px] transition-colors",
                      selected === UNKNOWN_REGION
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-border hover:border-border-strong",
                    )}
                  >
                    <span>Unknown location</span>
                    <span className="font-mono text-[12px]">{unknown.length}</span>
                  </button>
                ) : null}
              </div>
            </Panel>
          )}
        </div>
      </div>

      <Panel className="mt-5 p-4 sm:p-5">
        <Section
          title="By state"
          description="Ranked by how many of your professors land in each region."
        >
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <button
                key={g.code}
                type="button"
                onClick={() =>
                  setSelected(selected === g.code ? null : g.code)
                }
                className={cn(
                  "flex items-center justify-between rounded-[var(--radius)] border px-3 py-2.5 text-left transition-colors",
                  selected === g.code
                    ? "border-accent bg-accent-soft"
                    : "border-border bg-bg hover:border-border-strong",
                )}
              >
                <div>
                  <div className="text-[13px] font-medium text-ink">
                    {g.label}
                  </div>
                  <div className="mt-0.5 text-[11px] text-ink-muted">
                    {g.professors
                      .slice(0, 2)
                      .map((p) => p.name.replace(/^Prof\.?\s*/i, ""))
                      .join(" · ")}
                    {g.professors.length > 2
                      ? ` +${g.professors.length - 2}`
                      : ""}
                  </div>
                </div>
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full font-mono text-[12px] font-semibold",
                    selected === g.code
                      ? "bg-accent text-[var(--bg-elevated)]"
                      : "bg-accent-soft text-accent",
                  )}
                >
                  {g.professors.length}
                </div>
              </button>
            ))}
          </div>
        </Section>
      </Panel>
    </div>
  );
}
