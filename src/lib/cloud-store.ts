import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AppData } from "./types";
import { isAppData } from "./persistence";

const ROW_ID = "default";
const TABLE = "phd_os_state";

export type StorageMode = "cloud" | "file" | "repo-seed" | "browser-only";

export function isCloudConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function isEphemeralHost(): boolean {
  return Boolean(process.env.VERCEL || process.env.PHD_OS_BROWSER_ONLY === "1");
}

function getAdminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function readCloudData(): Promise<{
  data: AppData | null;
  updatedAt: string | null;
}> {
  const client = getAdminClient();
  if (!client) return { data: null, updatedAt: null };

  const { data, error } = await client
    .from(TABLE)
    .select("data, updated_at")
    .eq("id", ROW_ID)
    .maybeSingle();

  if (error) throw new Error(`Cloud read failed: ${error.message}`);
  if (!data?.data) return { data: null, updatedAt: null };
  if (!isAppData(data.data)) throw new Error("Cloud payload has invalid shape");

  return {
    data: data.data as AppData,
    updatedAt: (data.updated_at as string | null) ?? null,
  };
}

export async function writeCloudData(payload: AppData): Promise<string> {
  const client = getAdminClient();
  if (!client) throw new Error("Cloud is not configured");

  const updatedAt = new Date().toISOString();
  const { error } = await client.from(TABLE).upsert(
    {
      id: ROW_ID,
      data: payload,
      updated_at: updatedAt,
    },
    { onConflict: "id" },
  );

  if (error) throw new Error(`Cloud write failed: ${error.message}`);
  return updatedAt;
}
