import React from "react";

const DIFF = {
  easy: { label: "Easy", cls: "bg-[#06D6A0] text-[#1E1E24]" },
  medium: { label: "Medium", cls: "bg-[#FFD166] text-[#1E1E24]" },
  hard: { label: "Hard", cls: "bg-[#F43F5E] text-white" },
};

export default function DifficultyBadge({ value, testId }) {
  const d = DIFF[value] || DIFF.medium;
  return (
    <span data-testid={testId} className={`nb-badge ${d.cls}`}>
      {d.label}
    </span>
  );
}
