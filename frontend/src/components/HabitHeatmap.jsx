import React from "react";

const DAYS = 84; // 12 weeks
const COLS = 12;
const ROWS = 7;

function getCellsLast84Days(completionDates) {
  const set = new Set(completionDates || []);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const cells = [];
  // Build oldest-first so columns flow left→right (oldest week on left)
  for (let i = DAYS - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const iso = d.toISOString().slice(0, 10);
    cells.push({ iso, done: set.has(iso) });
  }
  return cells;
}

export default function HabitHeatmap({ completions, testId }) {
  const cells = getCellsLast84Days(completions);
  return (
    <div className="mt-3" data-testid={testId}>
      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5C5C68] mb-2">Last 12 weeks</div>
      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${ROWS}, 1fr)`, gridAutoFlow: "column" }}
      >
        {cells.map((c) => (
          <div
            key={c.iso}
            title={`${c.iso}${c.done ? " ✓" : ""}`}
            className={`w-full aspect-square rounded-sm border ${c.done ? "bg-[#06D6A0] border-[#1E1E24]" : "bg-[#F3F0EA] border-[#E5E1D8]"}`}
          />
        ))}
      </div>
    </div>
  );
}
