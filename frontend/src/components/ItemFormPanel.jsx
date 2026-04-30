import React, { useState } from "react";

const DIFFICULTIES = [
  { key: "easy", label: "Easy", coins: 5, cls: "bg-[#06D6A0] text-[#1E1E24]" },
  { key: "medium", label: "Medium", coins: 10, cls: "bg-[#FFD166] text-[#1E1E24]" },
  { key: "hard", label: "Hard", coins: 20, cls: "bg-[#EF476F] text-white" },
];

/**
 * Inline form for creating/editing habits and tasks.
 * Supports difficulty OR custom coin amount.
 */
export default function ItemFormPanel({ open, onClose, onSubmit, initial, type, testIdPrefix = "form" }) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [frequency, setFrequency] = useState(initial?.frequency || "daily");
  const [difficulty, setDifficulty] = useState(initial?.difficulty || "medium");
  const [useCustom, setUseCustom] = useState(!!initial?.custom_coins);
  const [customCoins, setCustomCoins] = useState(initial?.custom_coins || 10);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    const payload = {
      name: name.trim(),
      description: description.trim(),
      difficulty,
      custom_coins: useCustom ? Number(customCoins) : null,
    };
    if (type === "habit") payload.frequency = frequency;
    await onSubmit(payload);
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1E24]/40" onClick={onClose} data-testid={`${testIdPrefix}-backdrop`}>
      <div onClick={(e) => e.stopPropagation()} className="nb-card bg-white max-w-lg w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto" data-testid={`${testIdPrefix}-panel`}>
        <h2 className="font-heading font-black text-2xl sm:text-3xl mb-1">
          {initial ? "Edit" : "New"} {type === "habit" ? "Habit" : type === "task" ? "Task" : "Reward"}
        </h2>
        <p className="text-[#5C5C68] text-sm mb-5">
          {type === "habit" ? "Recurring daily or weekly — build your streak!" : type === "task" ? "One-time to-do. Complete it, earn coins." : ""}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-[#5C5C68] mb-1.5 block">Name</label>
            <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} className="nb-input" placeholder="e.g. Morning workout" data-testid={`${testIdPrefix}-name-input`} />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-[#5C5C68] mb-1.5 block">Description (optional)</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="nb-input" placeholder="Short notes..." data-testid={`${testIdPrefix}-desc-input`} />
          </div>

          {type === "habit" && (
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-[#5C5C68] mb-1.5 block">Frequency</label>
              <div className="grid grid-cols-2 gap-2">
                {["daily", "weekly"].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f)}
                    className={`nb-btn capitalize ${frequency === f ? "nb-btn-info" : "nb-btn-outline"}`}
                    data-testid={`${testIdPrefix}-freq-${f}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-[0.15em] text-[#5C5C68]">Difficulty</label>
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input type="checkbox" checked={useCustom} onChange={(e) => setUseCustom(e.target.checked)} className="w-4 h-4 accent-[#EF476F]" data-testid={`${testIdPrefix}-custom-toggle`} />
                Custom amount
              </label>
            </div>
            {!useCustom ? (
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setDifficulty(d.key)}
                    className={`nb-btn flex-col !py-3 ${difficulty === d.key ? d.cls : "nb-btn-outline"}`}
                    data-testid={`${testIdPrefix}-diff-${d.key}`}
                  >
                    <span>{d.label}</span>
                    <span className="text-xs opacity-80">+{d.coins}</span>
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="number"
                min="1"
                value={customCoins}
                onChange={(e) => setCustomCoins(e.target.value)}
                className="nb-input"
                placeholder="Coins"
                data-testid={`${testIdPrefix}-custom-coins-input`}
              />
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="nb-btn nb-btn-outline flex-1" data-testid={`${testIdPrefix}-cancel-btn`}>Cancel</button>
            <button type="submit" disabled={submitting} className="nb-btn nb-btn-primary flex-1" data-testid={`${testIdPrefix}-submit-btn`}>
              {submitting ? "Saving..." : initial ? "Save" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
