"use client";

import { pickAppData } from "@/lib/persistence";
import { useAppStore, useData } from "@/lib/store";
import { useEffect, useRef, useState } from "react";

type SyncStatus = "loading" | "idle" | "saving" | "saved" | "error";

/**
 * Loads data/user-data.json when present, then auto-saves edits to disk
 * (in addition to browser localStorage).
 */
export function DataSync({
  onStatus,
}: {
  onStatus?: (status: SyncStatus, detail?: string) => void;
} = {}) {
  const replaceData = useAppStore((s) => s.replaceData);
  const hydrated = useAppStore((s) => s.hydrated);
  const data = useData();
  const readyToSave = useRef(false);
  const lastSaved = useRef("");
  const [bootstrapped, setBootstrapped] = useState(false);

  // Load project file once (preferred over seed when present)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      onStatus?.("loading");
      try {
        const res = await fetch("/api/data");
        if (!res.ok) throw new Error("Failed to load");
        const json = (await res.json()) as {
          exists: boolean;
          data: ReturnType<typeof pickAppData> | null;
          mode?: string;
        };
        if (!cancelled && json.exists && json.data) {
          replaceData(json.data);
          lastSaved.current = JSON.stringify(json.data);
          onStatus?.("saved", "Loaded data/user-data.json");
        } else if (json.mode === "browser-only") {
          onStatus?.(
            "idle",
            "Hosted mode — saving in this browser only. Use Settings → Download backup.",
          );
        } else {
          onStatus?.("idle", "No project file yet — will create on first edit");
        }
      } catch {
        if (!cancelled) onStatus?.("error", "Could not reach data API");
      } finally {
        if (!cancelled) {
          readyToSave.current = true;
          setBootstrapped(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // intentionally once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced auto-save to project folder
  useEffect(() => {
    if (!hydrated || !bootstrapped || !readyToSave.current) return;

    const payload = pickAppData(data);
    const serialized = JSON.stringify(payload);
    if (serialized === lastSaved.current) return;

    onStatus?.("saving");
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/data", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: serialized,
        });
        if (!res.ok) throw new Error("save failed");
        const json = (await res.json()) as { persisted?: boolean; mode?: string };
        lastSaved.current = serialized;
        if (json.persisted === false || json.mode === "browser-only") {
          onStatus?.("saved", "Saved in this browser (hosted mode)");
        } else {
          onStatus?.("saved", "Saved to data/user-data.json");
        }
      } catch {
        onStatus?.("error", "Auto-save to project folder failed");
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [data, hydrated, bootstrapped, onStatus]);

  return null;
}

export type { SyncStatus };
