import React from "react";
import HabitHeatmap from "@/components/HabitHeatmap";
import DifficultyBadge from "@/components/DifficultyBadge";
import { Coins, Flame, Calendar, X, Trophy, Target } from "lucide-react";

function StatTile({ icon: Icon, label, value, color }) {
  return (
    <div className="p-3 rounded-xl border-2 border-[#1E1E24] dark:border-[#FDFCFB] bg-[#FDFCFB] dark:bg-[#1F1F28] text-center">
      <div className={`flex items-center justify-center gap-1 ${color} font-bold`}>
        <Icon className="w-4 h-4" strokeWidth={3} />
        <span className="font-heading font-black text-2xl">{value}</span>
      </div>
      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5C5C68] dark:text-[#9AA0A6] mt-1">{label}</div>
    </div>
  );
}

export default function HabitDetailModal({ habit, onClose }) {
  if (!habit) return null;
  const { name, description, difficulty, frequency, coins_per_completion, streak, longest_streak, total_completions, completions } = habit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1E24]/40" onClick={onClose} data-testid="habit-detail-backdrop">
      <div onClick={(e) => e.stopPropagation()} className="nb-card max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto" data-testid="habit-detail-modal">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h2 className="font-heading font-black text-3xl sm:text-4xl tracking-tighter">{name}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-lg border-2 border-[#1E1E24] dark:border-[#FDFCFB] bg-white dark:bg-[#1F1F28] flex items-center justify-center" data-testid="habit-detail-close" aria-label="Close">
            <X className="w-4 h-4" strokeWidth={2.75} />
          </button>
        </div>
        {description && <p className="text-[#5C5C68] dark:text-[#9AA0A6] mb-4">{description}</p>}

        <div className="flex flex-wrap items-center gap-2 mb-5">
          <DifficultyBadge value={difficulty} />
          <span className="nb-badge bg-[#118AB2] text-white capitalize flex items-center gap-1">
            <Calendar className="w-3 h-3" strokeWidth={3} /> {frequency}
          </span>
          <span className="nb-badge-coin"><Coins className="w-3.5 h-3.5" strokeWidth={3} />{coins_per_completion}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatTile icon={Flame} label="Current" value={streak || 0} color="text-[#EF476F]" />
          <StatTile icon={Trophy} label="Best" value={longest_streak || 0} color="text-[#FFD166]" />
          <StatTile icon={Target} label="Total" value={total_completions || 0} color="text-[#06D6A0]" />
        </div>

        <HabitHeatmap completions={completions} weeks={52} label="Last 52 weeks" testId="habit-detail-heatmap" />
      </div>
    </div>
  );
}
