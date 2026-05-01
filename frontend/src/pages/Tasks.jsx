import React, { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { celebrate } from "@/lib/confetti";
import TaskRow from "@/components/TaskRow";
import ItemFormPanel from "@/components/ItemFormPanel";
import { Plus } from "lucide-react";
import { toast } from "sonner";

const FILTERS = [
  { k: "pending", label: "Pending" },
  { k: "done", label: "Done" },
  { k: "all", label: "All" },
];

function getEmptyText(filter) {
  if (filter === "done") return "No completed tasks yet.";
  return "Create a task to get started.";
}

function applyFilter(tasks, filter) {
  if (filter === "all") return tasks;
  if (filter === "done") return tasks.filter((t) => t.completed);
  return tasks.filter((t) => !t.completed);
}

function EmptyTasks({ onCreate, filter }) {
  return (
    <div className="nb-card p-10 text-center">
      <h3 className="font-heading text-2xl font-extrabold">Nothing here</h3>
      <p className="text-[#5C5C68] mt-1 mb-4">{getEmptyText(filter)}</p>
      <button onClick={onCreate} className="nb-btn nb-btn-primary" data-testid="empty-new-task-btn">
        <Plus className="w-4 h-4" strokeWidth={3} /> Create a task
      </button>
    </div>
  );
}

function FilterTabs({ filter, setFilter }) {
  return (
    <div className="flex gap-2 mb-6" data-testid="task-filters">
      {FILTERS.map((f) => {
        const cls = filter === f.k ? "nb-btn-info" : "nb-btn-outline";
        return (
          <button key={f.k} onClick={() => setFilter(f.k)} className={`nb-btn !py-2 !px-4 !text-sm ${cls}`} data-testid={`filter-${f.k}`}>
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

export default function Tasks() {
  const { updateBalance } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState("pending");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/tasks");
      setTasks(data);
    } catch (e) {
      console.error("Failed to load tasks", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const closePanel = () => { setPanelOpen(false); setEditing(null); };

  const create = async (payload) => {
    try { await api.post("/tasks", payload); toast.success("Task created!"); closePanel(); load(); }
    catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  const update = async (payload) => {
    try { await api.put(`/tasks/${editing.id}`, payload); toast.success("Task updated!"); closePanel(); load(); }
    catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
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
      celebrate("normal");
      toast.success(`+${data.coins_earned} coins!`);
      load();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  const uncomplete = async (id) => {
    try {
      const { data } = await api.post(`/tasks/${id}/uncomplete`);
      updateBalance(data.new_balance);
      toast("Coins refunded");
      load();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  const toggle = (task) => task.completed ? uncomplete(task.id) : complete(task.id);
  const openCreate = () => { setEditing(null); setPanelOpen(true); };
  const openEdit = (t) => { setEditing(t); setPanelOpen(true); };

  const visible = useMemo(() => applyFilter(tasks, filter), [tasks, filter]);

  const renderContent = () => {
    if (loading) return <div className="text-center py-16 text-[#5C5C68] font-bold">Loading...</div>;
    if (visible.length === 0) return <EmptyTasks onCreate={openCreate} filter={filter} />;
    return (
      <div className="space-y-3">
        {visible.map((t) => (
          <TaskRow key={t.id} task={t} onToggle={toggle} onEdit={openEdit} onUncomplete={uncomplete} onDelete={remove} />
        ))}
      </div>
    );
  };

  return (
    <div data-testid="tasks-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#5C5C68]">To-do list</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-black tracking-tighter">Tasks</h1>
        </div>
        <button onClick={openCreate} className="nb-btn nb-btn-primary" data-testid="new-task-btn">
          <Plus className="w-4 h-4" strokeWidth={3} /> New Task
        </button>
      </div>

      <FilterTabs filter={filter} setFilter={setFilter} />

      {renderContent()}

      <ItemFormPanel
        open={panelOpen}
        onClose={closePanel}
        onSubmit={editing ? update : create}
        initial={editing}
        type="task"
        testIdPrefix="task-form"
      />
    </div>
  );
}
