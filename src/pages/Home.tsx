import { ActionButton } from '@3gaspo/app-ui/ActionButton';
import { formatDate, formatNumber } from '@3gaspo/app-ui/formats';
import { StateFeedback } from '../components/StateFeedback';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { useKult } from "../providers";
import { ContentItem, ContentType } from "../types";
import { ContentItemModal } from "../components/ContentItemModal";
import { FloatingAddButton } from '../components/FloatingAddButton';
import { Play, CheckCircle2, Bookmark, Flame, Star, Heart, Hourglass, Edit3, Calendar } from "lucide-react";

export const HomePage: React.FC = () => {
  const { items, types, settings, updateItem, dataLoading } = useKult();
  
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

  const isCategoryScoreHidden = settings?.hideCategoryScore !== false;

  const categoryAvgScore = useMemo(() => {
    if (filteredItems.length === 0) return "0.0";
    const sum = filteredItems.reduce((acc, i) => acc + i.effectivePriority, 0);
    return (sum / filteredItems.length).toFixed(1);
  }, [filteredItems]);

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
    <div className="app-home-content space-y-6">
      {/* Header */}
      <header className="app-home-header">
        <h1 className="app-brand-title" id="home-title">
          Kult
        </h1>
      </header>

      {/* Chip selector for Content Types */}
      {types.length > 0 && (
        <div className="ui-chips overflow-x-auto -mx-4 px-4 pb-2 scrollbar-none flex gap-2" id="type-chip-selector">
          {types.map((t) => {
            const isActive = t.id === selectedTypeId;
            return (
              <ActionButton
                key={t.id}
                aria-pressed={isActive}
                onClick={() => setSelectedTypeId(t.id)}
                className="ui-option"
              >
                {t.label}
              </ActionButton>
            );
          })}
        </div>
      )}

      {/* Content Section */}
      <div className="ui-section-card bg-ui-section p-6 sm:p-8 rounded-[32px] transition-colors duration-200">
        <div className="flex justify-between items-baseline mb-6">
          <span className="ui-section-title text-[10px] uppercase font-black tracking-widest text-ui-muted">
            {selectedTypeLabel || "Cultural Items"} — {filteredItems.length} Backlog
          </span>
          {!isCategoryScoreHidden && filteredItems.length > 0 && (
            <span className="ui-meta inline-flex items-center gap-1 text-[10px] font-bold text-ui-ink/60 bg-ui-section px-2.5 py-1 rounded-full">
              <Flame className="w-3 h-3 fill-rose-500 text-rose-500" />
              Avg EP {categoryAvgScore}
            </span>
          )}
        </div>

        {dataLoading ? <StateFeedback kind="loading" /> : filteredItems.length === 0 ? (
          <div id="home-empty-state"><StateFeedback title="No items to complete">
            <ActionButton
              onClick={handleAddItemClick}
              className="ui-button ui-button-secondary px-5 py-2.5 rounded-2xl bg-ui-surface text-ui-text border border-ui-border text-sm font-bold shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-all"
            >
              Add first item
            </ActionButton>
          </StateFeedback></div>
        ) : (
          <div className="space-y-4" id="home-items-list">
            {filteredItems.map((item) => {
              const isOngoing = item.status === "ongoing";
              return (
                <div
                  key={item.id}
                  className={"ui-item-card " + (`bg-ui-surface p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isOngoing
                      ? "border-amber-500/50 dark:border-amber-500/30 ring-2 ring-amber-500/10"
                      : "border-ui-border"
                  }`)}
                  id={`item-card-${item.id}`}
                >
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Title and Author */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="ui-item-title font-bold text-lg text-ui-text leading-tight">
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
                        <p className="ui-meta text-sm font-medium text-ui-muted mt-0.5">
                          by {item.author}
                        </p>
                      )}
                    </div>

                    {/* Metadata indicators */}
                    <div className="ui-meta flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-semibold text-ui-muted">
                      {/* Effective priority score */}
                      {!isCategoryScoreHidden && (
                        <div className="flex items-center gap-1 text-ui-ink bg-ui-section px-2 py-1 rounded-lg">
                          <Flame className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                          <span>EP {formatNumber(item.effectivePriority, 1)}</span>
                        </div>
                      )}

                      {/* Detail metrics */}
                      {!isCategoryScoreHidden && (
                        <div className="flex items-center gap-2.5 bg-ui-section px-2 py-1 rounded-lg border border-ui-border">
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
                      )}

                      {/* Date indicator */}
                      <div className="flex items-center gap-1 font-medium text-ui-ink/40">
                        <Calendar className="w-3 h-3" />
                        <span>Added {formatDate(item.addedDate)}</span>
                      </div>
                    </div>

                    {/* Keywords tags */}
                    {item.keywords && item.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.keywords.map((word, i) => (
                          <span
                            key={i}
                            className="ui-meta text-[10px] font-bold text-ui-muted bg-ui-section px-2.5 py-0.5 rounded-full"
                          >
                            #{word}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Note indicator */}
                    {item.note && (
                      <p className="ui-meta text-xs text-ui-muted italic line-clamp-2 mt-1 bg-ui-section p-2.5 rounded-xl border border-dashed border-ui-border">
                        "{item.note}"
                      </p>
                    )}
                  </div>

                  {/* Actions Row on the Right */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <ActionButton
                      onClick={() => handleEditItemClick(item)}
                      className="ui-icon-button w-10 h-10 rounded-full bg-ui-section hover:bg-ui-ink/10 text-ui-ink/60 flex items-center justify-center transition-all "
                      title="Edit content"
                    >
                      <Edit3 className="w-4 h-4" />
                    </ActionButton>

                    {isOngoing ? (
                      <ActionButton
                        onClick={() => handleMarkToComplete(item.id)}
                        className="ui-icon-button w-10 h-10 rounded-full bg-ui-section hover:bg-ui-ink/10 text-ui-ink/60 flex items-center justify-center transition-all "
                        title="Pause / Set to backlog"
                      >
                        <Bookmark className="w-4 h-4" />
                      </ActionButton>
                    ) : (
                      <ActionButton
                        onClick={() => handleMarkOngoing(item.id)}
                        className="ui-icon-button w-10 h-10 rounded-full bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center transition-all "
                        title="Start completing"
                      >
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </ActionButton>
                    )}

                    <ActionButton
                      onClick={() => handleMarkCompleted(item.id)}
                      className="ui-icon-button w-10 h-10 rounded-full bg-ui-primary hover:bg-ui-primary-hover text-ui-primary-text flex items-center justify-center transition-all "
                      title="Mark completed"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </ActionButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Content Modal */}
      <FloatingAddButton label="Add content" id="home-add-btn" onClick={handleAddItemClick} />
      <ContentItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        itemToEdit={editingItem}
      />
    </div>
  );
};
