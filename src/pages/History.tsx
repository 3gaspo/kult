import { formatDate, formatNumber } from '@3gaspo/app-ui/formats';
import { SearchField } from '../components/SearchField';
import { ActionMenu } from '../components/ActionMenu';
import { StateFeedback } from '../components/StateFeedback';
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
        <h1 className="text-4xl font-bold tracking-tight text-ui-text" id="history-title">
          History
        </h1>
      </div>

      {/* Filter and Search Box */}
      <div className="ui-section-card bg-ui-section p-6 rounded-[32px] space-y-4 transition-colors duration-200">
        {/* Search Field */}
        <SearchField label="Search completed items, creators and keywords" value={searchQuery} onChange={setSearchQuery} id="history-search-input" />

        {/* Dropdowns Row */}
        <div className="ui-filter-grid grid grid-cols-2 gap-4">
          {/* Category Dropdown */}
          <div className="space-y-1">
            <div className="relative">
              <select
                value={selectedTypeId}
                onChange={(e) => setSelectedTypeId(e.target.value)}
                className="ui-field ui-field-trailing w-full pl-4 pr-10 py-3.5 rounded-2xl bg-ui-surface border border-ui-border text-ui-text focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white appearance-none text-sm font-bold shadow-sm"
                aria-label="Category" id="history-type-filter"
              >
                <option value="all">All Categories</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ui-ink/40">
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
                className="ui-field ui-field-trailing w-full pl-4 pr-10 py-3.5 rounded-2xl bg-ui-surface border border-ui-border text-ui-text focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white appearance-none text-sm font-bold shadow-sm"
                aria-label="Year" id="history-year-filter"
              >
                <option value="all">All Years</option>
                {years.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
              <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ui-ink/40">
                <ChevronDown className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="ui-section-card bg-ui-section p-6 sm:p-8 rounded-[32px] transition-colors duration-200">
        <span className="ui-section-title text-[10px] uppercase font-black tracking-widest text-ui-muted mb-6 block">
          Completed Items — {filteredCompletedItems.length} entries
        </span>

        {filteredCompletedItems.length === 0 ? (
          <div id="history-empty-state"><StateFeedback title="No completed items" /></div>
        ) : (
          <div className="space-y-4" id="history-items-list">
            {filteredCompletedItems.map((item) => {
              return (
                <div
                  key={item.id}
                  className="ui-item-card bg-ui-surface p-5 rounded-2xl border border-ui-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
                  id={`completed-card-${item.id}`}
                >
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Category Pill and Date */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="ui-section-title text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-ui-section text-ui-muted">
                        {item.typeLabel}
                      </span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-md">
                        <Calendar className="w-3 h-3" />
                        <span>Completed {formatDate(item.completedDate || '')}</span>
                      </span>
                      {settings?.hideOverallScore === false && (
                        <span className="text-xs font-bold text-ui-ink bg-ui-section px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Flame className="w-3 h-3 fill-rose-500 text-rose-500" />
                          <span>EP {formatNumber(item.effectivePriority, 1)}</span>
                        </span>
                      )}
                    </div>

                    {/* Title and Author */}
                    <div>
                      <h3 className="ui-item-title font-bold text-lg text-ui-text leading-tight">
                        {item.title}
                      </h3>
                      {item.author && (
                        <p className="ui-meta text-sm font-medium text-ui-muted">
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
                            className="ui-meta text-[10px] font-bold text-ui-muted"
                          >
                            #{word}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Notes */}
                    {item.note && (
                      <p className="ui-meta text-xs text-ui-muted italic bg-ui-section p-2.5 rounded-xl border border-dashed border-ui-border line-clamp-2">
                        "{item.note}"
                      </p>
                    )}
                  </div>

                  {/* Quick actions on Right */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="ui-icon-button w-10 h-10 rounded-full bg-ui-section hover:bg-ui-ink/10 text-ui-ink/60 flex items-center justify-center transition-all "
                      title="Edit content"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <ActionMenu label="Reopen content" icon={<RefreshCcw size={20} />} items={[
                      { label: 'Backlog', onSelect: () => handleReopenItem(item.id, 'to_complete') },
                      { label: 'Ongoing', onSelect: () => handleReopenItem(item.id, 'ongoing') },
                    ]} />
                  </div>
                </div>
              );
            })}
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
