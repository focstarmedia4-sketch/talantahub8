import { createClient } from "@supabase/supabase-js";

// ============================================================================
// PLEASE PASTE YOUR SUPABASE CREDENTIALS HERE
// Replace the placeholder values with your actual Supabase URL and Anon/Public Key.
// ============================================================================
const SUPABASE_URL = "https://ppncmiuqtqtlemhkkzrk.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_8hJ6svy_GgTK6dfnPDnXhw_tXzhBXOI";

// Create and export the Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
