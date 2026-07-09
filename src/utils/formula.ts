/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserSettings } from "../types";

/**
 * Calculates the number of days between a given ISO date (YYYY-MM-DD) and today.
 */
export function getDaysSinceAdded(addedDateStr: string): number {
  if (!addedDateStr) return 0;
  try {
    const addedDate = new Date(addedDateStr);
    if (isNaN(addedDate.getTime())) return 0;
    
    const today = new Date();
    // Normalize both to UTC midnight to avoid timezone shift errors
    const d1 = Date.UTC(addedDate.getFullYear(), addedDate.getMonth(), addedDate.getDate());
    const d2 = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffMs = d2 - d1;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  } catch (error) {
    return 0;
  }
}

/**
 * Deterministic formula to calculate effective priority of content.
 */
export function calculateEffectivePriority(
  params: {
    priority?: number;
    pleasure?: number;
    length?: number;
    addedDate?: string;
  },
  weights: Pick<
    UserSettings,
    "priorityWeight" | "pleasureWeight" | "shortnessWeight" | "freshnessWeight" | "backlogWeight"
  >
): number {
  const p = params.priority !== undefined && !isNaN(params.priority) ? params.priority : 3;
  const pl = params.pleasure !== undefined && !isNaN(params.pleasure) ? params.pleasure : 3;
  const len = params.length !== undefined && !isNaN(params.length) ? params.length : 3;
  const addedDate = params.addedDate || new Date().toISOString().split("T")[0];

  const priorityScore = p / 5;
  const pleasureScore = pl / 5;
  const shortnessScore = (6 - len) / 5;
  
  const daysSinceAdded = getDaysSinceAdded(addedDate);
  const freshnessScore = Math.max(0, 1 - daysSinceAdded / 30);
  const backlogScore = Math.min(1, daysSinceAdded / 180);

  const pw = weights.priorityWeight !== undefined && !isNaN(weights.priorityWeight) ? weights.priorityWeight : 0.40;
  const plw = weights.pleasureWeight !== undefined && !isNaN(weights.pleasureWeight) ? weights.pleasureWeight : 0.25;
  const sw = weights.shortnessWeight !== undefined && !isNaN(weights.shortnessWeight) ? weights.shortnessWeight : 0.20;
  const fw = weights.freshnessWeight !== undefined && !isNaN(weights.freshnessWeight) ? weights.freshnessWeight : 0.075;
  const bw = weights.backlogWeight !== undefined && !isNaN(weights.backlogWeight) ? weights.backlogWeight : 0.075;

  const totalWeight = pw + plw + sw + fw + bw;
  // If weights are 0, default to original weights to avoid dividing by zero or bad math
  const multiplier = totalWeight > 0 ? 1 : 0;

  const rawScore = 
    pw * priorityScore +
    plw * pleasureScore +
    sw * shortnessScore +
    fw * freshnessScore +
    bw * backlogScore;

  const result = 100 * rawScore;
  if (isNaN(result) || !isFinite(result)) return 0;
  
  // Round to one decimal
  return Math.round(result * 10) / 10;
}
