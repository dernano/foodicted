import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import { notifyHouseholdMembers } from "../utils/pushNotifications";
import type { ShoppingListItem } from "../types";

const STORAGE_KEY = "foodicted.shoppingList";

interface ShoppingListContextValue {
  items: ShoppingListItem[];
  loaded: boolean;
  /** False while we don't yet know whether this account belongs to a household - avoids
   * briefly showing (or writing to) the local-only list before the shared one is confirmed. */
  ready: boolean;
  shared: boolean;
  addItem: (text: string, source?: string) => Promise<void>;
  addItems: (texts: string[], source?: string) => Promise<void>;
  toggleChecked: (id: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearChecked: () => Promise<void>;
}

const ShoppingListContext = createContext<ShoppingListContextValue | undefined>(undefined);

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

interface ShoppingRow {
  id: string;
  text: string;
  checked: boolean;
  source: string | null;
  created_at: string;
}

function rowToItem(row: ShoppingRow): ShoppingListItem {
  return {
    id: row.id,
    text: row.text,
    checked: row.checked,
    addedAt: new Date(row.created_at).getTime(),
    source: row.source ?? undefined,
  };
}

export function ShoppingListProvider({ children }: { children: React.ReactNode }) {
  const { household, session, loading: authLoading } = useAuth();
  const [localItems, setLocalItems] = useState<ShoppingListItem[]>([]);
  const [remoteItems, setRemoteItems] = useState<ShoppingListItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const migratedHouseholds = useRef<Set<string>>(new Set());
  const localItemsRef = useRef<ShoppingListItem[]>([]);
  localItemsRef.current = localItems;

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setLocalItems(JSON.parse(raw));
      } catch (err) {
        console.warn("Failed to load local shopping list", err);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persistLocal = useCallback((next: ShoppingListItem[]) => {
    setLocalItems(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((err) =>
      console.warn("Failed to persist local shopping list", err)
    );
  }, []);

  useEffect(() => {
    if (!household) {
      setRemoteItems([]);
      return;
    }

    let cancelled = false;

    async function loadAndMigrate() {
      const { data, error } = await supabase
        .from("shopping_list_items")
        .select("*")
        .eq("household_id", household!.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.warn("Failed to load household shopping list", error);
        return;
      }
      if (cancelled) return;
      const rows = (data ?? []) as ShoppingRow[];
      setRemoteItems(rows.map(rowToItem));

      if (!migratedHouseholds.current.has(household!.id) && localItemsRef.current.length) {
        migratedHouseholds.current.add(household!.id);
        const existingTexts = new Set(rows.map((r) => r.text.trim().toLowerCase()));
        const toUpload = localItemsRef.current.filter((i) => !existingTexts.has(i.text.trim().toLowerCase()));
        if (toUpload.length) {
          const inserted = await supabase
            .from("shopping_list_items")
            .insert(
              toUpload.map((i) => ({
                household_id: household!.id,
                added_by: session?.user.id ?? null,
                text: i.text,
                checked: i.checked,
                source: i.source ?? null,
              }))
            )
            .select("*");
          if (!inserted.error && inserted.data && !cancelled) {
            const migratedRows = inserted.data as ShoppingRow[];
            setRemoteItems((prev) => [...prev, ...migratedRows.map(rowToItem)]);
          }
        }
      }
    }

    loadAndMigrate();

    const channel = supabase
      .channel(`shopping-list-${household.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_list_items", filter: `household_id=eq.${household.id}` },
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
  const items = shared ? remoteItems : localItems;
  const ready = loaded && !authLoading;

  const addItems = useCallback(
    async (texts: string[], source?: string) => {
      const clean = texts.map((t) => t.trim()).filter(Boolean);
      if (!clean.length) return;

      if (shared && household) {
        const { data, error } = await supabase
          .from("shopping_list_items")
          .insert(
            clean.map((text) => ({
              household_id: household.id,
              added_by: session?.user.id ?? null,
              text,
              source: source ?? null,
            }))
          )
          .select("*");
        if (!error && data) {
          setRemoteItems((prev) => [...prev, ...(data as ShoppingRow[]).map(rowToItem)]);
          const body = clean.length === 1 ? `„${clean[0]}" wurde hinzugefügt` : `${clean.length} Artikel wurden hinzugefügt`;
          notifyHouseholdMembers(household.id, "🛒 Einkaufsliste", body);
        } else if (error) {
          console.warn("Failed to add shared shopping list items", error);
        }
        return;
      }

      const newItems: ShoppingListItem[] = clean.map((text) => ({
        id: makeId(),
        text,
        checked: false,
        addedAt: Date.now(),
        source,
      }));
      persistLocal([...localItems, ...newItems]);
    },
    [shared, household, localItems, persistLocal, session]
  );

  const addItem = useCallback((text: string, source?: string) => addItems([text], source), [addItems]);

  const toggleChecked = useCallback(
    async (id: string) => {
      if (shared) {
        const current = remoteItems.find((i) => i.id === id);
        if (!current) return;
        const { error } = await supabase.from("shopping_list_items").update({ checked: !current.checked }).eq("id", id);
        if (!error) {
          setRemoteItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
        }
        return;
      }
      persistLocal(localItems.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)));
    },
    [shared, remoteItems, localItems, persistLocal]
  );

  const removeItem = useCallback(
    async (id: string) => {
      if (shared && household) {
        const current = remoteItems.find((i) => i.id === id);
        await supabase.from("shopping_list_items").delete().eq("id", id);
        setRemoteItems((prev) => prev.filter((i) => i.id !== id));
        if (current) notifyHouseholdMembers(household.id, "🛒 Einkaufsliste", `„${current.text}" wurde entfernt`);
        return;
      }
      persistLocal(localItems.filter((i) => i.id !== id));
    },
    [shared, household, remoteItems, localItems, persistLocal]
  );

  const clearChecked = useCallback(async () => {
    if (shared && household) {
      const ids = remoteItems.filter((i) => i.checked).map((i) => i.id);
      if (!ids.length) return;
      await supabase.from("shopping_list_items").delete().in("id", ids);
      setRemoteItems((prev) => prev.filter((i) => !i.checked));
      notifyHouseholdMembers(household.id, "🛒 Einkaufsliste", `${ids.length} erledigte Artikel wurden entfernt`);
      return;
    }
    persistLocal(localItems.filter((i) => !i.checked));
  }, [shared, household, remoteItems, localItems, persistLocal]);

  const value = useMemo(
    () => ({ items, loaded, ready, shared, addItem, addItems, toggleChecked, removeItem, clearChecked }),
    [items, loaded, ready, shared, addItem, addItems, toggleChecked, removeItem, clearChecked]
  );

  return <ShoppingListContext.Provider value={value}>{children}</ShoppingListContext.Provider>;
}

export function useShoppingList(): ShoppingListContextValue {
  const ctx = useContext(ShoppingListContext);
  if (!ctx) throw new Error("useShoppingList must be used within a ShoppingListProvider");
  return ctx;
}
