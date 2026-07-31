/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { useKult } from "../providers";
import { ContentType, UserSettings, DEFAULT_FORMULA_WEIGHTS } from "../types";
import {
  Settings,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Moon,
  Sun,
  User,
  LogOut,
  Download,
  RotateCcw,
  Heart,
  Edit2,
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CircleAlert,
  Flame,
} from "lucide-react";

// Constants requested by user
const SUPPORT_URL = "https://ko-fi.com/3gaspo";
const APP_VERSION = "0.0.0"; // Corresponds to package.json version

export const SettingsPage: React.FC = () => {
  const {
    user,
    authLoading,
    isFirebase,
    signIn,
    signUp,
    signOut,
    items,
    types,
    settings,
    saveType,
    deleteType,
    saveTypesOrder,
    saveSettings,
    clearHistory,
    resetAllData,
  } = useKult();

  // 1. App-specific settings states
  const [newTypeLabel, setNewTypeLabel] = useState("");
  const [typeError, setTypeError] = useState<string | null>(null);
  
  // Reassignment Modal state (for deleting content types)
  const [deletingType, setDeletingType] = useState<ContentType | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>("other");

  // Formula state
  const [priorityW, setPriorityW] = useState(settings?.priorityWeight.toString() || "0.4");
  const [pleasureW, setPleasureW] = useState(settings?.pleasureWeight.toString() || "0.25");
  const [shortnessW, setShortnessW] = useState(settings?.shortnessWeight.toString() || "0.2");
  const [freshnessW, setFreshnessW] = useState(settings?.freshnessWeight.toString() || "0.075");
  const [backlogW, setBacklogW] = useState(settings?.backlogWeight.toString() || "0.075");

  // Sign out / Sign in states
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authFormLoading, setAuthFormLoading] = useState(false);

  // 2. Modals State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Helper to sync formula weights
  const handleUpdateFormula = (
    field: "priority" | "pleasure" | "shortness" | "freshness" | "backlog",
    valueStr: string
  ) => {
    // Sanitized value
    const cleanVal = valueStr.replace(",", ".");
    
    let p = priorityW;
    let pl = pleasureW;
    let s = shortnessW;
    let f = freshnessW;
    let b = backlogW;

    if (field === "priority") { p = cleanVal; setPriorityW(cleanVal); }
    if (field === "pleasure") { pl = cleanVal; setPleasureW(cleanVal); }
    if (field === "shortness") { s = cleanVal; setShortnessW(cleanVal); }
    if (field === "freshness") { f = cleanVal; setFreshnessW(cleanVal); }
    if (field === "backlog") { b = cleanVal; setBacklogW(cleanVal); }

    const numP = parseFloat(p) || 0;
    const numPl = parseFloat(pl) || 0;
    const numS = parseFloat(s) || 0;
    const numF = parseFloat(f) || 0;
    const numB = parseFloat(b) || 0;

    const total = numP + numPl + numS + numF + numB;

    if (settings) {
      saveSettings({
        ...settings,
        priorityWeight: total === 0 ? DEFAULT_FORMULA_WEIGHTS.priorityWeight : numP,
        pleasureWeight: total === 0 ? DEFAULT_FORMULA_WEIGHTS.pleasureWeight : numPl,
        shortnessWeight: total === 0 ? DEFAULT_FORMULA_WEIGHTS.shortnessWeight : numS,
        freshnessWeight: total === 0 ? DEFAULT_FORMULA_WEIGHTS.freshnessWeight : numF,
        backlogWeight: total === 0 ? DEFAULT_FORMULA_WEIGHTS.backlogWeight : numB,
      });
    }
  };

  // Content Type operations
  const handleAddType = async (e: React.FormEvent) => {
    e.preventDefault();
    setTypeError(null);
    const label = newTypeLabel.trim();
    if (!label) return;

    // Duplication Check (Case-insensitive)
    const exists = types.some((t) => t.label.toLowerCase() === label.toLowerCase());
    if (exists) {
      setTypeError("This category already exists.");
      return;
    }

    const id = "type_" + Math.random().toString(36).substr(2, 9);
    const order = types.length > 0 ? Math.max(...types.map((t) => t.order)) + 1 : 1;
    const now = new Date().toISOString();

    await saveType({
      id,
      label,
      order,
      createdAt: now,
      updatedAt: now,
    });
    setNewTypeLabel("");
  };

  const handleMoveType = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === types.length - 1) return;

    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const reordered = [...types];
    
    // Swap order property
    const tempOrder = reordered[index].order;
    reordered[index].order = reordered[targetIdx].order;
    reordered[targetIdx].order = tempOrder;

    // Swap in array
    const tempItem = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = tempItem;

    await saveTypesOrder(reordered);
  };

  const triggerDeleteType = (type: ContentType) => {
    setTypeError(null);
    
    // Check if type is used by existing content
    const isUsed = items.some((item) => item.typeId === type.id);
    if (!isUsed) {
      // Delete immediately if not used
      deleteType(type.id);
      return;
    }

    // Otherwise, show safe reassignment modal
    setDeletingType(type);
    // Find default target (first available type that is NOT this one)
    const otherType = types.find((t) => t.id !== type.id);
    setReassignTargetId(otherType?.id || "other");
  };

  const confirmDeleteType = async () => {
    if (!deletingType) return;
    await deleteType(deletingType.id, reassignTargetId);
    setDeletingType(null);
  };

  // CSV Export Action
  const handleDownloadCSV = () => {
    if (items.length === 0) return;

    const headers = [
      "id", "title", "type", "author", "publishedDate", "addedDate", "status",
      "completedDate", "note", "keywords", "priority", "pleasure", "length",
      "effectivePriority", "createdAt", "updatedAt"
    ];

    const escapeCsvCell = (val: any) => {
      if (val === undefined || val === null) return "";
      let str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
        str = str.replace(/"/g, '""');
        return `"${str}"`;
      }
      return str;
    };

    const rows = items.map((item) => {
      const keywordsStr = item.keywords.join(", ");
      return [
        item.id,
        item.title,
        item.typeLabel,
        item.author || "",
        item.publishedDate || "",
        item.addedDate,
        item.status,
        item.completedDate || "",
        item.note || "",
        keywordsStr,
        item.priority,
        item.pleasure,
        item.length,
        item.effectivePriority.toFixed(1),
        item.createdAt,
        item.updatedAt
      ].map(escapeCsvCell).join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    const formattedDate = new Date().toISOString().split("T")[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `Kult_Export_${formattedDate}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Auth Form submission
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!email || !password) {
      setAuthError("Please fill in all fields.");
      return;
    }
    setAuthFormLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      setAuthError(err.message || "An authentication error occurred.");
    } finally {
      setAuthFormLoading(false);
    }
  };

  // Synchronize input fields with state when settings load
  React.useEffect(() => {
    if (settings) {
      setPriorityW(settings.priorityWeight.toString());
      setPleasureW(settings.pleasureWeight.toString());
      setShortnessW(settings.shortnessWeight.toString());
      setFreshnessW(settings.freshnessWeight.toString());
      setBacklogW(settings.backlogWeight.toString());
    }
  }, [settings]);

  return (
    <div className="space-y-8 pb-24 text-zinc-900 dark:text-zinc-50 font-sans">
      {/* Header */}
      <div className="flex justify-between items-baseline">
        <h1 className="text-4xl font-bold tracking-tight" id="settings-title">
          Settings
        </h1>
        {!isFirebase && (
          <span className="text-emerald-500 font-extrabold tracking-widest text-[10px] bg-emerald-500/10 dark:bg-emerald-500/20 px-3 py-1.5 rounded-full" id="dev-mode-badge">
            DEV MODE
          </span>
        )}
      </div>

      {/* 1. App-specific settings */}
      <div className="space-y-6">
        
        {/* Content Types section */}
        <div className="bg-black/5 dark:bg-white/5 p-6 sm:p-8 rounded-[32px] space-y-6 transition-colors duration-200">
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500">
              Content Types
            </span>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-1">
              Customize categories
            </h2>
          </div>

          {/* Add Category Form */}
          <form onSubmit={handleAddType} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Manga, Novel, Boardgame"
              value={newTypeLabel}
              onChange={(e) => setNewTypeLabel(e.target.value)}
              className="flex-1 px-4 py-3.5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-sm font-semibold shadow-sm"
              id="settings-add-type-input"
            />
            <button
              type="submit"
              className="w-12 h-12 rounded-2xl bg-black dark:bg-white text-white dark:text-black flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-md shrink-0"
              id="settings-add-type-btn"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
            </button>
          </form>

          {typeError && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-3.5 py-2 rounded-xl">
              {typeError}
            </p>
          )}

          {/* Categories List */}
          <div className="bg-white dark:bg-black/20 rounded-2xl border border-zinc-100 dark:border-zinc-900 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-900 shadow-sm" id="types-list">
            {types.map((t, idx) => (
              <div key={t.id} className="p-4 flex justify-between items-center gap-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                <span>{t.label}</span>
                <div className="flex items-center gap-1 shrink-0">
                  {/* Reorder controls */}
                  <button
                    onClick={() => handleMoveType(idx, "up")}
                    disabled={idx === 0}
                    className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-500 disabled:opacity-30 transition-all"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleMoveType(idx, "down")}
                    disabled={idx === types.length - 1}
                    className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-900/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center text-zinc-500 disabled:opacity-30 transition-all"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  {/* Delete category */}
                  <button
                    onClick={() => triggerDeleteType(t)}
                    disabled={types.length <= 1}
                    className="w-8 h-8 rounded-lg bg-zinc-50 hover:bg-rose-50 text-zinc-500 hover:text-rose-600 dark:bg-zinc-900/80 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 flex items-center justify-center transition-all disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Formula section */}
        <div className="bg-black/5 dark:bg-white/5 p-6 sm:p-8 rounded-[32px] space-y-6 transition-colors duration-200">
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500">
              Priority Formula
            </span>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-1">
              Adjust weights (total = 1.0)
            </h2>
          </div>

          <div className="bg-white dark:bg-black/20 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-900 space-y-4 shadow-sm text-sm font-semibold">
            {/* Weight Inputs */}
            {[
              { label: "Priority weight", field: "priority" as const, val: priorityW, set: setPriorityW },
              { label: "Motivation weight", field: "pleasure" as const, val: pleasureW, set: setPleasureW },
              { label: "Shortness weight", field: "shortness" as const, val: shortnessW, set: setShortnessW },
              { label: "Freshness weight", field: "freshness" as const, val: freshnessW, set: setFreshnessW },
              { label: "Backlog weight", field: "backlog" as const, val: backlogW, set: setBacklogW },
            ].map((f, i) => (
              <div key={i} className="flex justify-between items-center gap-4">
                <span className="text-zinc-700 dark:text-zinc-300">{f.label}</span>
                <input
                  type="text"
                  value={f.val}
                  onChange={(e) => {
                    f.set(e.target.value);
                    handleUpdateFormula(f.field, e.target.value);
                  }}
                  className="w-20 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-right text-zinc-950 dark:text-zinc-50 font-bold focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>
            ))}

            {/* Weights total info */}
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 flex justify-between text-xs text-zinc-400 font-bold">
              <span>Total sum weight</span>
              <span className={
                Math.abs((parseFloat(priorityW) || 0) + (parseFloat(pleasureW) || 0) + (parseFloat(shortnessW) || 0) + (parseFloat(freshnessW) || 0) + (parseFloat(backlogW) || 0) - 1.0) < 0.001
                  ? "text-emerald-500"
                  : "text-rose-500"
              }>
                {((parseFloat(priorityW) || 0) + (parseFloat(pleasureW) || 0) + (parseFloat(shortnessW) || 0) + (parseFloat(freshnessW) || 0) + (parseFloat(backlogW) || 0)).toFixed(3)}
              </span>
            </div>
          </div>
        </div>

        {/* Defaults section */}
        {settings && types.length > 0 && (
          <div className="bg-black/5 dark:bg-white/5 p-6 sm:p-8 rounded-[32px] space-y-6 transition-colors duration-200">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500">
                Defaults
              </span>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-1">
                Preferred startup category
              </h2>
            </div>

            <div className="relative">
              <select
                value={settings.defaultTypeId || ""}
                onChange={(e) => saveSettings({ ...settings, defaultTypeId: e.target.value })}
                className="w-full pl-4 pr-10 py-3.5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white appearance-none text-sm font-bold shadow-sm"
                id="settings-default-type-select"
              >
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                <ChevronDown className="w-5 h-5" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Score Display Settings */}
      {settings && (
        <div className="bg-black/5 dark:bg-white/5 p-6 sm:p-8 rounded-[32px] space-y-6 transition-colors duration-200" id="settings-score-display">
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500">
              Score Visibility
            </span>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-1">
              Effective Priority & Rating Scores
            </h2>
          </div>

          <div className="bg-white dark:bg-black/20 rounded-2xl border border-zinc-100 dark:border-zinc-900 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-900 shadow-sm">
            {/* Hide Score Per Category */}
            <div className="p-5 flex justify-between items-center gap-4">
              <div className="space-y-0.5 pr-2">
                <div className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                  Hide score per category
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Hide Effective Priority (EP) and rating scores on backlog items in category views.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const current = settings.hideCategoryScore ?? true;
                  saveSettings({
                    ...settings,
                    hideCategoryScore: !current,
                  });
                }}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 ${
                  (settings.hideCategoryScore ?? true) ? "bg-black dark:bg-white" : "bg-zinc-200 dark:bg-zinc-800"
                }`}
                id="toggle-hide-category-score"
                title="Toggle hide category score"
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white dark:bg-zinc-900 shadow-sm transition-transform duration-200 transform ${
                    (settings.hideCategoryScore ?? true) ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Hide Overall Score */}
            <div className="p-5 flex justify-between items-center gap-4">
              <div className="space-y-0.5 pr-2">
                <div className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                  Hide overall score
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Hide Effective Priority (EP) scores in history and overall statistics views.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const current = settings.hideOverallScore ?? true;
                  saveSettings({
                    ...settings,
                    hideOverallScore: !current,
                  });
                }}
                className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 focus:outline-none shrink-0 ${
                  (settings.hideOverallScore ?? true) ? "bg-black dark:bg-white" : "bg-zinc-200 dark:bg-zinc-800"
                }`}
                id="toggle-hide-overall-score"
                title="Toggle hide overall score"
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white dark:bg-zinc-900 shadow-sm transition-transform duration-200 transform ${
                    (settings.hideOverallScore ?? true) ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Appearance */}
      {settings && (
        <div className="bg-black/5 dark:bg-white/5 p-6 sm:p-8 rounded-[32px] space-y-6 transition-colors duration-200" id="settings-appearance">
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500">
              Appearance
            </span>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-1">
              Visual Theme
            </h2>
          </div>

          <div className="flex justify-between items-center bg-white dark:bg-black/20 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-900 shadow-sm font-bold text-sm">
            <span className="text-zinc-700 dark:text-zinc-300">Dark Mode</span>
            <button
              onClick={() => saveSettings({ ...settings, theme: settings.theme === "dark" ? "light" : "dark" })}
              className={`w-14 h-8 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                settings.theme === "dark" ? "bg-white text-black" : "bg-zinc-200 text-zinc-400"
              }`}
              id="theme-toggle-switch"
            >
              <div
                className={`w-6 h-6 rounded-full bg-black dark:bg-zinc-900 flex items-center justify-center transition-transform duration-200 transform ${
                  settings.theme === "dark" ? "translate-x-6" : "translate-x-0"
                }`}
              >
                {settings.theme === "dark" ? <Moon className="w-3.5 h-3.5 text-white" /> : <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 3. Account */}
      <div id="settings-account">
        {!user ? (
          /* Signed Out card */
          <div className="bg-black/5 dark:bg-white/5 p-8 rounded-[32px] space-y-6 transition-colors duration-200">
            <div>
              <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500">
                Account
              </span>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-1">
                Sign in or Create account
              </h2>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {/* Email */}
              <div className="relative flex items-center">
                <span className="absolute left-4 text-zinc-400">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-sm font-semibold shadow-sm"
                />
              </div>

              {/* Password */}
              <div className="relative flex items-center">
                <span className="absolute left-4 text-zinc-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-sm font-semibold shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-zinc-400 hover:text-zinc-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {authError && (
                <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-2xl flex items-center gap-2">
                  <CircleAlert className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authFormLoading}
                className="w-full py-3.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 active:scale-95 transition-all shadow-md disabled:opacity-50"
              >
                {authFormLoading ? "Loading..." : isSignUp ? "Create account" : "Sign in"}
              </button>
            </form>

            <div className="text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError(null);
                }}
                className="text-xs font-bold text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                {isSignUp ? "Already have an account? Sign in" : "New here? Create account"}
              </button>
            </div>
          </div>
        ) : (
          /* Signed In card */
          <div className="bg-black/5 dark:bg-white/5 p-6 sm:p-8 rounded-[32px] transition-colors duration-200">
            <div className="flex items-center gap-4 bg-white dark:bg-black/20 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-900 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500 block">
                  Account
                </span>
                <span className="text-base font-bold text-zinc-900 dark:text-zinc-50 block mt-0.5">
                  {user.email || "Simulated Local User"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Actions */}
      <div className="space-y-3" id="settings-actions">
        <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500 px-4 block">
          Actions
        </span>

        {/* 1. Disconnect / Sign out */}
        {user && (
          <button
            onClick={signOut}
            className="w-full text-left p-6 rounded-[24px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center gap-4 transition-all active:scale-98 font-bold text-sm shadow-sm"
            id="action-signout"
          >
            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <span>Disconnect / Sign out</span>
            </div>
          </button>
        )}

        {/* 2. Download data as CSV */}
        <button
          onClick={handleDownloadCSV}
          disabled={items.length === 0}
          className="w-full text-left p-6 rounded-[24px] bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 flex items-center gap-4 transition-all active:scale-98 font-bold text-sm shadow-sm disabled:opacity-50"
          id="action-export-csv"
        >
          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <span>Download data as CSV</span>
          </div>
        </button>

        {/* 3. Reset data */}
        <button
          onClick={() => setIsResetModalOpen(true)}
          className="w-full text-left p-6 rounded-[24px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-4 transition-all active:scale-98 font-bold text-sm shadow-sm"
          id="action-reset"
        >
          <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <span>Reset data</span>
          </div>
        </button>
      </div>

      {/* 5. Footer credits */}
      <div className="pt-8 pb-12 flex flex-col items-center text-center gap-6 text-zinc-400 dark:text-zinc-500 text-xs font-bold transition-all" id="settings-footer-credits">
        {/* Support Button */}
        <a
          href={SUPPORT_URL}
          target="_blank"
          referrerPolicy="no-referrer"
          rel="noopener noreferrer"
          className="bg-black text-white dark:bg-white dark:text-black px-6 py-3.5 rounded-full flex items-center gap-2 text-sm shadow-md hover:opacity-90 active:scale-95 transition-all"
          id="support-project-btn"
        >
          <Heart className="w-4 h-4 fill-current text-rose-500 stroke-rose-500" />
          <span>Support the project</span>
        </a>

        {/* Logo display if gaspo_logo.svg present (we have written a fallback) */}
        <div className="w-40 h-40 transition-all flex items-center justify-center">
          <img
            src="/gaspo_logo.svg"
            alt="Credits Logo"
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>

        {/* Credits Details */}
        <div className="space-y-2 flex flex-col items-center">
          <span className="bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full">
            Kult — version {APP_VERSION}
          </span>
          <p className="text-zinc-900 dark:text-zinc-50 font-black text-sm tracking-tight mt-1">
            GASPARD BERTHELIER
          </p>
          <a
            href="mailto:gberthelier.projet@gmail.com"
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-extrabold text-xs underline transition-colors"
          >
            gberthelier.projet@gmail.com
          </a>
        </div>
      </div>

      {/* REASSIGNMENT DIALOG MODAL (For deleting content type that is used by items) */}
      {deletingType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md" onClick={() => setDeletingType(null)} />
          <div className="relative bg-white dark:bg-zinc-950 w-full max-w-md rounded-[32px] p-6 shadow-2xl border border-zinc-100 dark:border-zinc-800 text-center space-y-6">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
              Delete "{deletingType.label}" Category?
            </h3>
            <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
              There are active items in this category. Please reassign them to a different category before deleting:
            </p>

            <div className="relative">
              <select
                value={reassignTargetId}
                onChange={(e) => setReassignTargetId(e.target.value)}
                className="w-full pl-4 pr-10 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white appearance-none text-sm font-bold shadow-sm"
              >
                {types
                  .filter((t) => t.id !== deletingType.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                <ChevronDown className="w-4 h-4" />
              </span>
            </div>

            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setDeletingType(null)}
                className="px-5 py-3.5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-sm font-bold shadow-sm active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteType}
                className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md active:scale-95"
              >
                Reassign & Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET CONFIRMATION MODAL */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md" onClick={() => setIsResetModalOpen(false)} />
          <div 
            className="relative bg-white dark:bg-zinc-950 w-full max-w-md rounded-[32px] p-8 shadow-2xl border border-zinc-100 dark:border-zinc-800 text-center space-y-6"
            id="reset-modal-container"
          >
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
              Reset Data
            </h3>
            <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Choose how you want to clear your data. This operation is permanent and cannot be undone.
            </p>

            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={async () => {
                  await clearHistory();
                  setIsResetModalOpen(false);
                }}
                className="w-full py-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-sm font-bold active:scale-98 transition-all shadow-sm"
                id="reset-clear-history-btn"
              >
                Clear History
              </button>
              <button
                onClick={async () => {
                  await resetAllData();
                  setIsResetModalOpen(false);
                }}
                className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold active:scale-98 transition-all shadow-md"
                id="reset-all-data-btn"
              >
                Reset All
              </button>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="w-full py-4 rounded-2xl bg-black dark:bg-white text-white dark:text-black text-sm font-bold active:scale-98 transition-all shadow-sm"
                id="reset-cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
