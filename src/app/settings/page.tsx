"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { PageHeader, Panel, Section } from "@/components/ui/panel";
import { downloadJson, isAppData, pickAppData } from "@/lib/persistence";
import { hasMapTilerKey } from "@/lib/maptiler";
import { useAppStore, useData } from "@/lib/store";
import { useEffect, useRef, useState } from "react";

type DataMode = "cloud" | "file" | "repo-seed" | "browser-only" | "unknown";

export default function SettingsPage() {
  const data = useData();
  const updateSettings = useAppStore((s) => s.updateSettings);
  const resetToSeed = useAppStore((s) => s.resetToSeed);
  const replaceData = useAppStore((s) => s.replaceData);
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<DataMode>("unknown");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/data");
        if (!res.ok) return;
        const json = (await res.json()) as { mode?: DataMode };
        if (json.mode) setMode(json.mode);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const exportBackup = () => {
    downloadJson(
      `phd-os-backup-${new Date().toISOString().slice(0, 10)}.json`,
      pickAppData(data),
    );
    setMessage("Backup downloaded.");
  };

  const saveNow = async () => {
    setMessage("Saving…");
    try {
      const res = await fetch("/api/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pickAppData(data)),
      });
      if (!res.ok) throw new Error("failed");
      const json = (await res.json()) as {
        persisted?: boolean;
        mode?: DataMode;
        message?: string;
      };
      if (json.mode) setMode(json.mode);
      setMessage(
        json.message ??
          (json.mode === "cloud"
            ? "Saved to cloud — available on all devices."
            : json.persisted === false
              ? "Saved in this browser only. Set up cloud (docs/CLOUD_SETUP.md)."
              : "Saved."),
      );
    } catch {
      setMessage("Save failed. Check the server / cloud configuration.");
    }
  };

  const onImportFile = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      if (!isAppData(parsed)) {
        setMessage("Invalid backup file.");
        return;
      }
      replaceData(parsed);
      const res = await fetch("/api/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const json = (await res.json()) as { mode?: DataMode; message?: string };
      if (json.mode) setMode(json.mode);
      setMessage(
        json.mode === "cloud"
          ? "Imported and saved to cloud — open the site on your phone to verify."
          : "Imported backup.",
      );
    } catch {
      setMessage("Import failed — check that the file is valid JSON.");
    }
  };

  const modeLabel =
    mode === "cloud"
      ? "Cloud database (syncs across devices)"
      : mode === "file"
        ? "Local project file"
        : mode === "repo-seed"
          ? "Repo snapshot (read once)"
          : mode === "browser-only"
            ? "This browser only — cloud not configured"
            : "Checking…";

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Profile and where your application season data lives"
      />

      <Section title="Profile">
        <Panel className="space-y-3 p-4">
          <Field label="Applicant name">
            <Input
              value={data.settings.applicantName}
              onChange={(e) => updateSettings({ applicantName: e.target.value })}
            />
          </Field>
          <Field label="Application cycle">
            <Input
              value={data.settings.cycle}
              onChange={(e) => updateSettings({ cycle: e.target.value })}
            />
          </Field>
          <Field label="Timezone">
            <Input
              value={data.settings.timezone}
              onChange={(e) => updateSettings({ timezone: e.target.value })}
            />
          </Field>
        </Panel>
      </Section>

      <Section
        title="Map tiles"
        description="High-detail campus maps use a free MapTiler API key"
      >
        <Panel className="space-y-3 p-4">
          <div className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-[13px]">
            <span className="text-ink-muted">MapTiler key: </span>
            <span className="font-medium text-ink">
              {hasMapTilerKey() ? "Configured (HD streets)" : "Not set — using blurry OSM preview"}
            </span>
          </div>
          <p className="text-[13px] leading-relaxed text-ink-secondary">
            1. Create a free key at{" "}
            <a
              className="text-accent underline"
              href="https://cloud.maptiler.com/account/keys/"
              target="_blank"
              rel="noreferrer"
            >
              MapTiler Cloud
            </a>
            .
            <br />
            2. In Vercel → Project → Settings → Environment Variables, add{" "}
            <code className="font-mono text-[12px]">NEXT_PUBLIC_MAPTILER_KEY</code>{" "}
            for Production (and Preview if you want).
            <br />
            3. Redeploy. State drill-down maps become sharp, and unknown campuses can be
            geocoded to real coordinates.
          </p>
        </Panel>
      </Section>

      <Section
        title="Data sync"
        description="For phone / iPad / any computer, use cloud (Supabase)"
      >
        <Panel className="space-y-4 p-4">
          <div className="rounded-[var(--radius)] border border-border bg-bg px-3 py-2 text-[13px]">
            <span className="text-ink-muted">Current mode: </span>
            <span className="font-medium text-ink">{modeLabel}</span>
          </div>

          {mode !== "cloud" ? (
            <p className="text-[13px] leading-relaxed text-ink-secondary">
              To edit on the website from any device, set up a free Supabase project and
              add two env vars on Vercel. Step-by-step:{" "}
              <code className="font-mono text-[12px]">docs/CLOUD_SETUP.md</code> in the
              repo, or{" "}
              <a
                className="text-accent underline"
                href="https://github.com/MITmydreams/phd-os/blob/main/docs/CLOUD_SETUP.md"
                target="_blank"
                rel="noreferrer"
              >
                CLOUD_SETUP on GitHub
              </a>
              .
            </p>
          ) : (
            <p className="text-[13px] leading-relaxed text-ink-secondary">
              Edits auto-save to the cloud. Open the same Vercel URL on iPhone or iPad to
              see the latest data.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={saveNow}>
              Save now
            </Button>
            <Button variant="secondary" onClick={exportBackup}>
              Download backup JSON
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              Import backup JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onImportFile(file);
                e.target.value = "";
              }}
            />
          </div>

          {message ? (
            <p className="text-[12px] text-ink-muted">{message}</p>
          ) : null}

          <Button variant="danger" onClick={() => setConfirmReset(true)}>
            Reset to demo seed data
          </Button>
        </Panel>
      </Section>

      <Section title="About">
        <Panel className="p-4 text-[13px] text-ink-secondary">
          <p>
            A quiet personal operating system for a PhD application season — not a
            generic tracker, not a Notion clone.
          </p>
        </Panel>
      </Section>

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset all data?"
        description="This replaces your current data with the demo seed and saves that reset to cloud/local storage."
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmReset(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              resetToSeed();
              try {
                await fetch("/api/data", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(pickAppData(useAppStore.getState())),
                });
              } catch {
                /* ignore */
              }
              setConfirmReset(false);
              setMessage("Reset to demo seed.");
            }}
          >
            Reset
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
