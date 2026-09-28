import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import type { Session } from "@supabase/supabase-js";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { registerForPushNotifications } from "../utils/pushNotifications";

WebBrowser.maybeCompleteAuthSession();

export interface Household {
  id: string;
  name: string | null;
  inviteCode: string;
}

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  household: Household | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  createHousehold: (name?: string) => Promise<void>;
  joinHousehold: (code: string) => Promise<void>;
  refreshHousehold: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHousehold = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("household_members")
      .select("household_id, households(id, name, invite_code)")
      .eq("user_id", userId)
      .limit(1);

    if (error) {
      console.warn("Failed to load household", error);
      setHousehold(null);
      return;
    }
    const row = data?.[0] as
      | { households: { id: string; name: string | null; invite_code: string } | { id: string; name: string | null; invite_code: string }[] }
      | undefined;
    const hh = row?.households ? (Array.isArray(row.households) ? row.households[0] : row.households) : undefined;
    if (hh) {
      setHousehold({ id: hh.id, name: hh.name, inviteCode: hh.invite_code });
    } else {
      setHousehold(null);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        fetchHousehold(data.session.user.id);
        registerForPushNotifications(data.session.user.id);
      }
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) {
        fetchHousehold(nextSession.user.id);
        registerForPushNotifications(nextSession.user.id);
      } else {
        setHousehold(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [fetchHousehold]);

  const signInWithGoogle = useCallback(async () => {
    const redirectTo = Linking.createURL("auth-callback");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error) throw error;
    if (!data?.url) throw new Error("Keine Anmelde-URL erhalten.");

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== "success" || !result.url) {
      throw new Error("Anmeldung abgebrochen.");
    }

    const fragment = result.url.split("#")[1] ?? result.url.split("?")[1] ?? "";
    const params = new URLSearchParams(fragment);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (!access_token || !refresh_token) {
      throw new Error("Anmeldung fehlgeschlagen - keine Sitzung erhalten.");
    }
    const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
    if (sessionError) throw sessionError;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setHousehold(null);
  }, []);

  const createHousehold = useCallback(
    async (name?: string) => {
      const { data, error } = await supabase.rpc("create_household", { household_name: name ?? null });
      if (error) throw error;
      const row = data?.[0] as { id: string; invite_code: string } | undefined;
      if (row && session) {
        setHousehold({ id: row.id, name: name ?? null, inviteCode: row.invite_code });
      }
    },
    [session]
  );

  const joinHousehold = useCallback(
    async (code: string) => {
      const { data, error } = await supabase.rpc("join_household", { code });
      if (error) throw error;
      const row = data?.[0] as { id: string; name: string | null } | undefined;
      if (row && session) {
        await fetchHousehold(session.user.id);
      }
    },
    [session, fetchHousehold]
  );

  const refreshHousehold = useCallback(async () => {
    if (session) await fetchHousehold(session.user.id);
  }, [session, fetchHousehold]);

  const value = useMemo(
    () => ({
      configured: isSupabaseConfigured,
      loading,
      session,
      household,
      signInWithGoogle,
      signOut,
      createHousehold,
      joinHousehold,
      refreshHousehold,
    }),
    [loading, session, household, signInWithGoogle, signOut, createHousehold, joinHousehold, refreshHousehold]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
