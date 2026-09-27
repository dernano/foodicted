import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Alert, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";

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
        <Ionicons name="construct-outline" size={40} color="#c3d6c8" />
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
        <ActivityIndicator color="#2f9e44" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Ionicons name="people-circle-outline" size={56} color="#2f9e44" />
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
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="logo-google" size={18} color="#fff" />
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
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Neuen Haushalt erstellen</Text>}
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
      <Ionicons name="home-outline" size={40} color="#2f9e44" />
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
          <Ionicons name="share-outline" size={16} color="#2f9e44" />
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
  container: { flex: 1, backgroundColor: "#f6fbf6", padding: 24, alignItems: "center", paddingTop: 48 },
  center: { flex: 1, backgroundColor: "#f6fbf6", padding: 32, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "800", color: "#1b4332", marginTop: 14, marginBottom: 8, textAlign: "center" },
  text: { fontSize: 14, color: "#5c7a6a", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  notConfiguredText: { fontSize: 14, color: "#7a8f83", textAlign: "center", lineHeight: 20, marginTop: 14 },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#2f9e44",
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: 14,
    width: "100%",
  },
  primaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  secondaryButton: {
    borderWidth: 1.5,
    borderColor: "#2f9e44",
    paddingVertical: 13,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  secondaryButtonText: { color: "#2f9e44", fontSize: 15, fontWeight: "700" },
  orText: { color: "#9db5a6", fontSize: 13, marginVertical: 14 },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#d8e6da",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: "#fff",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 2,
  },
  plainButton: { marginTop: 24, paddingVertical: 10 },
  plainButtonText: { color: "#c92a2a", fontSize: 14, fontWeight: "600" },
  codeCard: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e6f0e8",
  },
  codeLabel: { fontSize: 12, color: "#7a8f83", marginBottom: 6 },
  codeValue: { fontSize: 28, fontWeight: "800", color: "#1b4332", letterSpacing: 4, marginBottom: 14 },
  shareButton: { flexDirection: "row", alignItems: "center", gap: 6 },
  shareButtonText: { color: "#2f9e44", fontSize: 13, fontWeight: "700" },
});
