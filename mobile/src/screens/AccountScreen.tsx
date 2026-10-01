import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Share, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { fetchProfileVisibility, setProfilePublic } from "../api/community";
import { fetchHouseholdMembers, type HouseholdMember } from "../api/household";
import { useAuth } from "../context/AuthContext";
import { colors, radius, shadow, spacing, type as t } from "../constants/theme";

/** Toggles whether this user's Community profile page (the "all recipes by
 * this author" list reachable by tapping their name) can be viewed by other
 * people. Recipes themselves stay public in the main Community feed either
 * way - this only controls the aggregated-by-author page. */
function CommunityVisibilityToggle({ userId }: { userId: string }) {
  const [isPublic, setIsPublic] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchProfileVisibility(userId).then((p) => setIsPublic(p.isPublic));
  }, [userId]);

  async function toggle(next: boolean) {
    setIsPublic(next);
    setBusy(true);
    try {
      await setProfilePublic(userId, next);
    } catch (err) {
      setIsPublic(!next);
      Alert.alert("Fehler", "Einstellung konnte nicht gespeichert werden.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.visibilityCard}>
      <View style={{ flex: 1 }}>
        <Text style={styles.visibilityTitle}>Community-Profil öffentlich</Text>
        <Text style={styles.visibilityText}>
          Andere können dein Profil mit all deinen veröffentlichten Community-Rezepten ansehen.
        </Text>
      </View>
      {isPublic === null ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Switch
          value={isPublic}
          onValueChange={toggle}
          disabled={busy}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      )}
    </View>
  );
}

/** Shows everyone currently in this household, with display names resolved
 * from their Community profile - lets you see at a glance who has joined. */
