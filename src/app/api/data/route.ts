import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import type { AppData } from "@/lib/types";
import { isAppData } from "@/lib/persistence";
import {
  isCloudConfigured,
  isEphemeralHost,
  readCloudData,
  writeCloudData,
} from "@/lib/cloud-store";

export const runtime = "nodejs";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "user-data.json");

async function readFileData(): Promise<AppData | null> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return isAppData(parsed) ? parsed : null;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return null;
    throw err;
  }
}

async function writeFileData(payload: AppData) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(payload, null, 2), "utf8");
}

export async function GET() {
  try {
    if (isCloudConfigured()) {
      const cloud = await readCloudData();
      if (cloud.data) {
        return NextResponse.json({
          exists: true,
          data: cloud.data,
          updatedAt: cloud.updatedAt,
          mode: "cloud",
        });
      }
      // Cloud empty — fall through to file/repo seed once, then client will save up
    }

    const fileData = await readFileData();
    if (fileData) {
      return NextResponse.json({
        exists: true,
        data: fileData,
        updatedAt: new Date().toISOString(),
        mode: isCloudConfigured()
          ? "cloud"
          : isEphemeralHost()
            ? "repo-seed"
            : "file",
      });
    }

    return NextResponse.json({
      exists: false,
      data: null,
      mode: isCloudConfigured()
        ? "cloud"
        : isEphemeralHost()
          ? "browser-only"
          : "file",
    });
  } catch (err) {
    console.error("GET /api/data failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to read data" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    if (!isAppData(body)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (isCloudConfigured()) {
      const updatedAt = await writeCloudData(body);
      // Best-effort local file mirror when not on Vercel
      if (!isEphemeralHost()) {
        try {
          await writeFileData(body);
        } catch {
          /* ignore local mirror errors */
        }
      }
      return NextResponse.json({
        ok: true,
        persisted: true,
        mode: "cloud",
        savedAt: updatedAt,
        message: "Saved to cloud database — available on all your devices.",
      });
    }

    if (isEphemeralHost()) {
      return NextResponse.json({
        ok: true,
        persisted: false,
        mode: "browser-only",
        savedAt: new Date().toISOString(),
        message:
          "Cloud database is not configured yet. Data stays in this browser only. See docs/CLOUD_SETUP.md",
      });
    }

    await writeFileData(body);
    return NextResponse.json({
      ok: true,
      persisted: true,
      mode: "file",
      path: "data/user-data.json",
      savedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("PUT /api/data failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to write data" },
      { status: 500 },
    );
  }
}
