import { supabase } from "../lib/supabase";

const FALLBACK_NAME = "Foodicted-Nutzer";

export interface HouseholdMember {
  userId: string;
  displayName: string;
  joinedAt: number;
}

interface MemberRow {
  user_id: string;
  joined_at: string;
}

/** Household members don't have a foreign-key relationship PostgREST can
 * embed to profiles (both independently reference auth.users), so display
 * names are resolved with a second batched query - same pattern as
 * Community's author names. */
export async function fetchHouseholdMembers(householdId: string): Promise<HouseholdMember[]> {
  const { data, error } = await supabase
    .from("household_members")
    .select("user_id, joined_at")
    .eq("household_id", householdId)
    .order("joined_at", { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as MemberRow[];
  if (!rows.length) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in(
      "id",
      rows.map((r) => r.user_id)
    );
  const names = new Map(
    (profiles ?? []).map((p) => [p.id as string, (p.display_name as string | null) || FALLBACK_NAME])
  );

  return rows.map((r) => ({
    userId: r.user_id,
    displayName: names.get(r.user_id) ?? FALLBACK_NAME,
    joinedAt: new Date(r.joined_at).getTime(),
  }));
}
