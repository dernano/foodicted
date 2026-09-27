import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RootStackParamList } from "../navigation";
import { analyzeFridgePhoto } from "../api/client";
import LoadingLogo from "../components/LoadingLogo";
import type { FridgeItem } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Camera">;

const LAST_SCAN_KEY = "foodicted.lastScan";

interface LastScan {
  items: FridgeItem[];
  notes?: string;
  scannedAt: number;
}

function formatRelativeTime(timestamp: number): string {
  const diffMinutes = Math.round((Date.now() - timestamp) / 60000);
  if (diffMinutes < 1) return "gerade eben";
  if (diffMinutes < 60) return `vor ${diffMinutes} Min.`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `vor ${diffHours} Std.`;
  const diffDays = Math.round(diffHours / 24);
  return `vor ${diffDays} Tag${diffDays === 1 ? "" : "en"}`;
}

export default function CameraScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [facing] = useState<"back" | "front">("back");
  const [torchOn, setTorchOn] = useState(false);
  const [lastScan, setLastScan] = useState<LastScan | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(LAST_SCAN_KEY)
      .then((raw) => {
        if (raw) setLastScan(JSON.parse(raw) as LastScan);
      })
      .catch(() => {});
  }, []);

  async function handleImageBase64(base64: string) {
    setAnalyzing(true);
    try {
      const analysis = await analyzeFridgePhoto(base64);
      const scan: LastScan = { items: analysis.items, notes: analysis.notes, scannedAt: Date.now() };
      AsyncStorage.setItem(LAST_SCAN_KEY, JSON.stringify(scan)).catch(() => {});
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

  function openLastScan() {
    if (!lastScan) return;
    navigation.navigate("IngredientsReview", { items: lastScan.items, notes: lastScan.notes });
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
        <Text style={styles.permissionText}>Foodicted braucht Zugriff auf deine Kamera.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
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

      <View style={styles.topBar}>
        {lastScan ? (
          <TouchableOpacity style={styles.topBarPill} onPress={openLastScan}>
            <Ionicons name="time-outline" size={15} color="#fff" />
            <Text style={styles.topBarPillText}>Letzter Scan · {formatRelativeTime(lastScan.scannedAt)}</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        <TouchableOpacity
          style={[styles.torchButton, torchOn && styles.torchButtonActive]}
          onPress={() => setTorchOn((v) => !v)}
          hitSlop={8}
        >
          <Ionicons name={torchOn ? "flash" : "flash-off"} size={20} color={torchOn ? "#1b4332" : "#fff"} />
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
          <Text style={styles.galleryButtonText}>Galerie</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shutterButton} onPress={takePhoto}>
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
    top: 16,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topBarPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  topBarPillText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  torchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  torchButtonActive: { backgroundColor: "#fff" },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 28,
    backgroundColor: "#000",
  },
  shutterButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#fff" },
  galleryButton: { width: 70, alignItems: "center" },
  galleryButtonText: { color: "#fff", fontSize: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#f6fbf6" },
  loadingText: { marginTop: 16, fontSize: 15, color: "#40616b" },
  permissionText: { fontSize: 16, textAlign: "center", marginBottom: 20, color: "#1b4332" },
  primaryButton: { backgroundColor: "#2f9e44", paddingVertical: 14, paddingHorizontal: 28, borderRadius: 12, marginBottom: 12 },
  primaryButtonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  secondaryButton: { paddingVertical: 10 },
  secondaryButtonText: { color: "#2f9e44", fontSize: 14 },
});
