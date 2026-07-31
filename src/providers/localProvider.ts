/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthUser, ContentItem, ContentType, UserSettings, DEFAULT_FORMULA_WEIGHTS, DEFAULT_CONTENT_TYPES } from "../types";
import { IAuthProvider, IDataProvider } from "./types";

// Local storage key helper
const KEY_LOCAL_USERS = "kult_local_users"; // simulated registered users {email: pwd, uid}
const KEY_CURRENT_USER = "kult_current_user"; // simulated logged in user AuthUser
const KEY_ITEMS = (uid: string) => `kult_items_${uid}`;
const KEY_TYPES = (uid: string) => `kult_types_${uid}`;
const KEY_SETTINGS = (uid: string) => `kult_settings_${uid}`;

export class LocalAuthProvider implements IAuthProvider {
  user: AuthUser | null = null;
  loading: boolean = true;
  isFirebase: boolean = false;
  private listeners: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    const saved = localStorage.getItem(KEY_CURRENT_USER);
    if (saved) {
      try {
        this.user = JSON.parse(saved);
      } catch (e) {
        this.user = null;
      }
    } else {
      // Auto-initialize a default dev user if none exists
      const devUser = { uid: "dev_user_123", email: "dev@kult.app" };
      this.user = devUser;
      localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(devUser));
      
