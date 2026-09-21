import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { RecipePreferences } from "../types";

const STORAGE_KEY = "foodicted.preferences";

interface PreferencesContextValue {
  preferences: RecipePreferences;
  setPreferences: (next: RecipePreferences) => void;
  updatePreferences: (patch: Partial<RecipePreferences>) => void;
  loaded: boolean;
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

const DEFAULT_PREFERENCES: RecipePreferences = {
  goal: "Gesund & ausgewogen",
  diet: "Keine Einschränkung",
  servings: 2,
  allergies: [],
  dislikedIngredients: [],
  cuisines: [],
};

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferencesState] = useState<RecipePreferences>(DEFAULT_PREFERENCES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          setPreferencesState({ ...DEFAULT_PREFERENCES, ...JSON.parse(raw) });
        }
      } catch (err) {
        console.warn("Failed to load stored preferences", err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback((next: RecipePreferences) => {
    setPreferencesState(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((err) =>
      console.warn("Failed to persist preferences", err)
    );
  }, []);

  const setPreferences = useCallback((next: RecipePreferences) => persist(next), [persist]);

  const updatePreferences = useCallback(
    (patch: Partial<RecipePreferences>) => {
      persist({ ...preferences, ...patch });
    },
    [preferences, persist]
  );

  const value = useMemo(
    () => ({ preferences, setPreferences, updatePreferences, loaded }),
    [preferences, setPreferences, updatePreferences, loaded]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences must be used within a PreferencesProvider");
  return ctx;
}
