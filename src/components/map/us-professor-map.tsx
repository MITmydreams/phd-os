"use client";

import { STATE_NAMES } from "@/lib/us-geography";
import { cn } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";

type StatePath = { d: string; cx: number; cy: number };

export function UsProfessorMap({
  counts,
  selected,
  onSelect,
  className,
}: {
  counts: Record<string, number>;
  selected: string | null;
  onSelect: (code: string | null) => void;
  className?: string;
}) {
  const [paths, setPaths] = useState<Record<string, StatePath> | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/geo/us-state-paths.json")
      .then((r) => {
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then((data: Record<string, StatePath>) => {
        if (!cancelled) setPaths(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const max = useMemo(
    () => Math.max(1, ...Object.values(counts)),
    [counts],
  );

  if (loadError) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-border px-4 py-10 text-center text-[13px] text-ink-muted">
        Couldn’t load the map geometry. Refresh and try again.
      </div>
    );
  }

  if (!paths) {
    return (
      <div className="space-y-3 py-6">
        <div className="skeleton h-[280px] w-full sm:h-[360px]" />
        <div className="skeleton h-3 w-48" />
      </div>
    );
  }

  const active = hovered ?? selected;
  const tip =
    active && paths[active]
      ? {
          code: active,
          name: STATE_NAMES[active] ?? active,
          count: counts[active] ?? 0,
          x: paths[active].cx,
          y: paths[active].cy,
        }
      : null;

  const fillFor = (code: string) => {
    const n = counts[code] ?? 0;
    if (n === 0) return "var(--bg-muted)";
    const t = n / max;
    if (t <= 0.34) return "var(--accent-soft)";
    if (t <= 0.67)
      return "color-mix(in oklch, var(--accent) 45%, var(--accent-soft))";
    return "var(--accent)";
  };

  const strokeFor = (code: string) => {
    if (selected === code) return "var(--ink)";
    if (hovered === code) return "var(--accent-hover)";
    return "var(--bg-elevated)";
  };

  return (
    <div className={cn("relative w-full", className)}>
      <svg
        viewBox="0 0 960 600"
        role="img"
        aria-label="United States map of professor locations"
        className="h-auto w-full select-none"
      >
        <defs>
          <filter id="map-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity="0.08" />
          </filter>
        </defs>

        <g filter="url(#map-soft)">
          {Object.entries(paths).map(([code, path], i) => {
            const n = counts[code] ?? 0;
            const isActive = selected === code || hovered === code;
            return (
              <path
                key={code}
                d={path.d}
                fill={fillFor(code)}
                stroke={strokeFor(code)}
                strokeWidth={isActive ? 1.6 : 0.7}
                className={cn(
                  "cursor-pointer transition-[fill,stroke,stroke-width,opacity] duration-300 ease-out",
                  n > 0 ? "opacity-100" : "opacity-90",
                )}
                style={{
                  animation: `map-state-in 520ms ease-out ${Math.min(i * 8, 280)}ms both`,
                }}
                onMouseEnter={() => setHovered(code)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect(selected === code ? null : code)}
              >
                <title>
                  {STATE_NAMES[code] ?? code}
                  {n ? ` — ${n} professor${n === 1 ? "" : "s"}` : ""}
                </title>
              </path>
            );
          })}
        </g>

        <g>
          {Object.entries(counts).map(([code, n], i) => {
            const path = paths[code];
            if (!path || n <= 0) return null;
            const r = 9 + Math.min(n, 4) * 2;
            const isActive = selected === code || hovered === code;
            return (
              <g
                key={`m-${code}`}
                transform={`translate(${path.cx}, ${path.cy})`}
                className="pointer-events-none"
                style={{
                  animation: `map-marker-in 480ms cubic-bezier(.2,.8,.2,1) ${120 + i * 40}ms both`,
                }}
              >
                <circle
                  r={r + 4}
                  fill="var(--accent)"
                  opacity={isActive ? 0.18 : 0.1}
                  style={{
                    animation: isActive
                      ? "map-pulse 1.8s ease-out infinite"
                      : undefined,
                  }}
                />
                <circle
                  r={r}
                  fill="var(--bg-elevated)"
                  stroke="var(--accent)"
                  strokeWidth={isActive ? 2 : 1.4}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-accent font-mono"
                  style={{ fontSize: 11, fontWeight: 600 }}
                >
                  {n}
                </text>
              </g>
            );
          })}
        </g>

        {tip ? (
          <g
            transform={`translate(${Math.min(Math.max(tip.x, 70), 890)}, ${Math.max(tip.y - 36, 18)})`}
            className="pointer-events-none"
          >
            <rect
              x={-62}
              y={-16}
              width={124}
              height={32}
              rx={6}
              fill="var(--ink)"
              opacity={0.92}
            />
            <text
              textAnchor="middle"
              y={-2}
              className="fill-[var(--bg-elevated)]"
              style={{ fontSize: 11, fontWeight: 600 }}
            >
              {tip.name}
            </text>
            <text
              textAnchor="middle"
              y={11}
              className="fill-[var(--bg-elevated)]"
              style={{ fontSize: 10, opacity: 0.8 }}
            >
              {tip.count
                ? `${tip.count} professor${tip.count === 1 ? "" : "s"}`
                : "No professors yet"}
            </text>
          </g>
        ) : null}
      </svg>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-ink-muted">
        <span className="uppercase tracking-[0.08em]">Density</span>
        <div className="flex items-center gap-1">
          <span
            className="inline-block h-2.5 w-6 rounded-sm"
            style={{ background: "var(--bg-muted)" }}
          />
          <span>0</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="inline-block h-2.5 w-6 rounded-sm"
            style={{ background: "var(--accent-soft)" }}
          />
          <span>few</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="inline-block h-2.5 w-6 rounded-sm"
            style={{ background: "var(--accent)" }}
          />
          <span>more</span>
        </div>
        <span className="text-ink-faint">Click a state to focus</span>
      </div>
    </div>
  );
}
