import React from "react";

const ROWS = 7;

function getCells(completionDates, days) {
  const set = new Set(completionDates || []);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const cells = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const iso = d.toISOString().slice(0, 10);
    cells.push({ iso, done: set.has(iso) });
  }
  return cells;
}

export default function HabitHeatmap({ completions, weeks = 12, testId, label }) {
  const days = weeks * ROWS;
  const cells = getCells(completions, days);
  const labelText = label || `Last ${weeks} weeks`;
  return (
    <div className="mt-3" data-testid={testId}>
      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5C5C68] dark:text-[#9AA0A6] mb-2">{labelText}</div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${ROWS}, 1fr)`, gridAutoFlow: "column" }}
      >
        {cells.map((c) => {
          const cls = c.done
            ? "bg-[#06D6A0] border-[#1E1E24] dark:border-[#FDFCFB]"
            : "bg-[#F3F0EA] border-[#E5E1D8] dark:bg-[#2A2A33] dark:border-[#3A3A45]";
          return (
            <div
              key={c.iso}
              title={`${c.iso}${c.done ? " ✓" : ""}`}
              className={`w-full aspect-square rounded-sm border ${cls}`}
            />
          );
        })}
      </div>
    </div>
  );
}
