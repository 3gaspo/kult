/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ContentItem {
  id: string;
  userId: string;
  title: string;
  typeId: string;
  typeLabel: string; // denormalized for display/export
  author?: string;
  publishedDate?: string; // ISO date or year/date text
  addedDate: string; // ISO date (YYYY-MM-DD)
  status: "to_complete" | "ongoing" | "completed";
  completedDate?: string; // ISO date (YYYY-MM-DD)
  note?: string;
  keywords: string[]; // parsed from comma-separated input
  priority: number; // 1 to 5
  pleasure: number; // 1 to 5
  length: number; // 1 to 5
  effectivePriority: number; // derived, not manually edited
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

export interface ContentType {
  id: string;
  label: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  theme: "light" | "dark";
  defaultTypeId?: string;
  priorityWeight: number;
  pleasureWeight: number;
  shortnessWeight: number;
  freshnessWeight: number;
  backlogWeight: number;
  initialized: boolean;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  isAnonymous?: boolean;
}

export const DEFAULT_FORMULA_WEIGHTS = {
  priorityWeight: 0.40,
  pleasureWeight: 0.25,
  shortnessWeight: 0.20,
  freshnessWeight: 0.075,
  backlogWeight: 0.075,
};

export const DEFAULT_CONTENT_TYPES: Omit<ContentType, 'createdAt' | 'updatedAt'>[] = [
  { id: "book", label: "Book", order: 1 },
  { id: "movie", label: "Movie", order: 2 },
  { id: "series", label: "Series", order: 3 },
  { id: "other", label: "Other", order: 4 },
];
