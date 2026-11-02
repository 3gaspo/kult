import { ValidatedForm } from '../components/ValidatedForm';
import { SettingsSwitch } from '../components/SettingsSwitch';
import { PageHeader } from '../components/PageHeader';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { Dialog, DialogActions } from '../components/Dialog';
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
const APP_VERSION = "0.0.1"; // Corresponds to package.json version

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
    <div className="space-y-6 pb-24 text-ui-text font-sans">
      {/* Header */}
      <PageHeader title="Settings" devMode={!isFirebase} titleId="settings-title" devModeId="dev-mode-badge" />

      {/* 1. App-specific settings */}
      <div className="space-y-6">
        
        {/* Content Types section */}
        <div className="ui-section-card bg-ui-section p-6 sm:p-8 rounded-[32px] space-y-6 transition-colors duration-200">
          <div>
            <span className="ui-section-title text-[10px] uppercase font-black tracking-widest text-ui-muted">
              Content Types
            </span>
          </div>

          {/* Add Category Form */}
          <ValidatedForm onSubmit={handleAddType} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Manga, Novel, Boardgame"
              value={newTypeLabel}
              onChange={(e) => setNewTypeLabel(e.target.value)}
              className="ui-field flex-1 min-w-0 px-4 py-3.5 rounded-2xl bg-ui-surface border border-ui-border text-ui-text placeholder-ui-ink/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-sm font-semibold shadow-sm"
              id="settings-add-type-input"
            />
            <button aria-label="Add"
              type="submit"
              className="ui-icon-button w-12 h-12 rounded-2xl bg-ui-primary text-ui-primary-text flex items-center justify-center hover:opacity-90 transition-all shadow-md shrink-0"
              id="settings-add-type-btn"
            >
              <Plus className="w-5 h-5 stroke-[3]" />
            </button>
          </ValidatedForm>

          {typeError && (
            <p role="alert" className="ui-error text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-3.5 py-2 rounded-xl">
              {typeError}
            </p>
          )}

          {/* Categories List */}
          <div className="bg-ui-surface rounded-2xl border border-ui-border overflow-hidden divide-y divide-ui-border shadow-sm" id="types-list">
            {types.map((t, idx) => (
              <div key={t.id} className="ui-setting-list-row text-sm font-semibold text-ui-text">
                <span title={t.label} className="ui-setting-list-name">{t.label}</span>
                <div className="ui-setting-list-actions">
                  {/* Reorder controls */}
                  <button aria-label="Move up"
                    onClick={() => handleMoveType(idx, "up")}
                    disabled={idx === 0}
                    className="ui-icon-button ui-row-action bg-ui-section hover:bg-ui-ink/10 text-ui-ink/40 disabled:opacity-30 transition-all"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button aria-label="Move down"
                    onClick={() => handleMoveType(idx, "down")}
                    disabled={idx === types.length - 1}
                    className="ui-icon-button ui-row-action bg-ui-section hover:bg-ui-ink/10 text-ui-ink/40 disabled:opacity-30 transition-all"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  {/* Delete category */}
                  <button aria-label="Delete"
                    onClick={() => triggerDeleteType(t)}
                    disabled={types.length <= 1}
                    className="ui-icon-button ui-row-action bg-zinc-50 hover:bg-rose-50 text-ui-ink/40 hover:text-rose-600 dark:bg-zinc-900/80 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 flex items-center justify-center transition-all disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Formula section */}
        <div className="ui-section-card bg-ui-section p-6 sm:p-8 rounded-[32px] space-y-6 transition-colors duration-200">
          <div>
            <span className="ui-section-title text-[10px] uppercase font-black tracking-widest text-ui-muted">
              Priority Formula
            </span>
          </div>

          <div className="ui-setting-fields ui-item-card bg-ui-surface rounded-2xl border border-ui-border space-y-4 text-sm font-semibold">
            {/* Weight Inputs */}
            {[
              { label: "Priority weight", field: "priority" as const, val: priorityW, set: setPriorityW },
              { label: "Motivation weight", field: "pleasure" as const, val: pleasureW, set: setPleasureW },
              { label: "Shortness weight", field: "shortness" as const, val: shortnessW, set: setShortnessW },
              { label: "Freshness weight", field: "freshness" as const, val: freshnessW, set: setFreshnessW },
              { label: "Backlog weight", field: "backlog" as const, val: backlogW, set: setBacklogW },
            ].map((f, i) => (
              <div key={i} className="ui-setting-row flex justify-between items-center gap-4">
                <span className="text-ui-ink/70">{f.label}</span>
                <input
                  type="text"
                  value={f.val}
                  onChange={(e) => {
                    f.set(e.target.value);
                    handleUpdateFormula(f.field, e.target.value);
                  }}
                  className="ui-field w-20 px-3 py-1.5 rounded-xl bg-ui-section border border-ui-border text-right text-ui-text font-bold focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>
            ))}

            {/* Weights total info */}
            <div className="ui-meta pt-3 border-t border-ui-border flex justify-between text-xs text-ui-ink/40 font-bold">
              <span>Total (1.0)</span>
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
          <div className="ui-section-card bg-ui-section p-6 sm:p-8 rounded-[32px] space-y-6 transition-colors duration-200">
            <div>
              <span className="ui-section-title text-[10px] uppercase font-black tracking-widest text-ui-muted">
                Default category
              </span>
            </div>

            <div className="relative">
              <select
                aria-label="Default category" value={settings.defaultTypeId || ""}
                onChange={(e) => saveSettings({ ...settings, defaultTypeId: e.target.value })}
                className="ui-field ui-field-trailing w-full pl-4 pr-10 py-3.5 rounded-2xl bg-ui-surface border border-ui-border text-ui-text focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white appearance-none text-sm font-bold shadow-sm"
                id="settings-default-type-select"
              >
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ui-ink/40">
                <ChevronDown className="w-5 h-5" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Score Display Settings */}
      {settings && (
        <div className="ui-section-card bg-ui-section p-6 sm:p-8 rounded-[32px] space-y-6 transition-colors duration-200" id="settings-score-display">
          <div>
            <span className="ui-section-title text-[10px] uppercase font-black tracking-widest text-ui-muted">
              Score Visibility
            </span>
          </div>

          <div className="bg-ui-surface rounded-2xl border border-ui-border overflow-hidden divide-y divide-ui-border shadow-sm">
            {/* Hide Score Per Category */}
            <div className="ui-setting-row p-5 flex justify-between items-center gap-4">
              <div className="space-y-0.5 pr-2">
                <div className="font-bold text-sm text-ui-text">
                  Hide score per category
                </div>
              </div>
              <SettingsSwitch checked={settings.hideCategoryScore ?? true} onClick={() => {
                  const current = settings.hideCategoryScore ?? true;
                  saveSettings({
                    ...settings,
                    hideCategoryScore: !current,
                  });
                }} label="Hide score per category" id="toggle-hide-category-score" />
            </div>

            {/* Hide Overall Score */}
            <div className="ui-setting-row p-5 flex justify-between items-center gap-4">
              <div className="space-y-0.5 pr-2">
                <div className="font-bold text-sm text-ui-text">
                  Hide overall score
                </div>
              </div>
              <SettingsSwitch checked={settings.hideOverallScore ?? true} onClick={() => {
                  const current = settings.hideOverallScore ?? true;
                  saveSettings({
                    ...settings,
                    hideOverallScore: !current,
                  });
                }} label="Hide overall score" id="toggle-hide-overall-score" />
            </div>
          </div>
        </div>
      )}

      {/* 2. Appearance */}
      {settings && (
        <div className="ui-section-card bg-ui-section p-6 sm:p-8 rounded-[32px] space-y-6 transition-colors duration-200" id="settings-appearance">
          <div>
            <span className="ui-section-title text-[10px] uppercase font-black tracking-widest text-ui-muted">
              Appearance
            </span>
          </div>

          <div className="ui-setting-row ui-item-card flex justify-between items-center bg-ui-surface p-5 rounded-2xl border border-ui-border shadow-sm font-bold text-sm">
            <span className="text-ui-ink/70">Dark Mode</span>
            <SettingsSwitch checked={settings.theme === "dark"} onClick={() => saveSettings({ ...settings, theme: settings.theme === "dark" ? "light" : "dark" })} label="Dark Mode" id="theme-toggle-switch" />
          </div>
        </div>
      )}

      {/* 3. Account */}
      <div id="settings-account">
        {!user ? (
          /* Signed Out card */
          <div className="ui-section-card bg-ui-section p-8 rounded-[32px] space-y-6 transition-colors duration-200">
            <div>
              <span className="ui-section-title text-[10px] uppercase font-black tracking-widest text-ui-muted">
                Account
              </span>
              <h2 className="text-xl font-bold tracking-tight text-ui-text mt-1">
                Sign in or Create account
              </h2>
            </div>

            <ValidatedForm onSubmit={handleAuthSubmit} className="space-y-4">
              {/* Email */}
              <div className="relative flex items-center">
                <span className="absolute left-4 text-ui-ink/40">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="ui-field ui-field-leading w-full pl-12 pr-4 py-3.5 rounded-2xl bg-ui-surface border border-ui-border text-ui-text placeholder-ui-ink/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-sm font-semibold shadow-sm"
                />
              </div>

              {/* Password */}
              <div className="relative flex items-center">
                <span className="absolute left-4 text-ui-ink/40">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="ui-field ui-field-leading ui-field-trailing w-full pl-12 pr-12 py-3.5 rounded-2xl bg-ui-surface border border-ui-border text-ui-text placeholder-ui-ink/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-sm font-semibold shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 text-ui-ink/40 hover:text-ui-ink/60 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {authError && (
                <div role="alert" className="ui-error p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs font-bold rounded-2xl flex items-center gap-2">
                  <CircleAlert className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={authFormLoading}
                className="ui-button ui-button-primary w-full py-3.5 rounded-2xl bg-ui-primary text-ui-primary-text font-bold text-sm hover:opacity-90 transition-all shadow-md disabled:opacity-50"
              >
                {authFormLoading ? "Loading..." : isSignUp ? "Create account" : "Sign in"}
              </button>
            </ValidatedForm>

            <div className="text-center">
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError(null);
                }}
                className="text-xs font-bold text-ui-ink/40 hover:text-ui-text dark:text-ui-ink/40 dark:hover:text-ui-ink/70"
              >
                {isSignUp ? "Already have an account? Sign in" : "New here? Create account"}
              </button>
            </div>
          </div>
        ) : (
          /* Signed In card */
          <div className="ui-section-card bg-ui-section p-6 sm:p-8 rounded-[32px] transition-colors duration-200">
            <div className="ui-item-card flex items-center gap-4 bg-ui-surface p-5 rounded-2xl border border-ui-border shadow-sm">
              <div className="w-12 h-12 rounded-full bg-ui-primary text-ui-primary-text flex items-center justify-center shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div>
                <span className="ui-section-title text-[10px] uppercase font-black tracking-widest text-ui-muted block">
                  Account
                </span>
                <span className="text-base font-bold text-ui-text block mt-0.5">
                  {user.email || "Simulated Local User"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Actions */}
      <div className="space-y-3" id="settings-actions">
        <span className="ui-section-title text-[10px] uppercase font-black tracking-widest text-ui-muted px-4 block">
          Actions
        </span>

        {/* 1. Disconnect / Sign out */}
        {user && (
          <button
            onClick={signOut}
            className="ui-setting-action ui-setting-action--simple w-full text-left p-6 rounded-[24px] bg-ui-section hover:bg-black/10 dark:hover:bg-white/10 flex items-center gap-4 transition-all font-bold text-sm shadow-sm"
            id="action-signout"
          >
            <div className="w-10 h-10 rounded-full bg-ui-section text-ui-ink/70 flex items-center justify-center shrink-0">
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
          className="ui-setting-action ui-setting-action--simple w-full text-left p-6 rounded-[24px] bg-ui-section hover:bg-black/10 dark:hover:bg-white/10 flex items-center gap-4 transition-all font-bold text-sm shadow-sm disabled:opacity-50"
          id="action-export-csv"
        >
          <div className="w-10 h-10 rounded-full bg-ui-section text-ui-ink/70 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <span>Download data as CSV</span>
          </div>
        </button>

        {/* 3. Reset data */}
        <button
          onClick={() => setIsResetModalOpen(true)}
          className="ui-setting-action ui-setting-action--simple w-full text-left p-6 rounded-[24px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-4 transition-all font-bold text-sm shadow-sm"
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
      <div className="ui-meta pt-8 pb-12 flex flex-col items-center text-center gap-6 text-ui-muted text-xs font-bold transition-all" id="settings-footer-credits">
        {/* Support Button */}
        <a
          href={SUPPORT_URL}
          target="_blank"
          referrerPolicy="no-referrer"
          rel="noopener noreferrer"
          className="bg-ui-primary text-ui-primary-text px-6 py-3.5 rounded-full flex items-center gap-2 text-sm shadow-md hover:opacity-90 transition-all"
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
          <p className="text-ui-text font-black text-sm tracking-tight mt-1">
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
        <Dialog open onClose={() => setDeletingType(null)} title={`Delete "${deletingType.label}" Category?`}>
            <p className="ui-meta text-sm font-semibold text-ui-muted">
              Move its items to another category.
            </p>

            <div className="relative">
              <select
                value={reassignTargetId}
                onChange={(e) => setReassignTargetId(e.target.value)}
                className="ui-field ui-field-trailing w-full pl-4 pr-10 py-3.5 rounded-2xl bg-ui-section border border-ui-border text-ui-text focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white appearance-none text-sm font-bold shadow-sm"
              >
                {types
                  .filter((t) => t.id !== deletingType.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ui-ink/40">
                <ChevronDown className="w-4 h-4" />
              </span>
            </div>

            <DialogActions>
              <button
                onClick={() => setDeletingType(null)}
                className="ui-button ui-button-secondary px-5 py-3.5 rounded-2xl bg-ui-section text-ui-text text-sm font-bold shadow-sm "
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteType}
                className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md "
              >
                Reassign & Delete
              </button>
            </DialogActions>
        </Dialog>
      )}

      {/* RESET CONFIRMATION MODAL */}
      {isResetModalOpen && (
        <Dialog open onClose={() => setIsResetModalOpen(false)} title="Reset data" id="reset-modal-container">
            <p className="ui-meta text-sm font-bold text-ui-muted leading-relaxed">
              This action is permanent.
            </p>

            <DialogActions>
              <button
                onClick={async () => {
                  await clearHistory();
                  setIsResetModalOpen(false);
                }}
                className="ui-button ui-button-secondary w-full py-4 rounded-2xl bg-ui-section text-ui-text hover:bg-ui-ink/10 text-sm font-bold transition-all shadow-sm"
                id="reset-clear-history-btn"
              >
                Clear History
              </button>
              <button
                onClick={async () => {
                  await resetAllData();
                  setIsResetModalOpen(false);
                }}
                className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-all shadow-md"
                id="reset-all-data-btn"
              >
                Reset All
              </button>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="ui-button ui-button-primary w-full py-4 rounded-2xl bg-ui-primary text-ui-primary-text text-sm font-bold transition-all shadow-sm"
                id="reset-cancel-btn"
              >
                Cancel
              </button>
            </DialogActions>
        </Dialog>
      )}
    </div>
  );
};
