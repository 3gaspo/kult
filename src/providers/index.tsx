/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { AuthUser, ContentItem, ContentType, UserSettings, DEFAULT_FORMULA_WEIGHTS } from "../types";
import { IAuthProvider, IDataProvider } from "./types";
import { firebaseReady } from "./firebaseService";
import { LocalAuthProvider, LocalDataProvider } from "./localProvider";
import { FirebaseAuthProvider, FirestoreDataProvider } from "./firebaseProvider";
import { calculateEffectivePriority } from "../utils/formula";

interface IKultContext {
  // Auth
  user: AuthUser | null;
  authLoading: boolean;
  isFirebase: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;

  // Data State
  items: ContentItem[];
  types: ContentType[];
  settings: UserSettings | null;
  dataLoading: boolean;

  // Data Actions
  addItem: (item: Omit<ContentItem, "userId" | "effectivePriority">) => Promise<void>;
  updateItem: (itemId: string, item: Partial<Omit<ContentItem, "userId" | "effectivePriority">>) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  saveType: (type: ContentType) => Promise<void>;
  deleteType: (typeId: string, reassignToId?: string) => Promise<void>;
  saveTypesOrder: (types: ContentType[]) => Promise<void>;
  saveSettings: (settings: UserSettings) => Promise<void>;
  clearHistory: () => Promise<void>;
  resetAllData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const KultContext = createContext<IKultContext | undefined>(undefined);

export const KultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Choose Auth & Data providers once based on environment
  const authProvider = useMemo<IAuthProvider>(() => {
    return firebaseReady ? new FirebaseAuthProvider() : new LocalAuthProvider();
  }, []);

  const dataProvider = useMemo<IDataProvider>(() => {
    return firebaseReady ? new FirestoreDataProvider() : new LocalDataProvider();
  }, []);

  // 2. React states for Auth
  const [user, setUser] = useState<AuthUser | null>(authProvider.user);
  const [authLoading, setAuthLoading] = useState<boolean>(authProvider.loading);

