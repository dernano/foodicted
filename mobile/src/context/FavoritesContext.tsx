import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { FavoriteRecipe, Recipe } from "../types";

const STORAGE_KEY = "foodicted.favorites";

interface FavoritesContextValue {
  favorites: FavoriteRecipe[];
  loaded: boolean;
  isFavorite: (recipe: Recipe) => boolean;
  toggleFavorite: (recipe: Recipe) => void;
  removeFavorite: (id: string) => void;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Two recipes are considered "the same" for favoriting purposes if their title matches. */
function sameRecipe(a: { title: string }, b: { title: string }): boolean {
  return a.title.trim().toLowerCase() === b.title.trim().toLowerCase();
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteRecipe[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setFavorites(JSON.parse(raw));
      } catch (err) {
        console.warn("Failed to load favorites", err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback((next: FavoriteRecipe[]) => {
    setFavorites(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((err) =>
      console.warn("Failed to persist favorites", err)
    );
  }, []);

  const isFavorite = useCallback((recipe: Recipe) => favorites.some((f) => sameRecipe(f, recipe)), [favorites]);

  const toggleFavorite = useCallback(
    (recipe: Recipe) => {
      if (isFavorite(recipe)) {
        persist(favorites.filter((f) => !sameRecipe(f, recipe)));
      } else {
        const favorite: FavoriteRecipe = { ...recipe, id: makeId(), savedAt: Date.now() };
        persist([favorite, ...favorites]);
      }
    },
    [favorites, isFavorite, persist]
  );

  const removeFavorite = useCallback(
    (id: string) => {
      persist(favorites.filter((f) => f.id !== id));
    },
    [favorites, persist]
  );

  const value = useMemo(
    () => ({ favorites, loaded, isFavorite, toggleFavorite, removeFavorite }),
    [favorites, loaded, isFavorite, toggleFavorite, removeFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within a FavoritesProvider");
  return ctx;
}
