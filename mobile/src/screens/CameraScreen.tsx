import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import type { RootStackParamList } from "../navigation";
import { analyzeFridgePhoto } from "../api/client";
import LoadingLogo from "../components/LoadingLogo";

type Props = NativeStackScreenProps<RootStackParamList, "Camera">;

export default function CameraScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [facing] = useState<"back" | "front">("back");

  async function handleImageBase64(base64: string) {
    setAnalyzing(true);
    try {
      const analysis = await analyzeFridgePhoto(base64);
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

  async function takePhoto() {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });
      if (photo?.base64) {
        await handleImageBase64(photo.base64);
      }
    } catch (err) {
      Alert.alert("Fehler", "Foto konnte nicht aufgenommen werden.");
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
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
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
