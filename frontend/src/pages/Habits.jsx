import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import HabitCard from "@/components/HabitCard";
import ItemFormPanel from "@/components/ItemFormPanel";
import { Flame, Plus } from "lucide-react";
import { toast } from "sonner";

function EmptyHabits({ onCreate }) {
  return (
    <div className="nb-card p-10 text-center">
      <Flame className="w-12 h-12 mx-auto text-[#EF476F]" strokeWidth={2.75} />
      <h3 className="font-heading text-2xl font-extrabold mt-3">No habits yet!</h3>
      <p className="text-[#5C5C68] mt-1 mb-4">Start by creating a habit you want to build.</p>
      <button onClick={onCreate} className="nb-btn nb-btn-primary" data-testid="empty-new-habit-btn">
        <Plus className="w-4 h-4" strokeWidth={3} /> Create your first habit
      </button>
    </div>
  );
}

export default function Habits() {
  const { updateBalance } = useAuth();
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/habits");
      setHabits(data);
    } catch (e) {
      console.error("Failed to load habits", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const closePanel = () => { setPanelOpen(false); setEditing(null); };

  const create = async (payload) => {
    try {
      await api.post("/habits", payload);
      toast.success("Habit created!");
      closePanel();
      load();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  const update = async (payload) => {
    try {
      await api.put(`/habits/${editing.id}`, payload);
      toast.success("Habit updated!");
      closePanel();
      load();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this habit? Your streak history will be lost.")) return;
    try {
      await api.delete(`/habits/${id}`);
      toast.success("Habit deleted");
      load();
    } catch { toast.error("Failed"); }
  };

  const complete = async (id) => {
    try {
      const { data } = await api.post(`/habits/${id}/complete`);
      updateBalance(data.new_balance);
      toast.success(`+${data.coins_earned} coins! Streak: ${data.streak}`);
      load();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  const openCreate = () => { setEditing(null); setPanelOpen(true); };
  const openEdit = (h) => { setEditing(h); setPanelOpen(true); };

  const renderContent = () => {
    if (loading) return <div className="text-center py-16 text-[#5C5C68] font-bold">Loading habits...</div>;
    if (habits.length === 0) return <EmptyHabits onCreate={openCreate} />;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {habits.map((h) => (
          <HabitCard key={h.id} habit={h} onComplete={complete} onEdit={openEdit} onDelete={remove} />
        ))}
      </div>
    );
  };

  return (
    <div data-testid="habits-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#5C5C68]">Your habits</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-black tracking-tighter">Keep the streak alive</h1>
        </div>
        <button onClick={openCreate} className="nb-btn nb-btn-primary" data-testid="new-habit-btn">
          <Plus className="w-4 h-4" strokeWidth={3} /> New Habit
        </button>
      </div>

      {renderContent()}

      <ItemFormPanel
        open={panelOpen}
        onClose={closePanel}
        onSubmit={editing ? update : create}
        initial={editing}
        type="habit"
        testIdPrefix="habit-form"
      />
    </div>
  );
}
