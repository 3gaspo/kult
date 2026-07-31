/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { useKult } from "../providers";
import { ContentItem } from "../types";
import { ContentItemModal } from "../components/ContentItemModal";
import { Search, ChevronDown, CheckCircle, Calendar, RefreshCcw, Edit3, Film, ArrowUpCircle, Flame } from "lucide-react";

export const HistoryPage: React.FC = () => {
  const { items, types, settings, updateItem } = useKult();

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

  // Get completed items only
  const completedItems = useMemo(() => {
    return items.filter((i) => i.status === "completed");
  }, [items]);

  // Extract all available completed years for filtering
  const years = useMemo(() => {
    const yearsSet = new Set<string>();
    completedItems.forEach((item) => {
      if (item.completedDate) {
        try {
          const year = item.completedDate.split("-")[0];
          if (year && !isNaN(Number(year))) {
            yearsSet.add(year);
          }
        } catch {}
      }
    });
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a)); // Sort descending
  }, [completedItems]);

  // Filter completed items based on user inputs
  const filteredCompletedItems = useMemo(() => {
    return completedItems
      .filter((item) => {
        // 1. Filter by content type
        if (selectedTypeId !== "all" && item.typeId !== selectedTypeId) {
          return false;
        }

        // 2. Filter by completion year
        if (selectedYear !== "all") {
          const itemYear = item.completedDate?.split("-")[0];
          if (itemYear !== selectedYear) {
            return false;
          }
        }

        // 3. Search query: checks title, author, and keywords
        if (searchQuery.trim() !== "") {
          const query = searchQuery.toLowerCase().trim();
          const matchesTitle = item.title.toLowerCase().includes(query);
          const matchesAuthor = item.author?.toLowerCase().includes(query) || false;
          const matchesKeywords = item.keywords.some((k) =>
            k.toLowerCase().includes(query)
          );
          if (!matchesTitle && !matchesAuthor && !matchesKeywords) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        // sort by completedDate descending, then updatedAt descending
        const dateA = a.completedDate || "";
        const dateB = b.completedDate || "";
        if (dateA !== dateB) {
          return dateB.localeCompare(dateA);
        }
        const updateA = a.updatedAt || "";
        const updateB = b.updatedAt || "";
        return updateB.localeCompare(updateA);
      });
  }, [completedItems, selectedTypeId, selectedYear, searchQuery]);

  const handleReopenItem = async (itemId: string, status: "to_complete" | "ongoing") => {
    await updateItem(itemId, {
      status,
      completedDate: undefined, // Clear completed date when moving back
    });
  };

  const handleEditClick = (item: ContentItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50" id="history-title">
          History
        </h1>
      </div>

      {/* Filter and Search Box */}
      <div className="bg-black/5 dark:bg-white/5 p-6 rounded-[32px] space-y-4 transition-colors duration-200">
        {/* Search Field */}
        <div className="relative flex items-center">
          <span className="absolute left-4 text-zinc-400 dark:text-zinc-500">
            <Search className="w-5 h-5" />
          </span>
          <input
            type="text"
            placeholder="Search completed items, creators, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-sm font-medium shadow-sm"
            id="history-search-input"
          />
        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Category Dropdown */}
          <div className="space-y-1">
            <div className="relative">
              <select
                value={selectedTypeId}
                onChange={(e) => setSelectedTypeId(e.target.value)}
                className="w-full pl-4 pr-10 py-3.5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white appearance-none text-sm font-bold shadow-sm"
                id="history-type-filter"
              >
                <option value="all">All Categories</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                <ChevronDown className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* Year Dropdown */}
          <div className="space-y-1">
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full pl-4 pr-10 py-3.5 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white appearance-none text-sm font-bold shadow-sm"
                id="history-year-filter"
              >
                <option value="all">All Years</option>
                {years.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                <ChevronDown className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="bg-black/5 dark:bg-white/5 p-6 sm:p-8 rounded-[32px] transition-colors duration-200">
        <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500 mb-6 block">
          Completed Items — {filteredCompletedItems.length} entries
        </span>

        {filteredCompletedItems.length === 0 ? (
          <div className="text-center py-12 space-y-4" id="history-empty-state">
            <div className="mx-auto w-16 h-16 rounded-full bg-white dark:bg-zinc-900/60 flex items-center justify-center text-zinc-300 dark:text-zinc-700">
              <CheckCircle className="w-8 h-8" />
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-base">
              No completed items match the selected criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-4" id="history-items-list">
            {filteredCompletedItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-black/20 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-900 flex justify-between items-start gap-4 transition-all"
                id={`completed-card-${item.id}`}
              >
                <div className="space-y-2 pr-12">
                  {/* Category Pill and Date */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                      {item.typeLabel}
                    </span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-md">
                      <Calendar className="w-3 h-3" />
                      <span>Completed {item.completedDate}</span>
                    </span>
                    {settings?.hideOverallScore === false && (
                      <span className="text-xs font-bold text-black dark:text-white bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-rose-500 text-rose-500" />
                        <span>EP {item.effectivePriority.toFixed(1)}</span>
                      </span>
                    )}
                  </div>

                  {/* Title and Author */}
                  <div>
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 leading-tight">
                      {item.title}
                    </h3>
                    {item.author && (
                      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        by {item.author}
                      </p>
                    )}
                  </div>

                  {/* Keywords */}
                  {item.keywords && item.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.keywords.map((word, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500"
                        >
                          #{word}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Notes */}
                  {item.note && (
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 italic bg-zinc-50/50 dark:bg-zinc-900/30 p-2.5 rounded-xl border border-dashed border-zinc-100 dark:border-zinc-800 line-clamp-2">
                      "{item.note}"
                    </p>
                  )}
                </div>

                {/* Quick actions on Right */}
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleEditClick(item)}
                    className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-all active:scale-90"
                    title="Edit Item details"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <div className="group relative">
                    <button
                      className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-all active:scale-90"
                      title="Move back / Reopen"
                    >
                      <RefreshCcw className="w-4 h-4" />
                    </button>
                    {/* Floating dropdown options for reopening */}
                    <div className="absolute right-0 top-11 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 py-1.5 z-10 hidden group-hover:block hover:block w-36 overflow-hidden">
                      <button
                        onClick={() => handleReopenItem(item.id, "to_complete")}
                        className="w-full px-4 py-2 text-left text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        Reopen to Backlog
                      </button>
                      <button
                        onClick={() => handleReopenItem(item.id, "ongoing")}
                        className="w-full px-4 py-2 text-left text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        Reopen to Ongoing
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Content Modal */}
      <ContentItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        itemToEdit={editingItem}
      />
    </div>
  );
};
