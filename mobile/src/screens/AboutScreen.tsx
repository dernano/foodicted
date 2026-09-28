import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { APP_FEATURES } from "../constants/features";
import { colors, radius, shadow, spacing, type as t } from "../constants/theme";

export default function AboutScreen() {
  const version = Constants.expoConfig?.version ?? "?";

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.xxl, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Image source={require("../../assets/logo-full.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.slogan}>Erst scannen, dann schlemmen.</Text>
      </View>

      <Text style={styles.sectionTitle}>Das kann die App</Text>
      {APP_FEATURES.map((f) => (
        <View key={f.title} style={styles.featureRow}>
          <View style={styles.iconCircle}>
            <Ionicons name={f.icon} size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        </View>
      ))}

      <View style={styles.devCard}>
        <Ionicons name="person-circle-outline" size={36} color={colors.primary} />
        <Text style={styles.devTitle}>Mario Stöffler</Text>
        <Text style={styles.devText}>
          Foodicted wird von mir entwickelt und laufend weiter ausgebaut. Feedback und Ideen sind jederzeit
          willkommen.
        </Text>
      </View>

      <Text style={styles.version}>Version {version}</Text>
      <Text style={styles.copyright}>© {new Date().getFullYear()} Mario Stöffler</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { alignItems: "center", marginBottom: spacing.xxl + 4 },
  logo: { width: 160, height: 120 },
  slogan: { fontSize: 13, color: colors.primary, fontWeight: "700", marginTop: spacing.xs },
  sectionTitle: { ...t.section, fontSize: 15, color: colors.textPrimary, marginBottom: spacing.lg },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md + 2, marginBottom: spacing.lg + 2 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: { fontSize: 14, fontWeight: "700", color: colors.textPrimary, marginBottom: 2 },
  featureText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  devCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    ...shadow.soft,
  },
  devTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginTop: spacing.sm, marginBottom: spacing.xs + 2 },
  devText: { fontSize: 13, color: colors.textSecondary, textAlign: "center", lineHeight: 18 },
  version: { fontSize: 12, color: colors.textMuted, textAlign: "center", marginTop: spacing.xs },
  copyright: { fontSize: 12, color: colors.textMuted, textAlign: "center", marginTop: spacing.xs },
});
