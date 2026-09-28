import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RootStackParamList } from "../navigation";
import { analyzeFridgePhoto } from "../api/client";
import LoadingLogo from "../components/LoadingLogo";
import { usePantry } from "../context/PantryContext";
import { mergeFridgeItems } from "../utils/fridgeItems";
import { colors, radius, spacing } from "../constants/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Camera">;

function formatRelativeTime(timestamp: number): string {
  const diffMinutes = Math.round((Date.now() - timestamp) / 60000);
  if (diffMinutes < 1) return "gerade eben";
  if (diffMinutes < 60) return `vor ${diffMinutes} Min.`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `vor ${diffHours} Std.`;
  const diffDays = Math.round(diffHours / 24);
  return `vor ${diffDays} Tag${diffDays === 1 ? "" : "en"}`;
}

export default function CameraScreen({ navigation, route }: Props) {
  const matchRecipe = route.params?.matchRecipe;
  const { pantry, loaded: pantryLoaded, updatePantry } = usePantry();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [facing] = useState<"back" | "front">("back");
  const [torchOn, setTorchOn] = useState(false);

  async function handleImageBase64(base64: string) {
    setAnalyzing(true);
    try {
      const analysis = await analyzeFridgePhoto(base64);
      const mergedItems = mergeFridgeItems(pantry.items, analysis.items);
      updatePantry(mergedItems, analysis.notes ?? pantry.notes);
      if (matchRecipe) {
        navigation.replace("IngredientMatch", { recipe: matchRecipe, detectedItems: analysis.items });
        return;
      }
      navigation.navigate("IngredientsReview", { items: analysis.items, notes: analysis.notes });
    } catch (err) {
      Alert.alert(
        "Analyse fehlgeschlagen",
        err instanceof Error ? err.message : "Unbekannter Fehler beim Analysieren des Fotos."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  function openPantry() {
    navigation.navigate("IngredientsReview", { items: pantry.items, notes: pantry.notes });
  }

  async function takePhoto() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });
      if (photo?.base64) {
        await handleImageBase64(photo.base64);
      }
    } catch (err) {
      Alert.alert("Fehler", "Foto konnte nicht aufgenommen werden.");
    } finally {
      setTorchOn(false);
    }
  }

  async function pickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      base64: true,
      quality: 0.6,
    });
    if (!result.canceled && result.assets[0]?.base64) {
      await handleImageBase64(result.assets[0].base64);
    }
  }

  if (analyzing) {
    return (
      <View style={styles.center}>
        <LoadingLogo size={110} />
        <Text style={styles.loadingText}>Analysiere deinen Vorrat …</Text>
      </View>
    );
  }

  if (!permission) {
    return <View style={styles.center} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <View style={styles.permissionIconCircle}>
          <Ionicons name="camera-outline" size={28} color={colors.primary} />
        </View>
        <Text style={styles.permissionText}>Foodicted braucht Zugriff auf deine Kamera.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission} activeOpacity={0.85}>
          <Text style={styles.primaryButtonText}>Zugriff erlauben</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={pickFromGallery}>
          <Text style={styles.secondaryButtonText}>Stattdessen Foto aus Galerie wählen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} enableTorch={torchOn} />

      {!!matchRecipe && (
        <View style={styles.matchBanner}>
          <Text style={styles.matchBannerText}>
            Fotografiere deinen Vorrat, um zu sehen, was dir für „{matchRecipe.title}" noch fehlt.
          </Text>
        </View>
      )}

      <View style={styles.topBar}>
        {!matchRecipe && pantryLoaded && pantry.items.length ? (
          <TouchableOpacity style={styles.topBarPill} onPress={openPantry}>
            <Ionicons name="time-outline" size={15} color={colors.textOnDark} />
            <Text style={styles.topBarPillText}>Mein Vorrat · {formatRelativeTime(pantry.updatedAt)}</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <TouchableOpacity
          style={[styles.torchButton, torchOn && styles.torchButtonActive]}
          onPress={() => setTorchOn((v) => !v)}
          hitSlop={8}
        >
          <Ionicons name={torchOn ? "flash" : "flash-off"} size={20} color={torchOn ? colors.textPrimary : colors.textOnDark} />
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery} activeOpacity={0.7}>
          <Ionicons name="images-outline" size={20} color={colors.textOnDark} />
          <Text style={styles.galleryButtonText}>Galerie</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shutterButton} onPress={takePhoto} activeOpacity={0.85}>
          <View style={styles.shutterInner} />
        </TouchableOpacity>
        <View style={styles.galleryButton} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  topBar: {
    position: "absolute",
    top: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topBarPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md + 2,
  },
  topBarPillText: { color: colors.textOnDark, fontSize: 12, fontWeight: "700" },
  matchBanner: {
    position: "absolute",
    top: 64,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: radius.control,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md + 2,
  },
  matchBannerText: { color: colors.textOnDark, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  torchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  torchButtonActive: { backgroundColor: colors.textOnDark },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxl + 4,
    backgroundColor: "#000",
  },
  shutterButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: colors.textOnDark,
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.textOnDark },
  galleryButton: { width: 70, alignItems: "center", gap: 4 },
  galleryButtonText: { color: colors.textOnDark, fontSize: 12, fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxl, backgroundColor: colors.bg },
  permissionIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.bgAlt,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  loadingText: { marginTop: spacing.lg, fontSize: 15, color: colors.textSecondary },
  permissionText: { fontSize: 16, textAlign: "center", marginBottom: spacing.xl, color: colors.textPrimary },
  primaryButton: { backgroundColor: colors.primary, paddingVertical: spacing.md + 2, paddingHorizontal: spacing.xxl, borderRadius: radius.button, marginBottom: spacing.md },
  primaryButtonText: { color: colors.textOnDark, fontWeight: "700", fontSize: 15 },
  secondaryButton: { paddingVertical: spacing.sm + 2 },
  secondaryButtonText: { color: colors.primary, fontSize: 14 },
});
