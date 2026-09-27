import Constants from "expo-constants";
import * as Updates from "expo-updates";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

function formatUpdateTime(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/** Small bottom-left indicator showing the app version and whether an OTA update is live. */
export default function VersionBadge() {
  const appVersion = Constants.expoConfig?.version ?? "?";
  const label = Updates.isEmbeddedLaunch
    ? "Basis-Build (kein Update geladen)"
    : `Update vom ${formatUpdateTime(Updates.createdAt)}`;

  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.text}>
        v{appVersion} · {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "absolute", left: 12, bottom: 6 },
  text: { fontSize: 10, color: "#b7c9bd", fontWeight: "600" },
});
