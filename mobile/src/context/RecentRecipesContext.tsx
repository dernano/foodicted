import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Recipe } from "../types";

const STORAGE_KEY = "foodicted.recentRecipes";
const MAX_RECENT = 8;

interface RecentRecipesContextValue {
  recent: Recipe[];
  loaded: boolean;
  addRecent: (recipe: Recipe) => void;
}

const RecentRecipesContext = createContext<RecentRecipesContextValue | undefined>(undefined);

function sameRecipe(a: { title: string }, b: { title: string }): boolean {
  return a.title.trim().toLowerCase() === b.title.trim().toLowerCase();
}

export function RecentRecipesProvider({ children }: { children: React.ReactNode }) {
  const [recent, setRecent] = useState<Recipe[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setRecent(JSON.parse(raw));
      } catch (err) {
        console.warn("Failed to load recent recipes", err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const addRecent = useCallback((recipe: Recipe) => {
    setRecent((prev) => {
      const next = [recipe, ...prev.filter((r) => !sameRecipe(r, recipe))].slice(0, MAX_RECENT);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((err) =>
        console.warn("Failed to persist recent recipes", err)
      );
      return next;
    });
  }, []);

  const value = useMemo(() => ({ recent, loaded, addRecent }), [recent, loaded, addRecent]);

  return <RecentRecipesContext.Provider value={value}>{children}</RecentRecipesContext.Provider>;
}

export function useRecentRecipes(): RecentRecipesContextValue {
  const ctx = useContext(RecentRecipesContext);
  if (!ctx) throw new Error("useRecentRecipes must be used within a RecentRecipesProvider");
  return ctx;
}
