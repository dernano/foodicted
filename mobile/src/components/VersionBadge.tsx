import Constants from "expo-constants";
import * as Updates from "expo-updates";
import React from "react";
import { StyleSheet, Text } from "react-native";

function formatUpdateTime(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/** Small indicator showing the app version and whether an OTA update is live -
 * lives on the About screen, kept out of the main interface to stay out of
 * the way of a premium first impression. */
export default function VersionBadge() {
  const appVersion = Constants.expoConfig?.version ?? "?";
  const label = Updates.isEmbeddedLaunch
    ? "Basis-Build (kein Update geladen)"
    : `Update vom ${formatUpdateTime(Updates.createdAt)}`;

  return (
    <Text style={styles.text}>
      v{appVersion} · {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 11, color: "#8fa89b", fontWeight: "600", textAlign: "center" },
});
