import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (Constants.expoConfig?.extra?.supabaseUrl as string | undefined) ?? "";
const supabaseAnonKey = (Constants.expoConfig?.extra?.supabaseAnonKey as string | undefined) ?? "";

/** True once a real Supabase project has been configured in app.json. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("DEIN-PROJEKT"));

export const supabase = createClient(supabaseUrl || "https://placeholder.supabase.co", supabaseAnonKey || "placeholder", {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
