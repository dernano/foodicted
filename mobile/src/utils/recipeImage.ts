import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { supabase } from "../lib/supabase";

const RECIPE_IMAGES_BUCKET = "recipe-images";

/** Shows a source picker (camera/gallery), requests the needed permission, and
 * returns the local uri of the picked photo - or null if cancelled/denied. */
export async function pickRecipeImage(): Promise<string | null> {
  const source = await new Promise<"camera" | "library" | null>((resolve) => {
    Alert.alert("Foto hinzufügen", "Woher soll das Foto kommen?", [
      { text: "Kamera", onPress: () => resolve("camera") },
      { text: "Galerie", onPress: () => resolve("library") },
      { text: "Abbrechen", style: "cancel", onPress: () => resolve(null) },
    ]);
  });
  if (!source) return null;

  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Kein Zugriff", "Foodicted braucht Zugriff auf deine Kamera, um ein Foto aufzunehmen.");
      return null;
    }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.6 });
    return result.canceled ? null : (result.assets[0]?.uri ?? null);
  }

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert("Kein Zugriff", "Foodicted braucht Zugriff auf deine Fotos, um ein Bild auszuwählen.");
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.6,
  });
  return result.canceled ? null : (result.assets[0]?.uri ?? null);
}

/** Persists a locally-picked photo for a favorite recipe and returns the url
 * to store on it - a public Supabase Storage url when synced to a household
 * (so every member's app can load it), or a locally-persisted file uri
 * otherwise (guest mode, no Supabase account). */
export async function saveRecipeImage(
  localUri: string,
  opts: { recipeId: string; householdId?: string }
): Promise<string> {
  const source = new File(localUri);

  if (opts.householdId) {
    const bytes = await source.bytes();
    const path = `${opts.householdId}/${opts.recipeId}-${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from(RECIPE_IMAGES_BUCKET)
      .upload(path, bytes, { contentType: "image/jpeg", upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from(RECIPE_IMAGES_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  const localDir = new Directory(Paths.document, "recipe-images");
  if (!localDir.exists) localDir.create({ intermediates: true });
  const dest = new File(localDir, `${opts.recipeId}-${Date.now()}.jpg`);
  await source.copy(dest);
  return dest.uri;
}
