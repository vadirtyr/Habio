import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import DifficultyBadge from "@/components/DifficultyBadge";
import ItemFormPanel from "@/components/ItemFormPanel";
import { Flame, Coins, Plus, Check, Pencil, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function Habits() {
  const { updateBalance } = useAuth();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/habits");
    setHabits(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async (payload) => {
    try {
      await api.post("/habits", payload);
      toast.success("Habit created!");
      setPanelOpen(false);
      load();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  const update = async (payload) => {
    try {
      await api.put(`/habits/${editing.id}`, payload);
      toast.success("Habit updated!");
      setPanelOpen(false);
      setEditing(null);
      load();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this habit? Your streak history will be lost.")) return;
    try {
      await api.delete(`/habits/${id}`);
      toast.success("Habit deleted");
      load();
    } catch (e) { toast.error("Failed"); }
  };

  const complete = async (id) => {
    try {
      const { data } = await api.post(`/habits/${id}/complete`);
      updateBalance(data.new_balance);
      toast.success(`+${data.coins_earned} coins! 🔥 Streak: ${data.streak}`);
      load();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  return (
    <div data-testid="habits-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#5C5C68]">Your habits</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-black tracking-tighter">Keep the streak alive</h1>
        </div>
        <button onClick={() => { setEditing(null); setPanelOpen(true); }} className="nb-btn nb-btn-primary" data-testid="new-habit-btn">
          <Plus className="w-4 h-4" strokeWidth={3} /> New Habit
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-[#5C5C68] font-bold">Loading habits...</div>
      ) : habits.length === 0 ? (
        <div className="nb-card p-10 text-center">
          <Flame className="w-12 h-12 mx-auto text-[#EF476F]" strokeWidth={2.75} />
          <h3 className="font-heading text-2xl font-extrabold mt-3">No habits yet!</h3>
          <p className="text-[#5C5C68] mt-1 mb-4">Start by creating a habit you want to build.</p>
          <button onClick={() => setPanelOpen(true)} className="nb-btn nb-btn-primary" data-testid="empty-new-habit-btn">
            <Plus className="w-4 h-4" strokeWidth={3} /> Create your first habit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {habits.map((h) => (
            <div key={h.id} className="nb-card nb-card-hover p-5" data-testid={`habit-card-${h.id}`}>
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-extrabold text-xl truncate" data-testid={`habit-name-${h.id}`}>{h.name}</h3>
                  {h.description && <p className="text-sm text-[#5C5C68] mt-0.5 truncate">{h.description}</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(h); setPanelOpen(true); }} className="w-8 h-8 rounded-lg border-2 border-[#1E1E24] bg-white flex items-center justify-center hover:bg-[#F3F0EA]" data-testid={`habit-edit-${h.id}`}>
                    <Pencil className="w-3.5 h-3.5" strokeWidth={2.75} />
                  </button>
                  <button onClick={() => remove(h.id)} className="w-8 h-8 rounded-lg border-2 border-[#1E1E24] bg-white flex items-center justify-center hover:bg-[#EF476F] hover:text-white" data-testid={`habit-delete-${h.id}`}>
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={2.75} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <DifficultyBadge value={h.difficulty} testId={`habit-diff-${h.id}`} />
                <span className="nb-badge bg-[#118AB2] text-white capitalize flex items-center gap-1">
                  <Calendar className="w-3 h-3" strokeWidth={3} /> {h.frequency}
                </span>
                <span className="nb-badge-coin"><Coins className="w-3.5 h-3.5" strokeWidth={3} />{h.coins_per_completion}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4 text-center">
                <div className="p-2 rounded-lg border-2 border-[#1E1E24] bg-[#FDFCFB]">
                  <div className="flex items-center justify-center gap-1 text-[#EF476F] font-bold">
                    <Flame className="w-4 h-4" strokeWidth={3} />
                    <span className="font-heading font-black text-xl" data-testid={`habit-streak-${h.id}`}>{h.streak}</span>
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5C5C68]">Streak</div>
                </div>
                <div className="p-2 rounded-lg border-2 border-[#1E1E24] bg-[#FDFCFB]">
                  <div className="font-heading font-black text-xl">{h.total_completions || 0}</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5C5C68]">Total</div>
                </div>
              </div>

              <button
                onClick={() => complete(h.id)}
                disabled={h.completed_today}
                className={`nb-btn w-full ${h.completed_today ? "nb-btn-outline" : "nb-btn-success"}`}
                data-testid={`habit-complete-${h.id}`}
              >
                {h.completed_today ? (
                  <><Check className="w-4 h-4" strokeWidth={3} /> Done today!</>
                ) : (
                  <><Check className="w-4 h-4" strokeWidth={3} /> Mark done</>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <ItemFormPanel
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setEditing(null); }}
        onSubmit={editing ? update : create}
        initial={editing}
        type="habit"
        testIdPrefix="habit-form"
      />
    </div>
  );
}
