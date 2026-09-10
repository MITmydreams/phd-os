"use client";

import { pickAppData } from "@/lib/persistence";
import { useAppStore, useData } from "@/lib/store";
import { useEffect, useRef, useState } from "react";

type SyncStatus = "loading" | "idle" | "saving" | "saved" | "error";

/**
 * Loads shared state from /api/data (cloud when configured), then
 * auto-saves edits so phone / iPad / laptop stay in sync.
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
          const label =
            json.mode === "cloud"
              ? "Loaded from cloud"
              : json.mode === "repo-seed"
                ? "Loaded repo snapshot"
                : "Loaded local data file";
          onStatus?.("saved", label);
        } else if (json.mode === "browser-only") {
          onStatus?.(
            "idle",
            "No cloud yet — this browser only. Set up Supabase (docs/CLOUD_SETUP.md).",
          );
        } else if (json.mode === "cloud") {
          onStatus?.("idle", "Cloud ready — first edit will create your dataset");
        } else {
          onStatus?.("idle", "No saved data yet — will create on first edit");
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        const json = (await res.json()) as {
          persisted?: boolean;
          mode?: string;
          message?: string;
        };
        lastSaved.current = serialized;
        if (json.mode === "cloud") {
          onStatus?.("saved", "Saved to cloud");
        } else if (json.persisted === false || json.mode === "browser-only") {
          onStatus?.("saved", "Saved in this browser only");
        } else {
          onStatus?.("saved", "Saved locally");
        }
      } catch {
        onStatus?.("error", "Auto-save failed");
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [data, hydrated, bootstrapped, onStatus]);

  return null;
}

export type { SyncStatus };
