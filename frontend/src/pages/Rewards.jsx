import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import RewardCard from "@/components/RewardCard";
import { Coins, Gift, Plus, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

function RewardForm({ open, onClose, onSubmit, initial }) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [cost, setCost] = useState(initial?.cost || 50);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submitLabel = (() => {
    if (submitting) return "Saving...";
    return initial ? "Save" : "Create";
  })();

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({ name: name.trim(), description: description.trim(), cost: Number(cost) });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1E24]/40" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="nb-card bg-white max-w-lg w-full p-6 sm:p-8" data-testid="reward-form-panel">
        <h2 className="font-heading font-black text-2xl sm:text-3xl mb-1">{initial ? "Edit" : "New"} Reward</h2>
        <p className="text-[#5C5C68] text-sm mb-5">Define something you'd enjoy and set its coin cost.</p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-[#5C5C68] mb-1.5 block">Name</label>
            <input autoFocus required value={name} onChange={(e) => setName(e.target.value)} className="nb-input" placeholder="e.g. 30 min gaming" data-testid="reward-name-input" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-[#5C5C68] mb-1.5 block">Description (optional)</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} className="nb-input" placeholder="Details..." data-testid="reward-desc-input" />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-[0.15em] text-[#5C5C68] mb-1.5 block">Cost (coins)</label>
            <input type="number" min="1" required value={cost} onChange={(e) => setCost(e.target.value)} className="nb-input" data-testid="reward-cost-input" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="nb-btn nb-btn-outline flex-1" data-testid="reward-cancel-btn">Cancel</button>
            <button type="submit" disabled={submitting} className="nb-btn nb-btn-primary flex-1" data-testid="reward-submit-btn">
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EmptyRewards({ onCreate }) {
  return (
    <div className="nb-card p-10 text-center">
      <Gift className="w-12 h-12 mx-auto text-[#EF476F]" strokeWidth={2.75} />
      <h3 className="font-heading text-2xl font-extrabold mt-3">No rewards yet!</h3>
      <p className="text-[#5C5C68] mt-1 mb-4">Define rewards you want to buy with your hard-earned coins.</p>
      <button onClick={onCreate} className="nb-btn nb-btn-primary" data-testid="empty-new-reward-btn">
        <Plus className="w-4 h-4" strokeWidth={3} /> Create a reward
      </button>
    </div>
  );
}

function WalletBanner({ balance }) {
  return (
    <div className="nb-card p-5 mb-6 bg-[#FFD166] flex items-center justify-between">
      <div className="flex items-center gap-3">
        <ShoppingBag className="w-6 h-6" strokeWidth={3} />
        <div>
          <div className="font-heading font-black text-xl">Your wallet</div>
          <div className="text-sm font-semibold">Spend coins on custom rewards you define.</div>
        </div>
      </div>
      <div className="nb-badge-coin !text-lg !px-4 !py-2" data-testid="rewards-balance">
        <Coins className="w-5 h-5" strokeWidth={3} />{balance}
      </div>
    </div>
  );
}

export default function Rewards() {
  const { user, updateBalance } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/rewards");
      setRewards(data);
    } catch (e) {
      console.error("Failed to load rewards", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const closePanel = () => { setPanelOpen(false); setEditing(null); };

  const create = async (payload) => {
    try { await api.post("/rewards", payload); toast.success("Reward created!"); closePanel(); load(); }
    catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };
  const update = async (payload) => {
    try { await api.put(`/rewards/${editing.id}`, payload); toast.success("Reward updated!"); closePanel(); load(); }
    catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };
  const remove = async (id) => {
    if (!window.confirm("Delete this reward?")) return;
    try { await api.delete(`/rewards/${id}`); toast.success("Deleted"); load(); }
    catch { toast.error("Failed"); }
  };
  const redeem = async (id) => {
    try {
      const { data } = await api.post(`/rewards/${id}/redeem`);
      updateBalance(data.new_balance);
      toast.success(`Enjoy: ${data.redemption.reward_name}!`);
      load();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  const openCreate = () => { setEditing(null); setPanelOpen(true); };
  const openEdit = (r) => { setEditing(r); setPanelOpen(true); };

  const balance = user?.coin_balance ?? 0;

  const renderContent = () => {
    if (loading) return <div className="text-center py-16 text-[#5C5C68] font-bold">Loading...</div>;
    if (rewards.length === 0) return <EmptyRewards onCreate={openCreate} />;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {rewards.map((r) => (
          <RewardCard key={r.id} reward={r} balance={balance} onEdit={openEdit} onDelete={remove} onRedeem={redeem} />
        ))}
      </div>
    );
  };

  return (
    <div data-testid="rewards-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#5C5C68]">Rewards shop</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-black tracking-tighter">Treat yourself</h1>
        </div>
        <button onClick={openCreate} className="nb-btn nb-btn-primary" data-testid="new-reward-btn">
          <Plus className="w-4 h-4" strokeWidth={3} /> New Reward
        </button>
      </div>

      <WalletBanner balance={balance} />
      {renderContent()}

      <RewardForm
        open={panelOpen}
        onClose={closePanel}
        onSubmit={editing ? update : create}
        initial={editing}
      />
    </div>
  );
}
