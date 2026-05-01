import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Coins, Gift, TrendingUp, TrendingDown, Calendar } from "lucide-react";

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const datePart = d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const timePart = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}

function RedemptionRow({ item }) {
  return (
    <div className="nb-card p-4 flex items-center gap-4" data-testid={`redemption-${item.id}`}>
      <div className="w-11 h-11 rounded-xl bg-[#FFD166] border-2 border-[#1E1E24] flex items-center justify-center shrink-0">
        <Gift className="w-5 h-5" strokeWidth={3} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-heading font-extrabold truncate">{item.reward_name}</div>
        <div className="text-xs text-[#5C5C68] flex items-center gap-1">
          <Calendar className="w-3 h-3" strokeWidth={3} /> {formatDate(item.redeemed_at)}
        </div>
      </div>
      <div className="nb-badge bg-[#F43F5E] text-white flex items-center gap-1">
        <Coins className="w-3.5 h-3.5" strokeWidth={3} />-{item.cost}
      </div>
    </div>
  );
}

function TransactionRow({ tx }) {
  const isEarn = tx.amount > 0;
  const iconCls = isEarn ? "bg-[#06D6A0]" : "bg-[#F43F5E] text-white";
  const badgeCls = isEarn ? "bg-[#06D6A0] text-[#1E1E24]" : "bg-[#F43F5E] text-white";
  const sign = isEarn ? "+" : "";
  return (
    <div className="nb-card p-4 flex items-center gap-4" data-testid={`tx-${tx.id}`}>
      <div className={`w-11 h-11 rounded-xl border-2 border-[#1E1E24] flex items-center justify-center shrink-0 ${iconCls}`}>
        {isEarn ? <TrendingUp className="w-5 h-5" strokeWidth={3} /> : <TrendingDown className="w-5 h-5" strokeWidth={3} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold truncate">{tx.description}</div>
        <div className="text-xs text-[#5C5C68]">{formatDate(tx.created_at)}</div>
      </div>
      <div className={`nb-badge flex items-center gap-1 ${badgeCls}`}>
        <Coins className="w-3.5 h-3.5" strokeWidth={3} />
        {sign}{tx.amount}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, subtitle, color }) {
  return (
    <div className="nb-card p-10 text-center">
      <Icon className={`w-12 h-12 mx-auto ${color}`} strokeWidth={2.75} />
      <h3 className="font-heading text-2xl font-extrabold mt-3">{title}</h3>
      <p className="text-[#5C5C68] mt-1">{subtitle}</p>
    </div>
  );
}

export default function History() {
  const [tab, setTab] = useState("redemptions");
  const [redemptions, setRedemptions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, t] = await Promise.all([api.get("/redemptions"), api.get("/transactions")]);
      setRedemptions(r.data);
      setTransactions(t.data);
    } catch (e) {
      console.error("Failed to load history", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const renderRedemptions = () => {
    if (redemptions.length === 0) {
      return <EmptyState icon={Gift} title="No redemptions yet" subtitle="Redeem a reward to see it here." color="text-[#0EA5E9]" />;
    }
    return (
      <div className="space-y-3" data-testid="redemptions-list">
        {redemptions.map((r) => <RedemptionRow key={r.id} item={r} />)}
      </div>
    );
  };

  const renderTransactions = () => {
    if (transactions.length === 0) {
      return <EmptyState icon={Coins} title="No transactions yet" subtitle="Earn or spend coins to see them here." color="text-[#FFD166]" />;
    }
    return (
      <div className="space-y-3" data-testid="transactions-list">
        {transactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)}
      </div>
    );
  };

  const renderContent = () => {
    if (loading) return <div className="text-center py-16 text-[#5C5C68] font-bold">Loading...</div>;
    if (tab === "redemptions") return renderRedemptions();
    return renderTransactions();
  };

  return (
    <div data-testid="history-page">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#5C5C68]">Activity log</p>
        <h1 className="font-heading text-4xl sm:text-5xl font-black tracking-tighter">History</h1>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("redemptions")} className={`nb-btn ${tab === "redemptions" ? "nb-btn-primary" : "nb-btn-outline"}`} data-testid="tab-redemptions">
          <Gift className="w-4 h-4" strokeWidth={3} /> Redemptions
        </button>
        <button onClick={() => setTab("transactions")} className={`nb-btn ${tab === "transactions" ? "nb-btn-primary" : "nb-btn-outline"}`} data-testid="tab-transactions">
          <Coins className="w-4 h-4" strokeWidth={3} /> Coin Ledger
        </button>
      </div>

      {renderContent()}
    </div>
  );
}
