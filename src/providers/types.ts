/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthUser, ContentItem, ContentType, UserSettings } from "../types";

export interface IAuthProvider {
  user: AuthUser | null;
  loading: boolean;
  isFirebase: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface IDataProvider {
  getContentItems: (userId: string) => Promise<ContentItem[]>;
  addContentItem: (userId: string, item: Omit<ContentItem, "userId">) => Promise<void>;
  updateContentItem: (userId: string, itemId: string, item: Partial<ContentItem>) => Promise<void>;
  deleteContentItem: (userId: string, itemId: string) => Promise<void>;
  
  getContentTypes: (userId: string) => Promise<ContentType[]>;
  saveContentType: (userId: string, type: ContentType) => Promise<void>;
  deleteContentType: (userId: string, typeId: string, reassignToId?: string) => Promise<void>;
  saveContentTypesOrder: (userId: string, types: ContentType[]) => Promise<void>;
  
  getUserSettings: (userId: string) => Promise<UserSettings>;
  saveUserSettings: (userId: string, settings: UserSettings) => Promise<void>;
  
  clearHistory: (userId: string) => Promise<void>;
  resetAllData: (userId: string) => Promise<void>;
}
