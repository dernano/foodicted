import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { RootStackParamList } from "../navigation";
import { usePreferences } from "../context/PreferencesContext";
import { DIET_PRESETS, GOAL_PRESETS } from "../types";
import { colors, radius, shadow, spacing, type as t } from "../constants/theme";

type Props = NativeStackScreenProps<RootStackParamList, "Preferences">;

function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.chip, selected && styles.chipSelected]} onPress={onPress}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const GOAL_PRESET_SET = new Set<string>(GOAL_PRESETS);
const DIET_PRESET_SET = new Set<string>(DIET_PRESETS);

export default function PreferencesScreen({ navigation }: Props) {
  const { preferences, updatePreferences } = usePreferences();
  const [allergiesText, setAllergiesText] = useState((preferences.allergies ?? []).join(", "));
  const [dislikedText, setDislikedText] = useState((preferences.dislikedIngredients ?? []).join(", "));
  const [cuisinesText, setCuisinesText] = useState((preferences.cuisines ?? []).join(", "));
  const [goalCustomMode, setGoalCustomMode] = useState(
    !!preferences.goal && !GOAL_PRESET_SET.has(preferences.goal)
  );
  const [dietCustomMode, setDietCustomMode] = useState(
    !!preferences.diet && !DIET_PRESET_SET.has(preferences.diet)
  );

  // Commit on every keystroke (not just onBlur) so a preference is never lost if the
  // user navigates away without the field losing focus first.
  function handleListChange(text: string, field: "allergies" | "dislikedIngredients" | "cuisines") {
    if (field === "allergies") setAllergiesText(text);
    else if (field === "dislikedIngredients") setDislikedText(text);
    else setCuisinesText(text);

    const values = text
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    updatePreferences({ [field]: values });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <Section title="Ziel">
          <View style={styles.chipRow}>
            {GOAL_PRESETS.map((goal) => (
              <Chip
                key={goal}
                label={goal}
                selected={!goalCustomMode && preferences.goal === goal}
                onPress={() => {
                  setGoalCustomMode(false);
                  updatePreferences({ goal });
                }}
              />
            ))}
            <Chip label="✏️ Eigenes ..." selected={goalCustomMode} onPress={() => setGoalCustomMode(true)} />
          </View>
          {goalCustomMode && (
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              placeholder="z. B. Muskelaufbau, Darmfreundlich ..."
              value={preferences.goal ?? ""}
              onChangeText={(goal) => updatePreferences({ goal })}
            />
          )}
        </Section>

        <Section title="Ernährungsstil">
          <View style={styles.chipRow}>
            {DIET_PRESETS.map((diet) => (
              <Chip
                key={diet}
                label={diet}
                selected={!dietCustomMode && preferences.diet === diet}
                onPress={() => {
                  setDietCustomMode(false);
                  updatePreferences({ diet });
                }}
              />
            ))}
            <Chip label="✏️ Eigenes ..." selected={dietCustomMode} onPress={() => setDietCustomMode(true)} />
          </View>
          {dietCustomMode && (
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              placeholder="z. B. Histaminarm, Paleo ..."
              value={preferences.diet ?? ""}
              onChangeText={(diet) => updatePreferences({ diet })}
            />
          )}
        </Section>

        <Section title="Portionen">
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
        </Section>

        <Section title="Anzahl Rezeptvorschläge">
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => updatePreferences({ recipeCount: Math.max(1, (preferences.recipeCount ?? 7) - 1) })}
            >
              <Text style={styles.stepperButtonText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.stepperValue}>{preferences.recipeCount ?? 7}</Text>
            <TouchableOpacity
              style={styles.stepperButton}
              onPress={() => updatePreferences({ recipeCount: Math.min(14, (preferences.recipeCount ?? 7) + 1) })}
            >
              <Text style={styles.stepperButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>
            Ziel-Anzahl (max. 14). Die KI schlägt bewusst weniger vor, wenn keine sinnvolle Vielfalt an guten
            Rezepten möglich ist.
          </Text>
        </Section>

        <Section title="Maximale Zubereitungszeit (Minuten)">
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="z. B. 30"
            value={preferences.maxTimeMinutes ? String(preferences.maxTimeMinutes) : ""}
            onChangeText={(t) => updatePreferences({ maxTimeMinutes: t ? Number(t) : undefined })}
          />
        </Section>

        <Section title="Allergien / strikt vermeiden">
          <TextInput
            style={styles.input}
            placeholder="z. B. Nüsse, Laktose, Gluten"
            value={allergiesText}
            onChangeText={(t) => handleListChange(t, "allergies")}
          />
        </Section>

        <Section title="Mag ich nicht so gerne">
          <TextInput
            style={styles.input}
            placeholder="z. B. Koriander, Oliven"
            value={dislikedText}
            onChangeText={(t) => handleListChange(t, "dislikedIngredients")}
          />
        </Section>

        <Section title="Bevorzugte Küchen">
          <TextInput
            style={styles.input}
            placeholder="z. B. Italienisch, Thailändisch"
            value={cuisinesText}
            onChangeText={(t) => handleListChange(t, "cuisines")}
          />
        </Section>

        <Section title="Weitere Notizen">
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="z. B. mag es scharf, keine Frittierpfanne vorhanden ..."
            value={preferences.notes ?? ""}
            onChangeText={(notes) => updatePreferences({ notes })}
            multiline
          />
        </Section>

        <TouchableOpacity style={styles.doneButton} onPress={() => navigation.goBack()}>
          <Text style={styles.doneButtonText}>Fertig</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    marginBottom: spacing.md + 2,
    ...shadow.soft,
  },
  sectionTitle: { ...t.bodyStrong, fontSize: 14, color: colors.textPrimary, marginBottom: spacing.md },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md + 2,
    backgroundColor: colors.chipInactiveBg,
  },
  chipSelected: { backgroundColor: colors.primary },
  chipText: { color: colors.chipInactiveText, fontSize: 13, fontWeight: "600" },
  chipTextSelected: { color: colors.textOnDark },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.control,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.bg,
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  stepperRow: { flexDirection: "row", alignItems: "center", gap: spacing.xl },
  stepperButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperButtonText: { color: colors.textOnDark, fontSize: 22, fontWeight: "700", lineHeight: 24 },
  stepperValue: { fontSize: 18, fontWeight: "700", color: colors.textPrimary, minWidth: 24, textAlign: "center" },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: spacing.md, lineHeight: 17 },
  doneButton: {
    marginTop: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    paddingVertical: spacing.lg,
    alignItems: "center",
    ...shadow.button,
  },
  doneButtonText: { color: colors.textOnDark, fontSize: 16, fontWeight: "700" },
});
