import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { colors, radius, shadow, spacing, type as t } from "../constants/theme";

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
});
