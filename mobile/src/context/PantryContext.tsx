import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { FridgeItem } from "../types";

const STORAGE_KEY = "foodicted.pantry";

/** The user's standing "what's currently at home" list - built up via camera scans
 * and manual entry, and used to show which recipe ingredients are already on hand. */
export interface Pantry {
  items: FridgeItem[];
  notes?: string;
  updatedAt: number;
}

interface PantryContextValue {
  pantry: Pantry;
  loaded: boolean;
  updatePantry: (items: FridgeItem[], notes?: string) => void;
}

const EMPTY_PANTRY: Pantry = { items: [], updatedAt: 0 };

const PantryContext = createContext<PantryContextValue | undefined>(undefined);

export function PantryProvider({ children }: { children: React.ReactNode }) {
  const [pantry, setPantry] = useState<Pantry>(EMPTY_PANTRY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setPantry(JSON.parse(raw));
      } catch (err) {
        console.warn("Failed to load pantry", err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const updatePantry = useCallback((items: FridgeItem[], notes?: string) => {
    const next: Pantry = { items, notes, updatedAt: Date.now() };
    setPantry(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((err) =>
      console.warn("Failed to persist pantry", err)
    );
  }, []);

  const value = useMemo(() => ({ pantry, loaded, updatePantry }), [pantry, loaded, updatePantry]);

  return <PantryContext.Provider value={value}>{children}</PantryContext.Provider>;
}

export function usePantry(): PantryContextValue {
  const ctx = useContext(PantryContext);
  if (!ctx) throw new Error("usePantry must be used within a PantryProvider");
  return ctx;
}
