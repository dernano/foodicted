import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { updateCommunityRecipe } from "../api/community";
import { isRemoteUrl, saveCommunityRecipeImage } from "../utils/recipeImage";
import { useAuth } from "./AuthContext";
import type { FavoriteRecipe, Recipe } from "../types";

const STORAGE_KEY = "foodicted.favorites";

interface FavoritesContextValue {
  favorites: FavoriteRecipe[];
  loaded: boolean;
  /** False while we don't yet know whether this account belongs to a household - avoids
   * briefly showing (or writing to) the local-only favorites before the shared ones are confirmed. */
  ready: boolean;
  /** True when favorites are synced to a shared household instead of only stored on this device. */
  shared: boolean;
  isFavorite: (recipe: Recipe) => boolean;
  /** Returns the created favorite (with its real id) when adding, or null when removing/on failure. */
  toggleFavorite: (recipe: Recipe) => Promise<FavoriteRecipe | null>;
  removeFavorite: (id: string) => Promise<void>;
  updateFavorite: (id: string, recipe: Recipe) => Promise<void>;
  /** Remembers that this favorite was published as a Community recipe, so
   * future updateFavorite calls also push the change to that post. */
  linkFavoriteToCommunity: (id: string, communityRecipeId: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function sameRecipe(a: { title: string }, b: { title: string }): boolean {
  return a.title.trim().toLowerCase() === b.title.trim().toLowerCase();
}

/** Shape of a row in the Supabase `favorite_recipes` table. */
interface FavoriteRow {
  id: string;
  title: string;
  description: string;
  category: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  difficulty: string;
  tags: string[];
  ingredients: { name: string; amount: string; fromFridge: boolean }[];
  missing_ingredients: string[];
  instructions: string[];
  nutrition: { calories: number; proteinGrams: number; carbsGrams: number; fatGrams: number };
  image_url: string | null;
  required_equipment: string[] | null;
  community_recipe_id: string | null;
  created_at: string;
}

function rowToFavorite(row: FavoriteRow): FavoriteRecipe {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: (row.category as Recipe["category"]) || "sonstiges",
    prepTimeMinutes: row.prep_time_minutes,
    cookTimeMinutes: row.cook_time_minutes,
    servings: row.servings,
    difficulty: (row.difficulty as Recipe["difficulty"]) || "medium",
    tags: row.tags ?? [],
    ingredients: row.ingredients ?? [],
    missingIngredients: row.missing_ingredients ?? [],
    instructions: row.instructions ?? [],
    nutrition: row.nutrition ?? { calories: 0, proteinGrams: 0, carbsGrams: 0, fatGrams: 0 },
    imageUrl: row.image_url ?? undefined,
    requiredEquipment: row.required_equipment ?? [],
    communityRecipeId: row.community_recipe_id ?? undefined,
    savedAt: new Date(row.created_at).getTime(),
  };
}

function favoriteToRow(recipe: Recipe, householdId: string, userId: string | undefined) {
  return {
    household_id: householdId,
    added_by: userId ?? null,
    ...favoriteToUpdateRow(recipe),
  };
}

/** Editable fields only - used both for inserts (spread into favoriteToRow) and updates. */
function favoriteToUpdateRow(recipe: Recipe) {
  return {
    title: recipe.title,
    description: recipe.description,
    category: recipe.category,
    prep_time_minutes: recipe.prepTimeMinutes,
    cook_time_minutes: recipe.cookTimeMinutes,
    servings: recipe.servings,
    difficulty: recipe.difficulty,
    tags: recipe.tags,
    ingredients: recipe.ingredients,
    missing_ingredients: recipe.missingIngredients,
    instructions: recipe.instructions,
    nutrition: recipe.nutrition,
    image_url: recipe.imageUrl ?? null,
    required_equipment: recipe.requiredEquipment,
  };
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { household, session, loading: authLoading } = useAuth();
  const [localFavorites, setLocalFavorites] = useState<FavoriteRecipe[]>([]);
  const [remoteFavorites, setRemoteFavorites] = useState<FavoriteRecipe[]>([]);
  const [loaded, setLoaded] = useState(false);
  const migratedHouseholds = useRef<Set<string>>(new Set());
  const localFavoritesRef = useRef<FavoriteRecipe[]>([]);
  localFavoritesRef.current = localFavorites;

  // Local favorites always load first - they're the guest-mode source of
  // truth, and the seed for a one-time migration into a household.
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setLocalFavorites(JSON.parse(raw));
      } catch (err) {
        console.warn("Failed to load local favorites", err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persistLocal = useCallback((next: FavoriteRecipe[]) => {
    setLocalFavorites(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((err) =>
      console.warn("Failed to persist local favorites", err)
    );
  }, []);

  // Once a household is available: load its shared favorites, migrate any
  // local-only ones into it the first time, and keep listening for live
  // changes from other household members.
  useEffect(() => {
    if (!household) {
      setRemoteFavorites([]);
      return;
    }

    let cancelled = false;

    async function loadAndMigrate() {
      const { data, error } = await supabase
        .from("favorite_recipes")
        .select("*")
        .eq("household_id", household!.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Failed to load household favorites", error);
        return;
      }
      if (cancelled) return;
      const rows = (data ?? []) as FavoriteRow[];
      setRemoteFavorites(rows.map(rowToFavorite));

      if (!migratedHouseholds.current.has(household!.id) && localFavoritesRef.current.length) {
        migratedHouseholds.current.add(household!.id);
        const existingTitles = new Set(rows.map((r) => r.title.trim().toLowerCase()));
        const toUpload = localFavoritesRef.current.filter((f) => !existingTitles.has(f.title.trim().toLowerCase()));
        if (toUpload.length) {
          const inserted = await supabase
            .from("favorite_recipes")
            .insert(toUpload.map((f) => favoriteToRow(f, household!.id, session?.user.id)))
            .select("*");
          if (!inserted.error && inserted.data && !cancelled) {
            const migratedRows = inserted.data as FavoriteRow[];
            setRemoteFavorites((prev) => [...migratedRows.map(rowToFavorite), ...prev]);
          }
        }
      }
    }

    loadAndMigrate();

    const channel = supabase
      .channel(`favorites-${household.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "favorite_recipes", filter: `household_id=eq.${household.id}` },
        () => loadAndMigrate()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [household?.id, session?.user.id]);

  const shared = !!household;
  const favorites = shared ? remoteFavorites : localFavorites;
  const ready = loaded && !authLoading;

  const isFavorite = useCallback((recipe: Recipe) => favorites.some((f) => sameRecipe(f, recipe)), [favorites]);

  const toggleFavorite = useCallback(
    async (recipe: Recipe): Promise<FavoriteRecipe | null> => {
      if (shared && household) {
        const existing = remoteFavorites.find((f) => sameRecipe(f, recipe));
        if (existing) {
          await supabase.from("favorite_recipes").delete().eq("id", existing.id);
          setRemoteFavorites((prev) => prev.filter((f) => f.id !== existing.id));
          return null;
        }
        const { data, error } = await supabase
          .from("favorite_recipes")
          .insert(favoriteToRow(recipe, household.id, session?.user.id))
          .select("*")
          .single();
        if (!error && data) {
          const favorite = rowToFavorite(data as FavoriteRow);
          setRemoteFavorites((prev) => [favorite, ...prev]);
          return favorite;
        }
        if (error) console.warn("Failed to save shared favorite", error);
        return null;
      }

      if (isFavorite(recipe)) {
        persistLocal(localFavorites.filter((f) => !sameRecipe(f, recipe)));
        return null;
      }
      const favorite: FavoriteRecipe = { ...recipe, id: makeId(), savedAt: Date.now() };
      persistLocal([favorite, ...localFavorites]);
      return favorite;
    },
    [shared, household, remoteFavorites, isFavorite, localFavorites, persistLocal, session]
  );

  /** Best-effort, non-blocking - a favorite update should never fail just
   * because the linked Community post couldn't be reached/isn't owned by
   * this user (anymore). */
  async function syncToCommunity(communityRecipeId: string | undefined, recipe: Recipe) {
    if (!communityRecipeId) return;
    try {
      let imageUrl = recipe.imageUrl;
      // A local-only favorite's photo lives purely on this device (never
      // uploaded anywhere) - the Community post needs an actually
      // reachable url, since every user has to be able to load it.
      if (imageUrl && !isRemoteUrl(imageUrl) && session?.user.id) {
        imageUrl = await saveCommunityRecipeImage(imageUrl, { recipeId: communityRecipeId, authorId: session.user.id });
      }
      await updateCommunityRecipe(communityRecipeId, { ...recipe, imageUrl });
    } catch (err) {
      console.warn("Failed to sync favorite update to its Community post", err);
    }
  }

  const updateFavorite = useCallback(
    async (id: string, recipe: Recipe) => {
      if (shared) {
        const { data, error } = await supabase
          .from("favorite_recipes")
          .update(favoriteToUpdateRow(recipe))
          .eq("id", id)
          .select("*")
          .single();
        if (error) {
          console.warn("Failed to update shared favorite", error);
          throw error;
        }
        if (data) {
          const updated = rowToFavorite(data as FavoriteRow);
          setRemoteFavorites((prev) => prev.map((f) => (f.id === id ? updated : f)));
          syncToCommunity(updated.communityRecipeId, recipe);
        }
        return;
      }
      const existing = localFavorites.find((f) => f.id === id);
      persistLocal(
        localFavorites.map((f) =>
          f.id === id ? { ...recipe, id: f.id, savedAt: f.savedAt, communityRecipeId: f.communityRecipeId } : f
        )
      );
      syncToCommunity(existing?.communityRecipeId, recipe);
    },
    [shared, localFavorites, persistLocal]
  );

  const linkFavoriteToCommunity = useCallback(
    async (id: string, communityRecipeId: string) => {
      if (shared) {
        const { error } = await supabase.from("favorite_recipes").update({ community_recipe_id: communityRecipeId }).eq("id", id);
        if (error) {
          console.warn("Failed to link favorite to community recipe", error);
          return;
        }
        setRemoteFavorites((prev) => prev.map((f) => (f.id === id ? { ...f, communityRecipeId } : f)));
        return;
      }
      persistLocal(localFavorites.map((f) => (f.id === id ? { ...f, communityRecipeId } : f)));
    },
    [shared, localFavorites, persistLocal]
  );

  const removeFavorite = useCallback(
    async (id: string) => {
      if (shared) {
        await supabase.from("favorite_recipes").delete().eq("id", id);
        setRemoteFavorites((prev) => prev.filter((f) => f.id !== id));
        return;
      }
      persistLocal(localFavorites.filter((f) => f.id !== id));
    },
    [shared, localFavorites, persistLocal]
  );

  const value = useMemo(
    () => ({
      favorites,
      loaded,
      ready,
      shared,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      updateFavorite,
      linkFavoriteToCommunity,
    }),
    [favorites, loaded, ready, shared, isFavorite, toggleFavorite, removeFavorite, updateFavorite, linkFavoriteToCommunity]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within a FavoritesProvider");
  return ctx;
}
