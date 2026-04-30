import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Coins, Gift, TrendingUp, TrendingDown, Calendar } from "lucide-react";

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) + " · " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function History() {
  const [tab, setTab] = useState("redemptions");
  const [redemptions, setRedemptions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [r, t] = await Promise.all([api.get("/redemptions"), api.get("/transactions")]);
      setRedemptions(r.data);
      setTransactions(t.data);
      setLoading(false);
    })();
  }, []);

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

      {loading ? (
        <div className="text-center py-16 text-[#5C5C68] font-bold">Loading...</div>
      ) : tab === "redemptions" ? (
        redemptions.length === 0 ? (
          <div className="nb-card p-10 text-center">
            <Gift className="w-12 h-12 mx-auto text-[#EF476F]" strokeWidth={2.75} />
            <h3 className="font-heading text-2xl font-extrabold mt-3">No redemptions yet</h3>
            <p className="text-[#5C5C68] mt-1">Redeem a reward to see it here.</p>
          </div>
        ) : (
          <div className="space-y-3" data-testid="redemptions-list">
            {redemptions.map((r) => (
              <div key={r.id} className="nb-card p-4 flex items-center gap-4" data-testid={`redemption-${r.id}`}>
                <div className="w-11 h-11 rounded-xl bg-[#FFD166] border-2 border-[#1E1E24] flex items-center justify-center shrink-0">
                  <Gift className="w-5 h-5" strokeWidth={3} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-heading font-extrabold truncate">{r.reward_name}</div>
                  <div className="text-xs text-[#5C5C68] flex items-center gap-1">
                    <Calendar className="w-3 h-3" strokeWidth={3} /> {formatDate(r.redeemed_at)}
                  </div>
                </div>
                <div className="nb-badge bg-[#EF476F] text-white flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" strokeWidth={3} />-{r.cost}
                </div>
              </div>
            ))}
          </div>
        )
      ) : transactions.length === 0 ? (
        <div className="nb-card p-10 text-center">
          <Coins className="w-12 h-12 mx-auto text-[#FFD166]" strokeWidth={2.75} />
          <h3 className="font-heading text-2xl font-extrabold mt-3">No transactions yet</h3>
          <p className="text-[#5C5C68] mt-1">Earn or spend coins to see them here.</p>
        </div>
      ) : (
        <div className="space-y-3" data-testid="transactions-list">
          {transactions.map((tx) => {
            const isEarn = tx.amount > 0;
            return (
              <div key={tx.id} className="nb-card p-4 flex items-center gap-4" data-testid={`tx-${tx.id}`}>
                <div className={`w-11 h-11 rounded-xl border-2 border-[#1E1E24] flex items-center justify-center shrink-0 ${isEarn ? "bg-[#06D6A0]" : "bg-[#EF476F] text-white"}`}>
                  {isEarn ? <TrendingUp className="w-5 h-5" strokeWidth={3} /> : <TrendingDown className="w-5 h-5" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{tx.description}</div>
                  <div className="text-xs text-[#5C5C68]">{formatDate(tx.created_at)}</div>
                </div>
                <div className={`nb-badge ${isEarn ? "bg-[#06D6A0] text-[#1E1E24]" : "bg-[#EF476F] text-white"} flex items-center gap-1`}>
                  <Coins className="w-3.5 h-3.5" strokeWidth={3} />
                  {isEarn ? "+" : ""}{tx.amount}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
