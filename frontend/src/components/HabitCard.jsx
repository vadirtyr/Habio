import React from "react";
import DifficultyBadge from "@/components/DifficultyBadge";
import { Coins, Flame, Pencil, Trash2, Calendar, Check } from "lucide-react";

export default function HabitCard({ habit, onComplete, onEdit, onDelete }) {
  const { id, name, description, difficulty, frequency, coins_per_completion, streak, total_completions, completed_today } = habit;

  const buttonClass = completed_today ? "nb-btn-outline" : "nb-btn-success";
  const buttonContent = completed_today
    ? <><Check className="w-4 h-4" strokeWidth={3} /> Done today!</>
    : <><Check className="w-4 h-4" strokeWidth={3} /> Mark done</>;

  return (
    <div className="nb-card nb-card-hover p-5" data-testid={`habit-card-${id}`}>
      <div className="flex items-start justify-between mb-3 gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-extrabold text-xl truncate" data-testid={`habit-name-${id}`}>{name}</h3>
          {description && <p className="text-sm text-[#5C5C68] mt-0.5 truncate">{description}</p>}
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(habit)} className="w-8 h-8 rounded-lg border-2 border-[#1E1E24] bg-white flex items-center justify-center hover:bg-[#F3F0EA]" data-testid={`habit-edit-${id}`} aria-label="Edit habit">
            <Pencil className="w-3.5 h-3.5" strokeWidth={2.75} />
          </button>
          <button onClick={() => onDelete(id)} className="w-8 h-8 rounded-lg border-2 border-[#1E1E24] bg-white flex items-center justify-center hover:bg-[#EF476F] hover:text-white" data-testid={`habit-delete-${id}`} aria-label="Delete habit">
            <Trash2 className="w-3.5 h-3.5" strokeWidth={2.75} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <DifficultyBadge value={difficulty} testId={`habit-diff-${id}`} />
        <span className="nb-badge bg-[#118AB2] text-white capitalize flex items-center gap-1">
          <Calendar className="w-3 h-3" strokeWidth={3} /> {frequency}
        </span>
        <span className="nb-badge-coin"><Coins className="w-3.5 h-3.5" strokeWidth={3} />{coins_per_completion}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4 text-center">
        <div className="p-2 rounded-lg border-2 border-[#1E1E24] bg-[#FDFCFB]">
          <div className="flex items-center justify-center gap-1 text-[#EF476F] font-bold">
            <Flame className="w-4 h-4" strokeWidth={3} />
            <span className="font-heading font-black text-xl" data-testid={`habit-streak-${id}`}>{streak}</span>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5C5C68]">Streak</div>
        </div>
        <div className="p-2 rounded-lg border-2 border-[#1E1E24] bg-[#FDFCFB]">
          <div className="font-heading font-black text-xl">{total_completions || 0}</div>
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5C5C68]">Total</div>
        </div>
      </div>

      <button
        onClick={() => onComplete(id)}
        disabled={completed_today}
        className={`nb-btn w-full ${buttonClass}`}
        data-testid={`habit-complete-${id}`}
      >
        {buttonContent}
      </button>
    </div>
  );
}
