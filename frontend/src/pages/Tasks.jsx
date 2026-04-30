import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import DifficultyBadge from "@/components/DifficultyBadge";
import ItemFormPanel from "@/components/ItemFormPanel";
import { Coins, Plus, Check, Pencil, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";

export default function Tasks() {
  const { updateBalance } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("pending");

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/tasks");
    setTasks(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async (payload) => {
    try {
      await api.post("/tasks", payload);
      toast.success("Task created!");
      setPanelOpen(false);
      load();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  const update = async (payload) => {
    try {
      await api.put(`/tasks/${editing.id}`, payload);
      toast.success("Task updated!");
      setPanelOpen(false);
      setEditing(null);
      load();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try { await api.delete(`/tasks/${id}`); toast.success("Task deleted"); load(); }
    catch { toast.error("Failed"); }
  };

  const complete = async (id) => {
    try {
      const { data } = await api.post(`/tasks/${id}/complete`);
      updateBalance(data.new_balance);
      toast.success(`+${data.coins_earned} coins!`);
      load();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  const uncomplete = async (id) => {
    try {
      const { data } = await api.post(`/tasks/${id}/uncomplete`);
      updateBalance(data.new_balance);
      toast(`Coins refunded`);
      load();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  const visible = tasks.filter((t) => filter === "all" ? true : filter === "done" ? t.completed : !t.completed);

  return (
    <div data-testid="tasks-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#5C5C68]">To-do list</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-black tracking-tighter">Tasks</h1>
        </div>
        <button onClick={() => { setEditing(null); setPanelOpen(true); }} className="nb-btn nb-btn-primary" data-testid="new-task-btn">
          <Plus className="w-4 h-4" strokeWidth={3} /> New Task
        </button>
      </div>

      <div className="flex gap-2 mb-6" data-testid="task-filters">
        {[
          { k: "pending", label: "Pending" },
          { k: "done", label: "Done" },
          { k: "all", label: "All" },
        ].map((f) => (
          <button
            key={f.k}
            onClick={() => setFilter(f.k)}
            className={`nb-btn !py-2 !px-4 !text-sm ${filter === f.k ? "nb-btn-info" : "nb-btn-outline"}`}
            data-testid={`filter-${f.k}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-[#5C5C68] font-bold">Loading...</div>
      ) : visible.length === 0 ? (
        <div className="nb-card p-10 text-center">
          <h3 className="font-heading text-2xl font-extrabold">Nothing here</h3>
          <p className="text-[#5C5C68] mt-1 mb-4">{filter === "done" ? "No completed tasks yet." : "Create a task to get started."}</p>
          <button onClick={() => setPanelOpen(true)} className="nb-btn nb-btn-primary" data-testid="empty-new-task-btn">
            <Plus className="w-4 h-4" strokeWidth={3} /> Create a task
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((t) => (
            <div key={t.id} className={`nb-card nb-card-hover p-4 flex items-center gap-4 ${t.completed ? "opacity-70" : ""}`} data-testid={`task-card-${t.id}`}>
              <button
                onClick={() => t.completed ? uncomplete(t.id) : complete(t.id)}
                className={`w-11 h-11 shrink-0 rounded-lg border-2 border-[#1E1E24] flex items-center justify-center ${t.completed ? "bg-[#06D6A0]" : "bg-white hover:bg-[#FFD166]"}`}
                style={{ boxShadow: "2px 2px 0 0 #1E1E24" }}
                data-testid={`task-complete-${t.id}`}
                aria-label={t.completed ? "Uncomplete" : "Complete"}
              >
                {t.completed ? <Check className="w-5 h-5" strokeWidth={3} /> : null}
              </button>

              <div className="flex-1 min-w-0">
                <h3 className={`font-bold truncate ${t.completed ? "line-through" : ""}`} data-testid={`task-name-${t.id}`}>{t.name}</h3>
                {t.description && <p className="text-sm text-[#5C5C68] truncate">{t.description}</p>}
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <DifficultyBadge value={t.difficulty} />
                <span className="nb-badge-coin"><Coins className="w-3.5 h-3.5" strokeWidth={3} />{t.coins_reward}</span>
              </div>

              <div className="flex gap-1">
                {t.completed ? (
                  <button onClick={() => uncomplete(t.id)} className="w-9 h-9 rounded-lg border-2 border-[#1E1E24] bg-white flex items-center justify-center hover:bg-[#F3F0EA]" data-testid={`task-undo-${t.id}`} aria-label="Undo">
                    <Undo2 className="w-4 h-4" strokeWidth={2.75} />
                  </button>
                ) : (
                  <button onClick={() => { setEditing(t); setPanelOpen(true); }} className="w-9 h-9 rounded-lg border-2 border-[#1E1E24] bg-white flex items-center justify-center hover:bg-[#F3F0EA]" data-testid={`task-edit-${t.id}`}>
                    <Pencil className="w-4 h-4" strokeWidth={2.75} />
                  </button>
                )}
                <button onClick={() => remove(t.id)} className="w-9 h-9 rounded-lg border-2 border-[#1E1E24] bg-white flex items-center justify-center hover:bg-[#EF476F] hover:text-white" data-testid={`task-delete-${t.id}`}>
                  <Trash2 className="w-4 h-4" strokeWidth={2.75} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ItemFormPanel
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setEditing(null); }}
        onSubmit={editing ? update : create}
        initial={editing}
        type="task"
        testIdPrefix="task-form"
      />
    </div>
  );
}
