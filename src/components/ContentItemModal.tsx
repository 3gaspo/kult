import { ActionButton } from '@3gaspo/app-ui/ActionButton';
import { ValidatedForm } from './ValidatedForm';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useId } from "react";
import { ContentItem, ContentType } from "../types";
import { useKult } from "../providers";
import { Dialog, DialogActions } from './Dialog';
import { Trash2, ChevronDown, Calendar, Star, Heart, Hourglass } from "lucide-react";

interface ContentItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: ContentItem | null;
}

export const ContentItemModal: React.FC<ContentItemModalProps> = ({
  isOpen,
  onClose,
  itemToEdit,
}) => {
  const formId = useId();
  const { types, settings, addItem, updateItem, deleteItem } = useKult();

  // Form States
  const [title, setTitle] = useState("");
  const [typeId, setTypeId] = useState("");
  const [author, setAuthor] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [addedDate, setAddedDate] = useState("");
  const [status, setStatus] = useState<"to_complete" | "ongoing" | "completed">("to_complete");
  const [completedDate, setCompletedDate] = useState("");
  const [note, setNote] = useState("");
  const [keywordsStr, setKeywordsStr] = useState("");
  
  // Rating States (1 to 5)
  const [priority, setPriority] = useState<number>(3);
  const [pleasure, setPleasure] = useState<number>(3);
  const [length, setLength] = useState<number>(3);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize state on edit / reset on add
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setShowConfirmDelete(false);
      
      if (itemToEdit) {
        setTitle(itemToEdit.title);
        setTypeId(itemToEdit.typeId);
        setAuthor(itemToEdit.author || "");
        setPublishedDate(itemToEdit.publishedDate || "");
        setAddedDate(itemToEdit.addedDate);
        setStatus(itemToEdit.status);
        setCompletedDate(itemToEdit.completedDate || "");
        setNote(itemToEdit.note || "");
        setKeywordsStr(itemToEdit.keywords.join(", "));
        setPriority(itemToEdit.priority || 3);
        setPleasure(itemToEdit.pleasure || 3);
        setLength(itemToEdit.length || 3);
      } else {
        setTitle("");
        // Set default type from settings (if it exists) or first available type
        const defaultType = (settings?.defaultTypeId && types.some((t) => t.id === settings.defaultTypeId))
          ? settings.defaultTypeId
          : (types.length > 0 ? types[0].id : "");
        setTypeId(defaultType);
        setAuthor("");
        setPublishedDate("");
        setAddedDate(new Date().toISOString().split("T")[0]);
        setStatus("to_complete");
        setCompletedDate("");
        setNote("");
        setKeywordsStr("");
        setPriority(3);
        setPleasure(3);
        setLength(3);
      }
    }
  }, [isOpen, itemToEdit, settings, types]);

  // Adjust completed date when status becomes completed
  useEffect(() => {
    if (status === "completed" && !completedDate) {
      setCompletedDate(new Date().toISOString().split("T")[0]);
    } else if (status !== "completed") {
      setCompletedDate("");
    }
  }, [status]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!typeId) {
      setError("Please select a content type.");
      return;
    }
    if (status === "completed" && !completedDate) {
      setError("Completion date is required for completed items.");
      return;
    }

    const typeLabel = types.find((t) => t.id === typeId)?.label || "Other";
    const keywords = keywordsStr
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k !== "");

    const payload = {
      title: title.trim(),
      typeId,
      typeLabel,
      author: author.trim() || undefined,
      publishedDate: publishedDate.trim() || undefined,
      addedDate,
      status,
      completedDate: status === "completed" ? completedDate : undefined,
      note: note.trim() || undefined,
      keywords,
      priority,
      pleasure,
      length,
      createdAt: itemToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (itemToEdit) {
        await updateItem(itemToEdit.id, payload);
      } else {
        const generatedId = "item_" + Math.random().toString(36).substr(2, 9);
        await addItem({ ...payload, id: generatedId });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while saving.");
    }
  };

  const handleDelete = async () => {
    if (!itemToEdit) return;
    try {
      await deleteItem(itemToEdit.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred while deleting.");
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} title={itemToEdit ? 'Edit content' : 'Add content'} id="item-modal-container" closeButtonId="close-modal-btn">
        {/* Scrollable Form Content */}
        <ValidatedForm id={formId} onSubmit={handleSave} className="space-y-6 text-ui-text">
          {error && (
            <div role="alert" className="ui-error p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-sm font-semibold rounded-2xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              {error}
            </div>
          )}

          {/* Title Input */}
          <div className="space-y-2">
            <label className="ui-field-label text-[10px] uppercase font-extrabold tracking-widest text-ui-muted">
              Title
            </label>
            <input
              type="text"
              placeholder="What's the title?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="ui-field w-full px-4 py-3.5 rounded-2xl bg-ui-section border border-ui-border text-ui-text placeholder-ui-ink/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-base shadow-sm font-medium"
              id="modal-title-input"
              required
            />
          </div>

          {/* Type and Status in Row */}
          <div className="ui-filter-grid">
            <div className="space-y-2">
              <label className="ui-field-label text-[10px] uppercase font-extrabold tracking-widest text-ui-muted">
                Type
              </label>
              <div className="relative">
                <select
                  value={typeId}
                  onChange={(e) => setTypeId(e.target.value)}
                  className="ui-field ui-field-trailing w-full pl-4 pr-10 py-3.5 rounded-2xl bg-ui-section border border-ui-border text-ui-text focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all appearance-none text-base shadow-sm font-medium"
                  id="modal-type-select"
                  required
                >
                  <option value="" disabled>Select Type</option>
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

            <div className="space-y-2">
              <label className="ui-field-label text-[10px] uppercase font-extrabold tracking-widest text-ui-muted">
                Status
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="ui-field ui-field-trailing w-full pl-4 pr-10 py-3.5 rounded-2xl bg-ui-section border border-ui-border text-ui-text focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all appearance-none text-base shadow-sm font-medium"
                  id="modal-status-select"
                >
                  <option value="to_complete">To Complete</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-ui-ink/40">
                  <ChevronDown className="w-5 h-5" />
                </span>
              </div>
            </div>
          </div>

          {/* Author / Creator */}
          <div className="space-y-2">
            <label className="ui-field-label text-[10px] uppercase font-extrabold tracking-widest text-ui-muted">
              Author / Creator
            </label>
            <input
              type="text"
              placeholder="e.g. Christopher Nolan, Haruki Murakami"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="ui-field w-full px-4 py-3.5 rounded-2xl bg-ui-section border border-ui-border text-ui-text placeholder-ui-ink/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-base shadow-sm font-medium"
              id="modal-author-input"
            />
          </div>

          {/* Published and Added Dates */}
          <div className="ui-filter-grid">
            <div className="space-y-2">
              <label className="ui-field-label text-[10px] uppercase font-extrabold tracking-widest text-ui-muted">
                Release Date / Year
              </label>
              <input
                type="text"
                placeholder="e.g. 2024 or 2024-05-15"
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
                className="ui-field w-full px-4 py-3.5 rounded-2xl bg-ui-section border border-ui-border text-ui-text placeholder-ui-ink/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-base shadow-sm font-medium"
                id="modal-pubdate-input"
              />
            </div>

            <div className="space-y-2">
              <label className="ui-field-label text-[10px] uppercase font-extrabold tracking-widest text-ui-muted">
                Added Date
              </label>
              <input
                type="date"
                value={addedDate}
                onChange={(e) => setAddedDate(e.target.value)}
                className="ui-field w-full px-4 py-3.5 rounded-2xl bg-ui-section border border-ui-border text-ui-text focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-base shadow-sm font-medium"
                id="modal-addeddate-input"
              />
            </div>
          </div>

          {/* Completed Date (Only visible when status is completed) */}
          {status === "completed" && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
              <label className="ui-field-label text-[10px] uppercase font-extrabold tracking-widest text-ui-muted">
                Completed Date
              </label>
              <input
                type="date"
                value={completedDate}
                onChange={(e) => setCompletedDate(e.target.value)}
                className="ui-field w-full px-4 py-3.5 rounded-2xl bg-ui-section border border-ui-border text-ui-text focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-base shadow-sm font-medium"
                id="modal-completeddate-input"
              />
            </div>
          )}

          {/* Metrics Selectors (Priority, Pleasure, Length) */}
          <div className="ui-rating-panel bg-ui-section p-4 rounded-[24px] space-y-4">
            {/* Priority Selector */}
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between sm:items-center">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 shrink-0" />
                <span className="text-sm font-bold text-ui-ink/70">Priority</span>
              </div>
              <div className="ui-rating-group">
                {[1, 2, 3, 4, 5].map((val) => (
                  <ActionButton
                    key={val}
                    type="button"
                    aria-pressed={priority === val} aria-label={`Priority ${val} of 5`} onClick={() => setPriority(val)}
                    className={`ui-compact-control w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center transition-all ${
                      priority === val
                        ? "bg-ui-primary text-ui-primary-text shadow-sm"
                        : "bg-ui-surface text-ui-ink/60 hover:bg-ui-ink/10"
                    }`}
                  >
                    {val}
                  </ActionButton>
                ))}
              </div>
            </div>

            {/* Pleasure Selector */}
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between sm:items-center">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 shrink-0" />
                <span className="text-sm font-bold text-ui-ink/70">Motivation</span>
              </div>
              <div className="ui-rating-group">
                {[1, 2, 3, 4, 5].map((val) => (
                  <ActionButton
                    key={val}
                    type="button"
                    aria-pressed={pleasure === val} aria-label={`Pleasure ${val} of 5`} onClick={() => setPleasure(val)}
                    className={`ui-compact-control w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center transition-all ${
                      pleasure === val
                        ? "bg-ui-primary text-ui-primary-text shadow-sm"
                        : "bg-ui-surface text-ui-ink/60 hover:bg-ui-ink/10"
                    }`}
                  >
                    {val}
                  </ActionButton>
                ))}
              </div>
            </div>

            {/* Length Selector */}
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between sm:items-center">
              <div className="flex items-center gap-2">
                <Hourglass className="w-5 h-5 text-indigo-500 shrink-0" />
                <span className="text-sm font-bold text-ui-ink/70">Length</span>
              </div>
              <div className="ui-rating-group">
                {[1, 2, 3, 4, 5].map((val) => (
                  <ActionButton
                    key={val}
                    type="button"
                    aria-pressed={length === val} aria-label={`Length ${val} of 5`} onClick={() => setLength(val)}
                    className={`ui-compact-control w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center transition-all ${
                      length === val
                        ? "bg-ui-primary text-ui-primary-text shadow-sm"
                        : "bg-ui-surface text-ui-ink/60 hover:bg-ui-ink/10"
                    }`}
                  >
                    {val}
                  </ActionButton>
                ))}
              </div>
            </div>
          </div>

          {/* Keywords Input */}
          <div className="space-y-2">
            <label className="ui-field-label text-[10px] uppercase font-extrabold tracking-widest text-ui-muted">
              Keywords (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. sci-fi, classics, drama, philosophy"
              value={keywordsStr}
              onChange={(e) => setKeywordsStr(e.target.value)}
              className="ui-field w-full px-4 py-3.5 rounded-2xl bg-ui-section border border-ui-border text-ui-text placeholder-ui-ink/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-base shadow-sm font-medium"
              id="modal-keywords-input"
            />
          </div>

          {/* Note Textarea */}
          <div className="space-y-2">
            <label className="ui-field-label text-[10px] uppercase font-extrabold tracking-widest text-ui-muted">
              Notes
            </label>
            <textarea
              placeholder="Add your thoughts or quotes here..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="ui-field w-full px-4 py-3.5 rounded-2xl bg-ui-section border border-ui-border text-ui-text placeholder-ui-ink/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-base shadow-sm font-medium"
              id="modal-note-textarea"
            />
          </div>
        </ValidatedForm>

        {/* Footer Actions */}
        <DialogActions form={formId}>
          <div>
            {itemToEdit && (
              <>
                {!showConfirmDelete ? (
                  <ActionButton
                    type="button"
                    onClick={() => setShowConfirmDelete(true)}
                    className="flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-bold text-sm px-4 py-3 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                    id="modal-trigger-delete"
                    aria-label="Delete content"
                  >
                    <Trash2 className="w-5 h-5 shrink-0" />
                    <span className="hidden sm:inline">Delete</span>
                  </ActionButton>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-150">
                    <ActionButton
                      type="button"
                      busyLabel="Deleting…" onClick={handleDelete}
                      className="ui-button ui-button-danger bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all"
                      id="modal-confirm-delete"
                    >
                      Delete
                    </ActionButton>
                    <ActionButton
                      type="button"
                      onClick={() => setShowConfirmDelete(false)}
                      className="ui-button ui-button-secondary bg-ui-ink/10 text-ui-ink/70 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all"
                      id="modal-cancel-delete"
                    >
                      Cancel
                    </ActionButton>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <ActionButton
              type="button"
              onClick={onClose}
              className="ui-button ui-button-secondary px-6 py-3.5 rounded-2xl bg-ui-ink/10 text-ui-text font-bold text-base hover:opacity-90 transition-all shadow-sm"
              id="modal-cancel-btn"
            >
              Cancel
            </ActionButton>
            <ActionButton
              type="submit"
              className="ui-button ui-button-primary px-8 py-3.5 rounded-2xl bg-ui-primary text-ui-primary-text font-bold text-base hover:opacity-90 transition-all shadow-md"
              id="modal-save-btn"
            >
              Save
            </ActionButton>
          </div>
        </DialogActions>
    </Dialog>
  );
};