  // 3. React states for Data
  const [items, setItems] = useState<ContentItem[]>([]);
  const [types, setTypes] = useState<ContentType[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [dataLoading, setDataLoading] = useState<boolean>(false);

  // 4. Listen to Auth changes
  useEffect(() => {
    // Initial sync
    setUser(authProvider.user);
    setAuthLoading(authProvider.loading);

    // Subscribe
    const unsub = (authProvider as any).onChange(() => {
      setUser(authProvider.user);
      setAuthLoading(authProvider.loading);
    });

    return () => {
      unsub();
      if (firebaseReady && (authProvider as any).destroy) {
        (authProvider as any).destroy();
      }
    };
  }, [authProvider]);

  // 5. Helper to apply Theme
  const applyTheme = (theme: "light" | "dark") => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // 6. Fetch all data for current user
  const refreshData = async () => {
    if (!user) {
      setItems([]);
      setTypes([]);
      setSettings(null);
      return;
    }

    setDataLoading(true);
    try {
      const fetchedSettings = await dataProvider.getUserSettings(user.uid);
      const fetchedTypes = await dataProvider.getContentTypes(user.uid);
      const fetchedItems = await dataProvider.getContentItems(user.uid);

      // Apply theme
      applyTheme(fetchedSettings.theme);

      // Recompute effective priority for all items to guarantee accuracy
      const normalizedItems = fetchedItems.map((item) => ({
        ...item,
        effectivePriority: calculateEffectivePriority(item, fetchedSettings),
      }));

      setSettings(fetchedSettings);
      setTypes(fetchedTypes);
      setItems(normalizedItems);
    } catch (error) {
      console.error("Error loading Kult data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  // Reload data whenever user changes
  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      setItems([]);
      setTypes([]);
      setSettings(null);
      // Remove dark mode class if user logs out, default to light
      document.documentElement.classList.remove("dark");
    }
  }, [user]);

  // 7. Context actions
  const signIn = async (email: string, password: string) => {
    await authProvider.signIn(email, password);
  };

  const signUp = async (email: string, password: string) => {
    await authProvider.signUp(email, password);
  };

  const signOut = async () => {
    await authProvider.signOut();
  };

  const addItem = async (item: Omit<ContentItem, "userId" | "effectivePriority">) => {
    if (!user || !settings) return;
    const effPriority = calculateEffectivePriority(item, settings);
    const itemWithUser = { ...item, userId: user.uid, effectivePriority: effPriority };
    await dataProvider.addContentItem(user.uid, itemWithUser);
    
    // Optimistic local state update
    setItems((prev) => [...prev, itemWithUser]);
  };

  const updateItem = async (itemId: string, updatedFields: Partial<Omit<ContentItem, "userId" | "effectivePriority">>) => {
    if (!user || !settings) return;
    
    // Find the current item to calculate new effective priority
    const currentItem = items.find((i) => i.id === itemId);
    if (!currentItem) return;

    const merged = { ...currentItem, ...updatedFields };
    const newEffPriority = calculateEffectivePriority(merged, settings);
    
    const finalUpdate = { ...updatedFields, effectivePriority: newEffPriority, updatedAt: new Date().toISOString() };
    await dataProvider.updateContentItem(user.uid, itemId, finalUpdate);

    // Optimistic state update
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, ...finalUpdate } : i))
    );
  };

  const deleteItem = async (itemId: string) => {
    if (!user) return;
    await dataProvider.deleteContentItem(user.uid, itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const saveType = async (type: ContentType) => {
    if (!user) return;
    await dataProvider.saveContentType(user.uid, type);
    setTypes((prev) => {
      const idx = prev.findIndex((t) => t.id === type.id);
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = type;
        return next;
      } else {
        return [...prev, type];
      }
    });
  };

  const deleteType = async (typeId: string, reassignToId?: string) => {
    if (!user) return;
    await dataProvider.deleteContentType(user.uid, typeId, reassignToId);
    setTypes((prev) => prev.filter((t) => t.id !== typeId));
    
    if (reassignToId) {
      const targetType = types.find((t) => t.id === reassignToId);
      const label = targetType?.label || "Other";
      setItems((prev) =>
        prev.map((item) =>
          item.typeId === typeId
            ? { ...item, typeId: reassignToId, typeLabel: label, updatedAt: new Date().toISOString() }
            : item
        )
      );
    }
  };

  const saveTypesOrder = async (reorderedTypes: ContentType[]) => {
    if (!user) return;
    await dataProvider.saveContentTypesOrder(user.uid, reorderedTypes);
    setTypes(reorderedTypes);
  };

  const saveSettings = async (newSettings: UserSettings) => {
    if (!user) return;
    await dataProvider.saveUserSettings(user.uid, newSettings);
    
    // Apply theme immediately
    applyTheme(newSettings.theme);
    
    // Update local state
    setSettings(newSettings);

    // Recompute effective priority for all items because weights might have changed
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        effectivePriority: calculateEffectivePriority(item, newSettings),
      }))
    );
  };

  const clearHistory = async () => {
    if (!user) return;
    await dataProvider.clearHistory(user.uid);
    setItems((prev) => prev.filter((i) => i.status !== "completed"));
  };

  const resetAllData = async () => {
    if (!user) return;
    await dataProvider.resetAllData(user.uid);
    await refreshData();
  };

  return (
    <KultContext.Provider
      value={{
        user,
        authLoading,
        isFirebase: authProvider.isFirebase,
        signIn,
        signUp,
        signOut,
        items,
        types,
        settings,
        dataLoading,
        addItem,
        updateItem,
        deleteItem,
        saveType,
        deleteType,
        saveTypesOrder,
        saveSettings,
        clearHistory,
        resetAllData,
        refreshData,
      }}
    >
      {children}
    </KultContext.Provider>
  );
};

export const useKult = () => {
  const context = useContext(KultContext);
  if (!context) {
    throw new Error("useKult must be used within a KultProvider");
  }
  return context;
};