      // Register this user locally as well
      const users = this.getRegisteredUsers();
      if (!users["dev@kult.app"]) {
        users["dev@kult.app"] = { password: "password", uid: "dev_user_123" };
        localStorage.setItem(KEY_LOCAL_USERS, JSON.stringify(users));
      }
    }
    this.loading = false;
    this.notify();
  }

  private getRegisteredUsers(): Record<string, { password: string; uid: string }> {
    try {
      const data = localStorage.getItem(KEY_LOCAL_USERS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  onChange(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  async signIn(email: string, password: string): Promise<void> {
    const users = this.getRegisteredUsers();
    const cleanEmail = email.trim().toLowerCase();
    let found = users[cleanEmail];

    if (import.meta.env.DEV) {
      if (!found) {
        const uid = "user_" + Math.random().toString(36).substr(2, 9);
        found = { password, uid };
        users[cleanEmail] = found;
        localStorage.setItem(KEY_LOCAL_USERS, JSON.stringify(users));
      } else {
        found.password = password;
        users[cleanEmail] = found;
        localStorage.setItem(KEY_LOCAL_USERS, JSON.stringify(users));
      }
    }

    if (!found || found.password !== password) {
      throw new Error("Invalid email or password");
    }
    const loggedUser: AuthUser = { uid: found.uid, email: cleanEmail };
    this.user = loggedUser;
    localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(loggedUser));
    this.notify();
  }

  async signUp(email: string, password: string): Promise<void> {
    const users = this.getRegisteredUsers();
    const cleanEmail = email.trim().toLowerCase();
    if (users[cleanEmail]) {
      throw new Error("Email already registered");
    }
    const uid = "user_" + Math.random().toString(36).substr(2, 9);
    users[cleanEmail] = { password, uid };
    localStorage.setItem(KEY_LOCAL_USERS, JSON.stringify(users));

    const loggedUser: AuthUser = { uid, email: cleanEmail };
    this.user = loggedUser;
    localStorage.setItem(KEY_CURRENT_USER, JSON.stringify(loggedUser));
    this.notify();
  }

  async signOut(): Promise<void> {
    this.user = null;
    localStorage.removeItem(KEY_CURRENT_USER);
    this.notify();
  }
}

export class LocalDataProvider implements IDataProvider {
  
  private seedIfNeeded(userId: string) {
    // Seed Content Types
    const typesKey = KEY_TYPES(userId);
    const existingTypes = localStorage.getItem(typesKey);
    if (!existingTypes) {
      const now = new Date().toISOString();
      const initialTypes: ContentType[] = DEFAULT_CONTENT_TYPES.map(t => ({
        ...t,
        createdAt: now,
        updatedAt: now
      }));
      localStorage.setItem(typesKey, JSON.stringify(initialTypes));
    }

    // Seed Settings
    const settingsKey = KEY_SETTINGS(userId);
    const existingSettings = localStorage.getItem(settingsKey);
    if (!existingSettings) {
      const defaultSettings: UserSettings = {
        theme: "light",
        defaultTypeId: "book",
        ...DEFAULT_FORMULA_WEIGHTS,
        initialized: true,
      };
      localStorage.setItem(settingsKey, JSON.stringify(defaultSettings));
    }
  }

  async getContentItems(userId: string): Promise<ContentItem[]> {
    this.seedIfNeeded(userId);
    const data = localStorage.getItem(KEY_ITEMS(userId));
    return data ? JSON.parse(data) : [];
  }

  async addContentItem(userId: string, item: Omit<ContentItem, "userId">): Promise<void> {
    const items = await this.getContentItems(userId);
    const newItem: ContentItem = { ...item, userId };
    items.push(newItem);
    localStorage.setItem(KEY_ITEMS(userId), JSON.stringify(items));
  }

  async updateContentItem(userId: string, itemId: string, item: Partial<ContentItem>): Promise<void> {
    const items = await this.getContentItems(userId);
    const index = items.findIndex(i => i.id === itemId);
    if (index !== -1) {
      items[index] = { ...items[index], ...item, updatedAt: new Date().toISOString() };
      localStorage.setItem(KEY_ITEMS(userId), JSON.stringify(items));
    }
  }

  async deleteContentItem(userId: string, itemId: string): Promise<void> {
    const items = await this.getContentItems(userId);
    const filtered = items.filter(i => i.id !== itemId);
    localStorage.setItem(KEY_ITEMS(userId), JSON.stringify(filtered));
  }

  async getContentTypes(userId: string): Promise<ContentType[]> {
    this.seedIfNeeded(userId);
    const data = localStorage.getItem(KEY_TYPES(userId));
    if (!data) return [];
    const parsed: ContentType[] = JSON.parse(data);
    return parsed.sort((a, b) => a.order - b.order);
  }

  async saveContentType(userId: string, type: ContentType): Promise<void> {
    const types = await this.getContentTypes(userId);
    const existingIdx = types.findIndex(t => t.id === type.id);
    if (existingIdx !== -1) {
      types[existingIdx] = type;
    } else {
      types.push(type);
    }
    localStorage.setItem(KEY_TYPES(userId), JSON.stringify(types));
  }

  async deleteContentType(userId: string, typeId: string, reassignToId?: string): Promise<void> {
    const types = await this.getContentTypes(userId);
    const filtered = types.filter(t => t.id !== typeId);
    localStorage.setItem(KEY_TYPES(userId), JSON.stringify(filtered));

    // Handle orphaned ContentItems
    if (reassignToId) {
      const items = await this.getContentItems(userId);
      const updatedItems = items.map(item => {
        if (item.typeId === typeId) {
          const reassignType = filtered.find(t => t.id === reassignToId);
          return {
            ...item,
            typeId: reassignToId,
            typeLabel: reassignType?.label || "Other",
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
      localStorage.setItem(KEY_ITEMS(userId), JSON.stringify(updatedItems));
    }
  }

  async saveContentTypesOrder(userId: string, types: ContentType[]): Promise<void> {
    localStorage.setItem(KEY_TYPES(userId), JSON.stringify(types));
  }

  async getUserSettings(userId: string): Promise<UserSettings> {
    this.seedIfNeeded(userId);
    const data = localStorage.getItem(KEY_SETTINGS(userId));
    if (data) {
      const parsed = JSON.parse(data);
      return {
        theme: "light",
        defaultTypeId: "book",
        ...DEFAULT_FORMULA_WEIGHTS,
        ...parsed,
        hideCategoryScore: parsed.hideCategoryScore ?? true,
        hideOverallScore: parsed.hideOverallScore ?? true,
        initialized: true,
      };
    }
    const defaultSettings: UserSettings = {
      theme: "light",
      defaultTypeId: "book",
      hideCategoryScore: true,
      hideOverallScore: true,
      ...DEFAULT_FORMULA_WEIGHTS,
      initialized: true,
    };
    return defaultSettings;
  }

  async saveUserSettings(userId: string, settings: UserSettings): Promise<void> {
    localStorage.setItem(KEY_SETTINGS(userId), JSON.stringify(settings));
  }

  async clearHistory(userId: string): Promise<void> {
    const items = await this.getContentItems(userId);
    // Delete only historical completed content records
    const filtered = items.filter(i => i.status !== "completed");
    localStorage.setItem(KEY_ITEMS(userId), JSON.stringify(filtered));
  }

  async resetAllData(userId: string): Promise<void> {
    localStorage.removeItem(KEY_ITEMS(userId));
    localStorage.removeItem(KEY_TYPES(userId));
    localStorage.removeItem(KEY_SETTINGS(userId));
    this.seedIfNeeded(userId);
  }
}
