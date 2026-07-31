/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  query,
  where,
} from "firebase/firestore";
import { AuthUser, ContentItem, ContentType, UserSettings, DEFAULT_FORMULA_WEIGHTS, DEFAULT_CONTENT_TYPES } from "../types";
import { IAuthProvider, IDataProvider } from "./types";
import { auth, db, handleFirestoreError, OperationType } from "./firebaseService";

function toFirestoreData<T>(obj: T): any {
  if (obj === undefined) return null;
  if (obj === null) return null;
  if (Array.isArray(obj)) {
    return obj.map(toFirestoreData);
  }
  if (typeof obj === "object") {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      const val = (obj as any)[key];
      res[key] = toFirestoreData(val);
    }
    return res;
  }
  return obj;
}

export class FirebaseAuthProvider implements IAuthProvider {
  user: AuthUser | null = null;
  loading: boolean = true;
  isFirebase: boolean = true;
  private unsubscribeAuth: (() => void) | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (!auth) {
      this.loading = false;
      return;
    }
    this.unsubscribeAuth = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        this.user = {
          uid: fbUser.uid,
          email: fbUser.email,
          isAnonymous: fbUser.isAnonymous,
        };
      } else {
        this.user = null;
      }
      this.loading = false;
      this.notify();
    });
  }

  onChange(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  async signIn(email: string, password: string): Promise<void> {
    if (!auth) throw new Error("Firebase Auth is not available");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      if (import.meta.env.DEV) {
        if (
          error.code === "auth/invalid-credential" ||
          error.code === "auth/user-not-found" ||
          error.code === "auth/wrong-password"
        ) {
          try {
            await createUserWithEmailAndPassword(auth, email, password);
            return;
          } catch (signUpError: any) {
            console.error("Auto sign-up in dev mode failed: ", signUpError);
          }
        }
      }
      let msg = error.message || "Sign in failed";
      if (error.code === "auth/invalid-credential") {
        msg = "Invalid email or password";
      } else if (error.code === "auth/user-not-found") {
        msg = "User not found";
      } else if (error.code === "auth/wrong-password") {
        msg = "Incorrect password";
      }
      throw new Error(msg);
    }
  }

  async signUp(email: string, password: string): Promise<void> {
    if (!auth) throw new Error("Firebase Auth is not available");
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      let msg = error.message || "Registration failed";
      if (error.code === "auth/email-already-in-use") {
        msg = "This email is already in use";
      } else if (error.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters";
      } else if (error.code === "auth/invalid-email") {
        msg = "Invalid email address";
      }
      throw new Error(msg);
    }
  }

  async signOut(): Promise<void> {
    if (!auth) return;
    await fbSignOut(auth);
  }

  destroy() {
    if (this.unsubscribeAuth) {
      this.unsubscribeAuth();
    }
  }
}

export class FirestoreDataProvider implements IDataProvider {
  
  private async seedIfNeeded(userId: string): Promise<void> {
    if (!db) return;
    const settingsPath = `users/${userId}/settings/main`;
    try {
      const settingsSnap = await getDoc(doc(db, "users", userId, "settings", "main"));
      if (!settingsSnap.exists()) {
        const batch = writeBatch(db);
        const now = new Date().toISOString();

        // 1. Seed Content Types
        DEFAULT_CONTENT_TYPES.forEach((t) => {
          const typeRef = doc(db, "users", userId, "contentTypes", t.id);
          batch.set(typeRef, {
            ...t,
            createdAt: now,
            updatedAt: now,
          });
        });

        // 2. Seed User Settings
        const settingsRef = doc(db, "users", userId, "settings", "main");
        const defaultSettings: UserSettings = {
          theme: "light",
          defaultTypeId: "book",
          hideCategoryScore: true,
          hideOverallScore: true,
          ...DEFAULT_FORMULA_WEIGHTS,
          initialized: true,
        };
        batch.set(settingsRef, defaultSettings);

        await batch.commit();
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, settingsPath);
    }
  }

  async getContentItems(userId: string): Promise<ContentItem[]> {
    if (!db) return [];
    await this.seedIfNeeded(userId);
    const path = `users/${userId}/content`;
    try {
      const q = collection(db, "users", userId, "content");
      const snap = await getDocs(q);
      const items: ContentItem[] = [];
      snap.forEach((doc) => {
        items.push(doc.data() as ContentItem);
      });
      return items;
    } catch (error) {
      return handleFirestoreError(error, OperationType.GET, path);
    }
  }

