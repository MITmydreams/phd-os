"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { PageHeader, Panel, Section } from "@/components/ui/panel";
import { downloadJson, isAppData, pickAppData } from "@/lib/persistence";
import { useAppStore, useData } from "@/lib/store";
import { useRef, useState } from "react";

export default function SettingsPage() {
  const data = useData();
  const updateSettings = useAppStore((s) => s.updateSettings);
  const resetToSeed = useAppStore((s) => s.resetToSeed);
  const replaceData = useAppStore((s) => s.replaceData);
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportBackup = () => {
    downloadJson(
      `phd-os-backup-${new Date().toISOString().slice(0, 10)}.json`,
      pickAppData(data),
    );
    setMessage("Backup downloaded.");
  };

  const saveToProject = async () => {
    setMessage("Saving…");
    try {
      const res = await fetch("/api/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pickAppData(data)),
      });
      if (!res.ok) throw new Error("failed");
      const json = (await res.json()) as { persisted?: boolean; message?: string };
      if (json.persisted === false) {
        setMessage(
          json.message ??
            "Hosted deploy: data stays in this browser. Download a backup JSON for safekeeping.",
        );
      } else {
        setMessage("Saved to data/user-data.json in your project folder.");
      }
    } catch {
      setMessage("Could not save to project folder. Is the server running?");
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
      await fetch("/api/data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      setMessage("Imported backup and saved to project folder.");
    } catch {
      setMessage("Import failed — check that the file is valid JSON.");
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Personal preferences for this self-hosted copy"
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
        title="Data persistence"
        description="Edits auto-save in two places while the app is running"
      >
        <Panel className="space-y-4 p-4">
          <div className="text-[13px] leading-relaxed text-ink-secondary">
            <ol className="list-decimal space-y-2 pl-4">
              <li>
                <strong className="font-medium text-ink">Browser</strong> —{" "}
                <code className="font-mono text-[12px]">localStorage</code> key{" "}
                <code className="font-mono text-[12px]">phd-os-data</code> (survives
                refresh; lost if you clear site data).
              </li>
              <li>
                <strong className="font-medium text-ink">Project folder</strong> —{" "}
                <code className="font-mono text-[12px]">data/user-data.json</code>{" "}
                (auto-saved when you edit; survives browser clears; can be backed up
                or committed).
              </li>
            </ol>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="primary" onClick={saveToProject}>
              Save to project now
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
          <p className="mt-2 text-ink-muted">
            V1 focuses on information architecture and workflow. No AI, no Gmail sync,
            no multi-user collaboration.
          </p>
        </Panel>
      </Section>

      <Dialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset all data?"
        description="This replaces browser + project data with the demo 2026–27 seed."
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
                /* ignore — browser seed still applied */
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