function HouseholdMembersList({ householdId, currentUserId }: { householdId: string; currentUserId: string }) {
  const [members, setMembers] = useState<HouseholdMember[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchHouseholdMembers(householdId)
      .then((m) => {
        if (!cancelled) setMembers(m);
      })
      .catch((err) => {
        console.warn("Failed to load household members", err);
        if (!cancelled) setMembers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [householdId]);

  return (
    <View style={styles.membersCard}>
      <Text style={styles.membersTitle}>Mitglieder{members ? ` (${members.length})` : ""}</Text>
      {members === null ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />
      ) : (
        members.map((m) => (
          <View key={m.userId} style={styles.memberRow}>
            <Ionicons name="person-circle-outline" size={18} color={colors.textMuted} />
            <Text style={styles.memberName}>
              {m.displayName}
              {m.userId === currentUserId ? " (Du)" : ""}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

export default function AccountScreen() {
  const { configured, loading, session, household, signInWithGoogle, signOut, createHousehold, joinHousehold } =
    useAuth();
  const [busy, setBusy] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  async function handle(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (err) {
      Alert.alert("Fehler", err instanceof Error ? err.message : "Unbekannter Fehler.");
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <View style={styles.center}>
        <Ionicons name="construct-outline" size={40} color={colors.border} />
        <Text style={styles.notConfiguredText}>
          Konto-Funktion ist noch nicht eingerichtet. Sobald Supabase konfiguriert ist, kannst du dich hier mit
          Google anmelden und einen gemeinsamen Haushalt einrichten.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Ionicons name="people-circle-outline" size={56} color={colors.primary} />
        <Text style={styles.title}>Gemeinsam als Haushalt</Text>
        <Text style={styles.text}>
          Melde dich an, um Lieblingsrezepte mit deinem Haushalt zu teilen - jeder sieht dieselbe Liste, live
          synchron.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => handle(signInWithGoogle)}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.textOnDark} />
          ) : (
            <>
              <Ionicons name="logo-google" size={18} color={colors.textOnDark} />
              <Text style={styles.primaryButtonText}>Mit Google anmelden</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  if (!household) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Haushalt einrichten</Text>
        <Text style={styles.text}>
          Erstelle einen neuen Haushalt oder tritt einem bestehenden mit einem Einladungscode bei.
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={() => handle(() => createHousehold())} disabled={busy}>
          {busy ? <ActivityIndicator color={colors.textOnDark} /> : <Text style={styles.primaryButtonText}>Neuen Haushalt erstellen</Text>}
        </TouchableOpacity>

        <Text style={styles.orText}>oder</Text>

        <TextInput
          style={styles.input}
          placeholder="Einladungscode eingeben"
          autoCapitalize="characters"
          value={joinCode}
          onChangeText={setJoinCode}
        />
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => handle(() => joinHousehold(joinCode))}
          disabled={busy || !joinCode.trim()}
        >
          <Text style={styles.secondaryButtonText}>Haushalt beitreten</Text>
        </TouchableOpacity>

        <CommunityVisibilityToggle userId={session.user.id} />

        <TouchableOpacity style={styles.plainButton} onPress={() => handle(signOut)}>
          <Text style={styles.plainButtonText}>Abmelden</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Ionicons name="home-outline" size={40} color={colors.primary} />
      <Text style={styles.title}>{household.name || "Dein Haushalt"}</Text>
      <Text style={styles.text}>
        Angemeldet als {session.user.email}. Lieblingsrezepte werden jetzt mit deinem Haushalt geteilt.
      </Text>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Einladungscode</Text>
        <Text style={styles.codeValue}>{household.inviteCode}</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() =>
            Share.share({
              message: `Tritt meinem Foodicted-Haushalt bei! Code: ${household.inviteCode}`,
            })
          }
        >
          <Ionicons name="share-outline" size={16} color={colors.primary} />
          <Text style={styles.shareButtonText}>Code teilen</Text>
        </TouchableOpacity>
      </View>

      <HouseholdMembersList householdId={household.id} currentUserId={session.user.id} />

      <CommunityVisibilityToggle userId={session.user.id} />

      <TouchableOpacity style={styles.plainButton} onPress={() => handle(signOut)}>
        <Text style={styles.plainButtonText}>Abmelden</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: spacing.xxl, alignItems: "center", paddingTop: 48 },
  center: { flex: 1, backgroundColor: colors.bg, padding: spacing.xxxl, alignItems: "center", justifyContent: "center" },
  title: { ...t.title, fontSize: 20, color: colors.textPrimary, marginTop: spacing.md + 2, marginBottom: spacing.sm, textAlign: "center" },
  text: { fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20, marginBottom: spacing.xxl },
  notConfiguredText: { fontSize: 14, color: colors.textMuted, textAlign: "center", lineHeight: 20, marginTop: spacing.md + 2 },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm + 2,
    backgroundColor: colors.primary,
    paddingVertical: 15,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.button,
    width: "100%",
    ...shadow.button,
  },
  primaryButtonText: { color: colors.textOnDark, fontSize: 15, fontWeight: "700" },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingVertical: spacing.md + 1,
    borderRadius: radius.button,
    width: "100%",
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  secondaryButtonText: { color: colors.primary, fontSize: 15, fontWeight: "700" },
  orText: { color: colors.textMuted, fontSize: 13, marginVertical: spacing.md + 2 },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md + 2,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
    textAlign: "center",
    letterSpacing: 2,
  },
  plainButton: { marginTop: spacing.xxl, paddingVertical: spacing.sm + 2 },
  plainButtonText: { color: colors.danger, fontSize: 14, fontWeight: "600" },
  visibilityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginTop: spacing.xl,
    ...shadow.soft,
  },
  visibilityTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginBottom: 2 },
  visibilityText: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  codeCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: "center",
    ...shadow.soft,
  },
  codeLabel: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.xs + 2 },
  codeValue: { fontSize: 28, fontWeight: "800", color: colors.textPrimary, letterSpacing: 4, marginBottom: spacing.md + 2 },
  shareButton: { flexDirection: "row", alignItems: "center", gap: 6 },
  shareButtonText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  membersCard: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginTop: spacing.xl,
    ...shadow.soft,
  },
  membersTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginBottom: spacing.sm },
  memberRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 4 },
  memberName: { fontSize: 13, color: colors.textSecondary },
});
