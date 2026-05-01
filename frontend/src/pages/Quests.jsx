import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { celebrate } from "@/lib/confetti";
import * as LucideIcons from "lucide-react";
import { Coins, Sparkles, Lock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

function ProgressBar({ percent, color }) {
  return (
    <div className="w-full h-2.5 rounded-full bg-[#F3F0EA] dark:bg-[#2A2A33] border border-[#1E1E24] dark:border-[#FDFCFB] overflow-hidden">
      <div className="h-full transition-all" style={{ width: `${percent}%`, background: color }} />
    </div>
  );
}

function getButtonContent(quest, claiming) {
  if (claiming) return "Claiming...";
  if (quest.claimed) return <><CheckCircle2 className="w-4 h-4" strokeWidth={3} /> Claimed</>;
  if (quest.claimable) return <><Sparkles className="w-4 h-4" strokeWidth={3} /> Claim +{quest.reward}</>;
  return <><Lock className="w-4 h-4" strokeWidth={3} /> Locked</>;
}

function getButtonClass(quest) {
  if (quest.claimed) return "nb-btn-outline";
  if (quest.claimable) return "nb-btn-success";
  return "nb-btn-outline";
}

function QuestCard({ quest, onClaim, claiming }) {
  const Icon = LucideIcons[quest.icon] || Sparkles;
  const periodLabel = quest.period === "daily" ? "DAILY" : "WEEKLY";
  const periodCls = quest.period === "daily" ? "bg-[#FFD166] text-[#1E1E24]" : "bg-[#3B82F6] text-white";

  return (
    <div className="nb-card nb-card-hover p-5" data-testid={`quest-${quest.id}`}>
      <div className="flex items-start gap-4 mb-4">
        <div
          className="w-14 h-14 rounded-2xl border-2 border-[#1E1E24] dark:border-[#FDFCFB] flex items-center justify-center shrink-0"
          style={{ background: quest.claimable ? "#06D6A0" : "#FFD166", boxShadow: "3px 3px 0 0 #1E1E24" }}
        >
          <Icon className="w-7 h-7 text-[#1E1E24]" strokeWidth={2.75} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`nb-badge ${periodCls}`}>{periodLabel}</span>
            <span className="nb-badge-coin !text-xs"><Coins className="w-3 h-3" strokeWidth={3} />+{quest.reward}</span>
          </div>
          <h3 className="font-heading font-extrabold text-lg leading-tight">{quest.name}</h3>
          <p className="text-sm text-[#5C5C68] dark:text-[#9AA0A6] mt-0.5">{quest.description}</p>
        </div>
      </div>

      <div className="mb-3">
        <ProgressBar percent={quest.percent} color={quest.completed ? "#06D6A0" : "#FFD166"} />
        <div className="text-xs font-bold text-[#5C5C68] dark:text-[#9AA0A6] mt-1">
          {quest.progress} / {quest.target}
        </div>
      </div>

      <button
        onClick={() => onClaim(quest.id)}
        disabled={!quest.claimable || claiming}
        className={`nb-btn w-full ${getButtonClass(quest)}`}
        data-testid={`quest-claim-${quest.id}`}
      >
        {getButtonContent(quest, claiming)}
      </button>
    </div>
  );
}

export default function Quests() {
  const { updateBalance } = useAuth();
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/quests");
      setQuests(data.items);
    } catch (e) {
      console.error("Failed to load quests", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const claim = async (questId) => {
    setClaimingId(questId);
    try {
      const { data } = await api.post(`/quests/${questId}/claim`);
      updateBalance(data.new_balance);
      celebrate("big");
      toast.success(`Quest claimed! +${data.coins_earned} coins`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div data-testid="quests-page">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#5C5C68] dark:text-[#9AA0A6]">Bonus rewards</p>
        <h1 className="font-heading text-4xl sm:text-5xl font-black tracking-tighter">Daily &amp; weekly quests</h1>
      </div>

      {loading ? (
        <div className="text-center py-16 text-[#5C5C68] dark:text-[#9AA0A6] font-bold">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {quests.map((q) => <QuestCard key={q.id} quest={q} onClaim={claim} claiming={claimingId === q.id} />)}
        </div>
      )}
    </div>
  );
}
