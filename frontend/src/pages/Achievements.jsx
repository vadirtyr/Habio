import React, { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import * as LucideIcons from "lucide-react";
import { Trophy, Lock } from "lucide-react";

function ProgressBar({ percent, color, earned }) {
  return (
    <div className="w-full h-2 rounded-full bg-[#F3F0EA] border border-[#1E1E24] overflow-hidden">
      <div
        className="h-full transition-all"
        style={{ width: `${percent}%`, background: earned ? color : "#9AA0A6" }}
      />
    </div>
  );
}

function AchievementCard({ item }) {
  const Icon = LucideIcons[item.icon] || Trophy;
  const cardCls = item.earned ? "bg-white" : "bg-[#F3F0EA]";
  const iconBg = item.earned ? "" : "grayscale opacity-60";

  return (
    <div className={`nb-card nb-card-hover p-5 ${cardCls}`} data-testid={`achievement-${item.id}`}>
      <div className="flex items-start gap-4">
        <div
          className={`w-14 h-14 rounded-2xl border-2 border-[#1E1E24] flex items-center justify-center shrink-0 ${iconBg}`}
          style={{ background: item.earned ? item.color : "#FDFCFB", boxShadow: "3px 3px 0 0 #1E1E24" }}
        >
          {item.earned
            ? <Icon className="w-7 h-7 text-white" strokeWidth={2.75} />
            : <Lock className="w-6 h-6 text-[#5C5C68]" strokeWidth={2.75} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading font-extrabold text-lg leading-tight">{item.name}</h3>
            {item.earned && (
              <span className="nb-badge bg-[#06D6A0] text-[#1E1E24]" data-testid={`achievement-earned-${item.id}`}>EARNED</span>
            )}
          </div>
          <p className="text-sm text-[#5C5C68] mt-1 mb-3">{item.description}</p>
          <ProgressBar percent={item.percent} color={item.color} earned={item.earned} />
          <div className="text-xs font-bold text-[#5C5C68] mt-1">
            {Math.min(item.raw_progress, item.target)} / {item.target}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Achievements() {
  const [data, setData] = useState({ items: [], earned_count: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get("/achievements");
      setData(res);
    } catch (e) {
      console.error("Failed to load achievements", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div data-testid="achievements-page">
      <div className="mb-8">
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#5C5C68]">Trophy room</p>
        <h1 className="font-heading text-4xl sm:text-5xl font-black tracking-tighter">Achievements</h1>
      </div>

      <div className="nb-card p-5 mb-6 bg-[#FFD166] flex items-center justify-between" data-testid="achievement-summary">
        <div className="flex items-center gap-3">
          <Trophy className="w-7 h-7" strokeWidth={3} />
          <div>
            <div className="font-heading font-black text-2xl">{data.earned_count} / {data.total} unlocked</div>
            <div className="text-sm font-semibold">Keep building habits to earn more!</div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-[#5C5C68] font-bold">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {data.items.map((a) => <AchievementCard key={a.id} item={a} />)}
        </div>
      )}
    </div>
  );
}
