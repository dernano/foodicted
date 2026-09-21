import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import type { RootStackParamList } from "../navigation";
import { usePreferences } from "../context/PreferencesContext";
import { DIET_PRESETS, GOAL_PRESETS } from "../types";

type Props = NativeStackScreenProps<RootStackParamList, "Preferences">;

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function PreferencesScreen({ navigation }: Props) {
  const { preferences, updatePreferences } = usePreferences();
  const [allergiesText, setAllergiesText] = useState((preferences.allergies ?? []).join(", "));
  const [dislikedText, setDislikedText] = useState((preferences.dislikedIngredients ?? []).join(", "));
  const [cuisinesText, setCuisinesText] = useState((preferences.cuisines ?? []).join(", "));

  function commitListField(text: string, field: "allergies" | "dislikedIngredients" | "cuisines") {
    const values = text
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    updatePreferences({ [field]: values });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 48 }}>
      <Text style={styles.sectionTitle}>Ziel</Text>
      <View style={styles.chipRow}>
        {GOAL_PRESETS.map((goal) => (
          <Chip
            key={goal}
            label={goal}
            selected={preferences.goal === goal}
            onPress={() => updatePreferences({ goal })}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Ernährungsstil</Text>
      <View style={styles.chipRow}>
        {DIET_PRESETS.map((diet) => (
          <Chip key={diet} label={diet} selected={preferences.diet === diet} onPress={() => updatePreferences({ diet })} />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Portionen</Text>
      <View style={styles.stepperRow}>
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={() => updatePreferences({ servings: Math.max(1, (preferences.servings ?? 2) - 1) })}
        >
          <Text style={styles.stepperButtonText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{preferences.servings ?? 2}</Text>
        <TouchableOpacity
          style={styles.stepperButton}
          onPress={() => updatePreferences({ servings: Math.min(12, (preferences.servings ?? 2) + 1) })}
        >
          <Text style={styles.stepperButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Maximale Zubereitungszeit (Minuten)</Text>
      <TextInput
        style={styles.input}
        keyboardType="number-pad"
        placeholder="z. B. 30"
        value={preferences.maxTimeMinutes ? String(preferences.maxTimeMinutes) : ""}
        onChangeText={(t) => updatePreferences({ maxTimeMinutes: t ? Number(t) : undefined })}
      />

      <Text style={styles.sectionTitle}>Allergien / strikt vermeiden</Text>
      <TextInput
        style={styles.input}
        placeholder="z. B. Nüsse, Laktose, Gluten"
        value={allergiesText}
        onChangeText={setAllergiesText}
        onBlur={() => commitListField(allergiesText, "allergies")}
      />

      <Text style={styles.sectionTitle}>Mag ich nicht so gerne</Text>
      <TextInput
        style={styles.input}
        placeholder="z. B. Koriander, Oliven"
        value={dislikedText}
        onChangeText={setDislikedText}
        onBlur={() => commitListField(dislikedText, "dislikedIngredients")}
      />

      <Text style={styles.sectionTitle}>Bevorzugte Küchen</Text>
      <TextInput
        style={styles.input}
        placeholder="z. B. Italienisch, Thailändisch"
        value={cuisinesText}
        onChangeText={setCuisinesText}
        onBlur={() => commitListField(cuisinesText, "cuisines")}
      />

      <Text style={styles.sectionTitle}>Weitere Notizen</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="z. B. mag es scharf, keine Frittierpfanne vorhanden ..."
        value={preferences.notes ?? ""}
        onChangeText={(notes) => updatePreferences({ notes })}
        multiline
      />

      <TouchableOpacity style={styles.doneButton} onPress={() => navigation.goBack()}>
        <Text style={styles.doneButtonText}>Fertig</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1b4332", marginTop: 20, marginBottom: 10 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#c9e6cf",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#f6fbf6",
  },
  chipSelected: { backgroundColor: "#2f9e44", borderColor: "#2f9e44" },
  chipText: { color: "#1b4332", fontSize: 13, fontWeight: "600" },
  chipTextSelected: { color: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#d8e6da",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1b4332",
    backgroundColor: "#fafffb",
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#2f9e44",
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonText: { color: "#fff", fontSize: 22, fontWeight: "700", lineHeight: 24 },
  stepperValue: { fontSize: 18, fontWeight: "700", color: "#1b4332", minWidth: 24, textAlign: "center" },
  doneButton: {
    marginTop: 32,
    backgroundColor: "#2f9e44",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  doneButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
