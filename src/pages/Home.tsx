/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { useKult } from "../providers";
import { ContentItem, ContentType } from "../types";
import { ContentItemModal } from "../components/ContentItemModal";
import { Plus, Play, CheckCircle2, Bookmark, Flame, Star, Heart, Hourglass, Edit3, Calendar } from "lucide-react";

export const HomePage: React.FC = () => {
  const { items, types, settings, updateItem } = useKult();
  
  // Tab states
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);

  // Initialize selectedTypeId when types load
  useEffect(() => {
    if (types.length > 0) {
      if (settings?.defaultTypeId && types.some((t) => t.id === settings.defaultTypeId)) {
        setSelectedTypeId(settings.defaultTypeId);
      } else {
        setSelectedTypeId(types[0].id);
      }
    }
  }, [types, settings]);

  // Filter items: only status "to_complete" and "ongoing" and matches typeId
  const filteredItems = useMemo(() => {
    return items
      .filter(
        (item) =>
          item.typeId === selectedTypeId &&
          (item.status === "to_complete" || item.status === "ongoing")
      )
      .sort((a, b) => b.effectivePriority - a.effectivePriority); // order by effectivePriority descending
  }, [items, selectedTypeId]);

  const selectedTypeLabel = useMemo(() => {
    return types.find((t) => t.id === selectedTypeId)?.label || "";
  }, [types, selectedTypeId]);

  // Fast Status Toggles
  const handleMarkCompleted = async (itemId: string) => {
    await updateItem(itemId, {
      status: "completed",
      completedDate: new Date().toISOString().split("T")[0],
    });
  };

  const handleMarkOngoing = async (itemId: string) => {
    await updateItem(itemId, { status: "ongoing" });
  };

  const handleMarkToComplete = async (itemId: string) => {
    await updateItem(itemId, { status: "to_complete" });
  };

  const handleEditItemClick = (item: ContentItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleAddItemClick = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50" id="home-title">
          Kult
        </h1>
        <button
          onClick={handleAddItemClick}
          className="w-12 h-12 rounded-full bg-black text-white dark:bg-white dark:text-black flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-md shrink-0"
          title="Add content"
          id="home-add-btn"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>
      </div>

      {/* Chip selector for Content Types */}
      {types.length > 0 && (
        <div className="overflow-x-auto -mx-4 px-4 pb-2 scrollbar-none flex gap-2" id="type-chip-selector">
          {types.map((t) => {
            const isActive = t.id === selectedTypeId;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTypeId(t.id)}
                className={`px-5 py-3 rounded-2xl text-sm font-bold tracking-tight whitespace-nowrap transition-all duration-200 active:scale-95 ${
                  isActive
                    ? "bg-black text-white dark:bg-white dark:text-black shadow-sm"
                    : "bg-black/5 text-zinc-600 dark:bg-white/5 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Content Section */}
      <div className="bg-black/5 dark:bg-white/5 p-6 sm:p-8 rounded-[32px] transition-colors duration-200">
        <div className="flex justify-between items-baseline mb-6">
          <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400 dark:text-zinc-500">
            {selectedTypeLabel || "Cultural Items"} — {filteredItems.length} Backlog
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="text-center py-12 space-y-4" id="home-empty-state">
            <div className="mx-auto w-16 h-16 rounded-full bg-white dark:bg-zinc-900/60 flex items-center justify-center text-zinc-300 dark:text-zinc-700">
              <Bookmark className="w-8 h-8" />
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-base">
              No items to complete in this category.
            </p>
            <button
              onClick={handleAddItemClick}
              className="px-5 py-2.5 rounded-2xl bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 text-sm font-bold shadow-sm active:scale-95 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all"
            >
              Add first item
            </button>
          </div>
        ) : (
          <div className="space-y-4" id="home-items-list">
            {filteredItems.map((item) => {
              const isOngoing = item.status === "ongoing";
              return (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-black/20 p-5 rounded-2xl border transition-all relative ${
                    isOngoing
                      ? "border-amber-500/50 dark:border-amber-500/30 ring-2 ring-amber-500/10"
                      : "border-zinc-100 dark:border-zinc-900"
                  }`}
                  id={`item-card-${item.id}`}
                >
                  <div className="space-y-3 pr-20">
                    {/* Title and Author */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 leading-tight">
                          {item.title}
                        </h3>
                        {isOngoing && (
                          <span className="inline-flex bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full items-center gap-1 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                            Ongoing
                          </span>
                        )}
                      </div>
                      {item.author && (
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">
                          by {item.author}
                        </p>
                      )}
                    </div>

                    {/* Metadata indicators */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      {/* Effective priority score */}
                      <div className="flex items-center gap-1 text-black dark:text-white bg-black/5 dark:bg-white/5 px-2 py-1 rounded-lg">
                        <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                        <span>EP {item.effectivePriority.toFixed(1)}</span>
                      </div>

                      {/* Detail metrics */}
                      <div className="flex items-center gap-2.5 bg-zinc-50 dark:bg-zinc-900/60 px-2 py-1 rounded-lg border border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center gap-0.5" title="Priority">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span className="text-[10px]">{item.priority}</span>
                        </div>
                        <div className="flex items-center gap-0.5" title="Motivation">
                          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                          <span className="text-[10px]">{item.pleasure}</span>
                        </div>
                        <div className="flex items-center gap-0.5" title="Length">
                          <Hourglass className="w-3 h-3 text-indigo-500" />
                          <span className="text-[10px]">{item.length}</span>
                        </div>
                      </div>

                      {/* Date indicator */}
                      <div className="flex items-center gap-1 font-medium text-zinc-400">
                        <Calendar className="w-3 h-3" />
                        <span>Added {item.addedDate}</span>
                      </div>
                    </div>

                    {/* Keywords tags */}
                    {item.keywords && item.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.keywords.map((word, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2.5 py-0.5 rounded-full"
                          >
                            #{word}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Note indicator */}
                    {item.note && (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 italic line-clamp-2 mt-1 bg-zinc-50/50 dark:bg-zinc-900/30 p-2.5 rounded-xl border border-dashed border-zinc-100 dark:border-zinc-800">
                        "{item.note}"
                      </p>
                    )}
                  </div>

                  {/* Actions Column on the Right */}
                  <div className="absolute right-4 bottom-4 flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleEditItemClick(item)}
                      className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-all active:scale-90"
                      title="Edit Item"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {isOngoing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMarkToComplete(item.id)}
                          className="w-10 h-10 rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center transition-all active:scale-90"
                          title="Pause / Set to backlog"
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMarkCompleted(item.id)}
                          className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-black flex items-center justify-center transition-all active:scale-90"
                          title="Mark completed"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMarkOngoing(item.id)}
                          className="w-10 h-10 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-all active:scale-90"
                          title="Start completing"
                        >
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </button>
                        <button
                          onClick={() => handleMarkCompleted(item.id)}
                          className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-black flex items-center justify-center transition-all active:scale-90"
                          title="Mark completed"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
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
