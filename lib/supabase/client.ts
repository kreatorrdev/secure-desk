"use client";
import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseConfig } from "./config";

export function createClient() {
  const { url, publishableKey, cookieOptions } = getSupabaseConfig();
  return createBrowserClient(url, publishableKey, { cookieOptions });
}
