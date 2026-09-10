import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import type { AppData } from "@/lib/types";

export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "user-data.json");

/** Vercel/serverless has an ephemeral filesystem — file persistence won't stick. */
function isEphemeralHost() {
  return Boolean(process.env.VERCEL || process.env.PHD_OS_BROWSER_ONLY === "1");
}

function isAppData(value: unknown): value is AppData {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.applications) &&
    Array.isArray(v.professors) &&
    Array.isArray(v.tasks) &&
    v.settings !== undefined &&
    typeof v.settings === "object"
  );
}

export async function GET() {
  if (isEphemeralHost()) {
    return NextResponse.json({
      exists: false,
      data: null,
      mode: "browser-only",
    });
  }

  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!isAppData(parsed)) {
      return NextResponse.json(
        { error: "Invalid data file shape" },
        { status: 422 },
      );
    }
    return NextResponse.json({
      exists: true,
      updatedAt: new Date().toISOString(),
      data: parsed,
      mode: "file",
    });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") {
      return NextResponse.json({ exists: false, data: null, mode: "file" });
    }
    console.error("Failed to read user data", err);
    return NextResponse.json({ error: "Failed to read data" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    if (!isAppData(body)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (isEphemeralHost()) {
      return NextResponse.json({
        ok: true,
        persisted: false,
        mode: "browser-only",
        savedAt: new Date().toISOString(),
        message:
          "Hosted deploy uses browser localStorage only. Download a backup from Settings for safekeeping.",
      });
    }

    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(DATA_FILE, JSON.stringify(body, null, 2), "utf8");
    return NextResponse.json({
      ok: true,
      persisted: true,
      mode: "file",
      path: "data/user-data.json",
      savedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Failed to write user data", err);
    return NextResponse.json({ error: "Failed to write data" }, { status: 500 });
  }
}
