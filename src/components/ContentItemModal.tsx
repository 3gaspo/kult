/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { ContentItem, ContentType } from "../types";
import { useKult } from "../providers";
import { X, Trash2, ChevronDown, Calendar, Star, Heart, Hourglass } from "lucide-react";

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
        // Set default type from settings or first available type
        const defaultType = settings?.defaultTypeId || (types.length > 0 ? types[0].id : "");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with Blur */}
      <div 
        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        className="relative bg-white dark:bg-zinc-950 w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 border border-zinc-100 dark:border-zinc-800"
        id="item-modal-container"
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 flex justify-between items-center bg-white dark:bg-zinc-950">
          <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            {itemToEdit ? "Edit Content" : "Add Content"}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            id="close-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSave} className="overflow-y-auto p-6 space-y-6 flex-1 text-zinc-900 dark:text-zinc-50">
          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-sm font-semibold rounded-2xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              {error}
            </div>
          )}

          {/* Title Input */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-extrabold tracking-widest text-zinc-400 dark:text-zinc-500">
              Title
            </label>
            <input
              type="text"
              placeholder="What's the title?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-base shadow-sm font-medium"
              id="modal-title-input"
            />
          </div>

          {/* Type and Status in Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-extrabold tracking-widest text-zinc-400 dark:text-zinc-500">
                Type
              </label>
              <div className="relative">
                <select
                  value={typeId}
                  onChange={(e) => setTypeId(e.target.value)}
                  className="w-full pl-4 pr-10 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all appearance-none text-base shadow-sm font-medium"
                  id="modal-type-select"
                >
                  <option value="" disabled>Select Type</option>
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

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-extrabold tracking-widest text-zinc-400 dark:text-zinc-500">
                Status
              </label>
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full pl-4 pr-10 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all appearance-none text-base shadow-sm font-medium"
                  id="modal-status-select"
                >
                  <option value="to_complete">To Complete</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                  <ChevronDown className="w-5 h-5" />
                </span>
              </div>
            </div>
          </div>

          {/* Author / Creator */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-extrabold tracking-widest text-zinc-400 dark:text-zinc-500">
              Author / Creator
            </label>
            <input
              type="text"
              placeholder="e.g. Christopher Nolan, Haruki Murakami"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-base shadow-sm font-medium"
              id="modal-author-input"
            />
          </div>

          {/* Published and Added Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-extrabold tracking-widest text-zinc-400 dark:text-zinc-500">
                Release Date / Year
              </label>
              <input
                type="text"
                placeholder="e.g. 2024 or 2024-05-15"
                value={publishedDate}
                onChange={(e) => setPublishedDate(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-base shadow-sm font-medium"
                id="modal-pubdate-input"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase font-extrabold tracking-widest text-zinc-400 dark:text-zinc-500">
                Added Date
              </label>
              <input
                type="date"
                value={addedDate}
                onChange={(e) => setAddedDate(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-base shadow-sm font-medium"
                id="modal-addeddate-input"
              />
            </div>
          </div>

          {/* Completed Date (Only visible when status is completed) */}
          {status === "completed" && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
              <label className="text-[10px] uppercase font-extrabold tracking-widest text-zinc-400 dark:text-zinc-500">
                Completed Date
              </label>
              <input
                type="date"
                value={completedDate}
                onChange={(e) => setCompletedDate(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-base shadow-sm font-medium"
                id="modal-completeddate-input"
              />
            </div>
          )}

          {/* Metrics Selectors (Priority, Pleasure, Length) */}
          <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-[24px] space-y-4">
            {/* Priority Selector */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500 shrink-0" />
                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Priority</span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPriority(val)}
                    className={`w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center transition-all ${
                      priority === val
                        ? "bg-black text-white dark:bg-white dark:text-black scale-110 shadow-sm"
                        : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Pleasure Selector */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 shrink-0" />
                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Motivation</span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPleasure(val)}
                    className={`w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center transition-all ${
                      pleasure === val
                        ? "bg-black text-white dark:bg-white dark:text-black scale-110 shadow-sm"
                        : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Length Selector */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Hourglass className="w-5 h-5 text-indigo-500 shrink-0" />
                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">Length</span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setLength(val)}
                    className={`w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center transition-all ${
                      length === val
                        ? "bg-black text-white dark:bg-white dark:text-black scale-110 shadow-sm"
                        : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Keywords Input */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-extrabold tracking-widest text-zinc-400 dark:text-zinc-500">
              Keywords (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. sci-fi, classics, drama, philosophy"
              value={keywordsStr}
              onChange={(e) => setKeywordsStr(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-base shadow-sm font-medium"
              id="modal-keywords-input"
            />
          </div>

          {/* Note Textarea */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-extrabold tracking-widest text-zinc-400 dark:text-zinc-500">
              Notes
            </label>
            <textarea
              placeholder="Add your thoughts or quotes here..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-4 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all text-base shadow-sm font-medium"
              id="modal-note-textarea"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-6 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-center gap-4">
          <div>
            {itemToEdit && (
              <>
                {!showConfirmDelete ? (
                  <button
                    type="button"
                    onClick={() => setShowConfirmDelete(true)}
                    className="flex items-center gap-2 text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 font-bold text-sm px-4 py-3 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/20 active:scale-95 transition-all"
                    id="modal-trigger-delete"
                  >
                    <Trash2 className="w-5 h-5 shrink-0" />
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-150">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all"
                      id="modal-confirm-delete"
                    >
                      Yes, Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowConfirmDelete(false)}
                      className="bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all"
                      id="modal-cancel-delete"
                    >
                      No
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-base hover:opacity-90 active:scale-95 transition-all shadow-sm"
              id="modal-cancel-btn"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-8 py-3.5 rounded-2xl bg-black dark:bg-white text-white dark:text-black font-bold text-base hover:opacity-90 active:scale-95 transition-all shadow-md"
              id="modal-save-btn"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