  async addContentItem(userId: string, item: Omit<ContentItem, "userId">): Promise<void> {
    if (!db) return;
    const path = `users/${userId}/content/${item.id}`;
    try {
      const itemRef = doc(db, "users", userId, "content", item.id);
      const newItem: ContentItem = { ...item, userId };
      await setDoc(itemRef, toFirestoreData(newItem));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async updateContentItem(userId: string, itemId: string, item: Partial<ContentItem>): Promise<void> {
    if (!db) return;
    const path = `users/${userId}/content/${itemId}`;
    try {
      const itemRef = doc(db, "users", userId, "content", itemId);
      await updateDoc(itemRef, toFirestoreData({
        ...item,
        updatedAt: new Date().toISOString(),
      }));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteContentItem(userId: string, itemId: string): Promise<void> {
    if (!db) return;
    const path = `users/${userId}/content/${itemId}`;
    try {
      const itemRef = doc(db, "users", userId, "content", itemId);
      await deleteDoc(itemRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  async getContentTypes(userId: string): Promise<ContentType[]> {
    if (!db) return [];
    await this.seedIfNeeded(userId);
    const path = `users/${userId}/contentTypes`;
    try {
      const q = collection(db, "users", userId, "contentTypes");
      const snap = await getDocs(q);
      const types: ContentType[] = [];
      snap.forEach((doc) => {
        types.push(doc.data() as ContentType);
      });
      return types.sort((a, b) => a.order - b.order);
    } catch (error) {
      return handleFirestoreError(error, OperationType.GET, path);
    }
  }

  async saveContentType(userId: string, type: ContentType): Promise<void> {
    if (!db) return;
    const path = `users/${userId}/contentTypes/${type.id}`;
    try {
      const typeRef = doc(db, "users", userId, "contentTypes", type.id);
      await setDoc(typeRef, type);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async deleteContentType(userId: string, typeId: string, reassignToId?: string): Promise<void> {
    if (!db) return;
    const path = `users/${userId}/contentTypes/${typeId}`;
    try {
      const batch = writeBatch(db);
      
      // 1. If reassignment requested, fetch all items of this type and update them
      if (reassignToId) {
        const types = await this.getContentTypes(userId);
        const targetType = types.find((t) => t.id === reassignToId);
        const label = targetType?.label || "Other";
        
        const q = query(
          collection(db, "users", userId, "content"),
          where("typeId", "==", typeId)
        );
        const itemSnaps = await getDocs(q);
        itemSnaps.forEach((itemDoc) => {
          batch.update(itemDoc.ref, {
            typeId: reassignToId,
            typeLabel: label,
            updatedAt: new Date().toISOString(),
          });
        });
      }

      // 2. Delete the content type itself
      const typeRef = doc(db, "users", userId, "contentTypes", typeId);
      batch.delete(typeRef);

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  async saveContentTypesOrder(userId: string, types: ContentType[]): Promise<void> {
    if (!db) return;
    const path = `users/${userId}/contentTypes`;
    try {
      const batch = writeBatch(db);
      types.forEach((t) => {
        const typeRef = doc(db, "users", userId, "contentTypes", t.id);
        batch.set(typeRef, t);
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async getUserSettings(userId: string): Promise<UserSettings> {
    if (!db) {
      return {
        theme: "light",
        defaultTypeId: "book",
        hideCategoryScore: true,
        hideOverallScore: true,
        ...DEFAULT_FORMULA_WEIGHTS,
        initialized: false,
      };
    }
    await this.seedIfNeeded(userId);
    const path = `users/${userId}/settings/main`;
    try {
      const docSnap = await getDoc(doc(db, "users", userId, "settings", "main"));
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          theme: "light",
          defaultTypeId: "book",
          ...DEFAULT_FORMULA_WEIGHTS,
          ...data,
          hideCategoryScore: data.hideCategoryScore ?? true,
          hideOverallScore: data.hideOverallScore ?? true,
          initialized: true,
        } as UserSettings;
      }
      return {
        theme: "light",
        defaultTypeId: "book",
        hideCategoryScore: true,
        hideOverallScore: true,
        ...DEFAULT_FORMULA_WEIGHTS,
        initialized: true,
      };
    } catch (error) {
      return handleFirestoreError(error, OperationType.GET, path);
    }
  }

  async saveUserSettings(userId: string, settings: UserSettings): Promise<void> {
    if (!db) return;
    const path = `users/${userId}/settings/main`;
    try {
      const settingsRef = doc(db, "users", userId, "settings", "main");
      await setDoc(settingsRef, settings);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async clearHistory(userId: string): Promise<void> {
    if (!db) return;
    const path = `users/${userId}/content`;
    try {
      const batch = writeBatch(db);
      const q = query(
        collection(db, "users", userId, "content"),
        where("status", "==", "completed")
      );
      const snaps = await getDocs(q);
      snaps.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  async resetAllData(userId: string): Promise<void> {
    if (!db) return;
    const path = `users/${userId}`;
    try {
      const batch = writeBatch(db);
      
      // 1. Delete all content items
      const contentSnaps = await getDocs(collection(db, "users", userId, "content"));
      contentSnaps.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 2. Delete all content types
      const typeSnaps = await getDocs(collection(db, "users", userId, "contentTypes"));
      typeSnaps.forEach((doc) => {
        batch.delete(doc.ref);
      });

      // 3. Delete settings
      const settingsRef = doc(db, "users", userId, "settings", "main");
      batch.delete(settingsRef);

      await batch.commit();

      // Trigger re-seeding next time data is requested or run it now
      await this.seedIfNeeded(userId);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }
}
