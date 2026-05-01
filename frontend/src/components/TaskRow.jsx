import React from "react";
import DifficultyBadge from "@/components/DifficultyBadge";
import { Coins, Pencil, Trash2, Check, Undo2 } from "lucide-react";

function ToggleButton({ task, onToggle }) {
  const cls = task.completed ? "bg-[#06D6A0]" : "bg-white hover:bg-[#FFD166]";
  return (
    <button
      onClick={() => onToggle(task)}
      className={`w-11 h-11 shrink-0 rounded-lg border-2 border-[#1E1E24] flex items-center justify-center ${cls}`}
      style={{ boxShadow: "2px 2px 0 0 #1E1E24" }}
      data-testid={`task-complete-${task.id}`}
      aria-label={task.completed ? "Uncomplete" : "Complete"}
    >
      {task.completed ? <Check className="w-5 h-5" strokeWidth={3} /> : null}
    </button>
  );
}

function ActionButton({ task, onEdit, onUncomplete }) {
  if (task.completed) {
    return (
      <button onClick={() => onUncomplete(task.id)} className="w-9 h-9 rounded-lg border-2 border-[#1E1E24] bg-white flex items-center justify-center hover:bg-[#F3F0EA]" data-testid={`task-undo-${task.id}`} aria-label="Undo">
        <Undo2 className="w-4 h-4" strokeWidth={2.75} />
      </button>
    );
  }
  return (
    <button onClick={() => onEdit(task)} className="w-9 h-9 rounded-lg border-2 border-[#1E1E24] bg-white flex items-center justify-center hover:bg-[#F3F0EA]" data-testid={`task-edit-${task.id}`} aria-label="Edit task">
      <Pencil className="w-4 h-4" strokeWidth={2.75} />
    </button>
  );
}

export default function TaskRow({ task, onToggle, onEdit, onUncomplete, onDelete }) {
  const { id, name, description, difficulty, coins_reward, completed } = task;
  const opacityCls = completed ? "opacity-70" : "";
  const titleCls = completed ? "line-through" : "";

  return (
    <div className={`nb-card nb-card-hover p-4 flex items-center gap-4 ${opacityCls}`} data-testid={`task-card-${id}`}>
      <ToggleButton task={task} onToggle={onToggle} />

      <div className="flex-1 min-w-0">
        <h3 className={`font-bold truncate ${titleCls}`} data-testid={`task-name-${id}`}>{name}</h3>
        {description && <p className="text-sm text-[#5C5C68] truncate">{description}</p>}
      </div>

      <div className="hidden sm:flex items-center gap-2">
        <DifficultyBadge value={difficulty} />
        <span className="nb-badge-coin"><Coins className="w-3.5 h-3.5" strokeWidth={3} />{coins_reward}</span>
      </div>

      <div className="flex gap-1">
        <ActionButton task={task} onEdit={onEdit} onUncomplete={onUncomplete} />
        <button onClick={() => onDelete(id)} className="w-9 h-9 rounded-lg border-2 border-[#1E1E24] bg-white flex items-center justify-center hover:bg-[#F43F5E] hover:text-white" data-testid={`task-delete-${id}`} aria-label="Delete task">
          <Trash2 className="w-4 h-4" strokeWidth={2.75} />
        </button>
      </div>
    </div>
  );
}
