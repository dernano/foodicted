import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RootStackScreenProps } from "../navigation";
import { APP_FEATURES } from "../constants/features";
import { colors, radius, shadow, spacing, type as t } from "../constants/theme";

export const ONBOARDING_SEEN_KEY = "foodicted.onboardingSeen";

type Props = RootStackScreenProps<"Onboarding">;

export default function OnboardingScreen({ navigation }: Props) {
  async function handleContinue() {
    try {
      await AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "true");
    } catch (err) {
      console.warn("Failed to persist onboarding flag", err);
    }
    navigation.replace("MainTabs", { screen: "Start" });
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Image source={require("../../assets/logo-full.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Willkommen bei Foodicted!</Text>
        <Text style={styles.subtitle}>Das kann die App für dich:</Text>

        {APP_FEATURES.map((f) => (
          <View key={f.title} style={styles.featureRow}>
            <View style={styles.iconCircle}>
              <Ionicons name={f.icon} size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Los geht's</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: spacing.xxl, paddingBottom: spacing.sm, alignItems: "center" },
  logo: { width: 170, height: 130, marginTop: spacing.xl, marginBottom: spacing.sm },
  title: { ...t.title, fontSize: 22, color: colors.textPrimary, textAlign: "center", marginBottom: spacing.xs },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.xxl },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md + 2,
    width: "100%",
    marginBottom: spacing.xl,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: { fontSize: 15, fontWeight: "700", color: colors.textPrimary, marginBottom: 2 },
  featureText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  footer: { padding: spacing.xl, backgroundColor: colors.bg },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.lg,
    alignItems: "center",
    ...shadow.button,
  },
  buttonText: { color: colors.textOnDark, fontSize: 16, fontWeight: "700" },
});
