import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Coins, Gift, Plus, Pencil, Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

function RewardForm({ open, onClose, onSubmit, initial }) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [cost, setCost] = useState(initial?.cost || 50);
  const [submitting, setSubmitting] = useState(false);
  if (!open) return null;

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
              {submitting ? "Saving..." : initial ? "Save" : "Create"}
            </button>
          </div>
        </form>
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

  const load = async () => {
    setLoading(true);
    const { data } = await api.get("/rewards");
    setRewards(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async (payload) => {
    try { await api.post("/rewards", payload); toast.success("Reward created!"); setPanelOpen(false); load(); }
    catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };
  const update = async (payload) => {
    try { await api.put(`/rewards/${editing.id}`, payload); toast.success("Reward updated!"); setPanelOpen(false); setEditing(null); load(); }
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

  const balance = user?.coin_balance ?? 0;

  return (
    <div data-testid="rewards-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#5C5C68]">Rewards shop</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-black tracking-tighter">Treat yourself</h1>
        </div>
        <button onClick={() => { setEditing(null); setPanelOpen(true); }} className="nb-btn nb-btn-primary" data-testid="new-reward-btn">
          <Plus className="w-4 h-4" strokeWidth={3} /> New Reward
        </button>
      </div>

      <div className="nb-card p-5 mb-6 bg-[#FFD166] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingBag className="w-6 h-6" strokeWidth={3} />
          <div>
            <div className="font-heading font-black text-xl">Your wallet</div>
            <div className="text-sm font-semibold">Spend coins on custom rewards you define.</div>
          </div>
        </div>
        <div className="nb-badge-coin !text-lg !px-4 !py-2" data-testid="rewards-balance"><Coins className="w-5 h-5" strokeWidth={3} />{balance}</div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-[#5C5C68] font-bold">Loading...</div>
      ) : rewards.length === 0 ? (
        <div className="nb-card p-10 text-center">
          <Gift className="w-12 h-12 mx-auto text-[#EF476F]" strokeWidth={2.75} />
          <h3 className="font-heading text-2xl font-extrabold mt-3">No rewards yet!</h3>
          <p className="text-[#5C5C68] mt-1 mb-4">Define rewards you want to buy with your hard-earned coins.</p>
          <button onClick={() => setPanelOpen(true)} className="nb-btn nb-btn-primary" data-testid="empty-new-reward-btn">
            <Plus className="w-4 h-4" strokeWidth={3} /> Create a reward
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rewards.map((r) => {
            const afford = balance >= r.cost;
            return (
              <div key={r.id} className="nb-card nb-card-hover p-5 flex flex-col" data-testid={`reward-card-${r.id}`}>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-[#EF476F] border-2 border-[#1E1E24] flex items-center justify-center" style={{ boxShadow: "2px 2px 0 0 #1E1E24" }}>
                    <Gift className="w-6 h-6 text-white" strokeWidth={3} />
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(r); setPanelOpen(true); }} className="w-8 h-8 rounded-lg border-2 border-[#1E1E24] bg-white flex items-center justify-center hover:bg-[#F3F0EA]" data-testid={`reward-edit-${r.id}`}>
                      <Pencil className="w-3.5 h-3.5" strokeWidth={2.75} />
                    </button>
                    <button onClick={() => remove(r.id)} className="w-8 h-8 rounded-lg border-2 border-[#1E1E24] bg-white flex items-center justify-center hover:bg-[#EF476F] hover:text-white" data-testid={`reward-delete-${r.id}`}>
                      <Trash2 className="w-3.5 h-3.5" strokeWidth={2.75} />
                    </button>
                  </div>
                </div>
                <h3 className="font-heading font-extrabold text-xl" data-testid={`reward-name-${r.id}`}>{r.name}</h3>
                {r.description && <p className="text-sm text-[#5C5C68] mt-0.5 mb-3">{r.description}</p>}
                <div className="flex items-center justify-between mt-auto pt-3">
                  <span className="nb-badge-coin !text-base !px-3"><Coins className="w-4 h-4" strokeWidth={3} />{r.cost}</span>
                  <span className="text-xs font-bold text-[#5C5C68]">Redeemed {r.times_redeemed || 0}x</span>
                </div>
                <button
                  onClick={() => redeem(r.id)}
                  disabled={!afford}
                  className={`nb-btn w-full mt-4 ${afford ? "nb-btn-secondary" : "nb-btn-outline"}`}
                  data-testid={`reward-redeem-${r.id}`}
                >
                  {afford ? <>Redeem <Gift className="w-4 h-4" strokeWidth={3} /></> : `Need ${r.cost - balance} more`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <RewardForm
        open={panelOpen}
        onClose={() => { setPanelOpen(false); setEditing(null); }}
        onSubmit={editing ? update : create}
        initial={editing}
      />
    </div>
  );
}
