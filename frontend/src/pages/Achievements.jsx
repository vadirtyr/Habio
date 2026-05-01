import React, { useEffect, useState, useCallback, useRef } from "react";
import { api } from "@/lib/api";
import { celebrateBig } from "@/lib/confetti";
import * as LucideIcons from "lucide-react";
import { Trophy, Lock } from "lucide-react";
import { toast } from "sonner";

function ProgressBar({ percent, color, earned }) {
  return (
    <div className="w-full h-2 rounded-full bg-[#F3F0EA] dark:bg-[#2A2A33] border border-[#1E1E24] dark:border-[#FDFCFB] overflow-hidden">
      <div
        className="h-full transition-all"
        style={{ width: `${percent}%`, background: earned ? color : "#9AA0A6" }}
      />
    </div>
  );
}

function timeAgo(iso) {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400000);
  if (days <= 0) {
    const hrs = Math.floor(ms / 3600000);
    if (hrs <= 0) return "just now";
    return `${hrs}h ago`;
  }
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  return `${months} months ago`;
}

function AchievementCard({ item }) {
  const Icon = LucideIcons[item.icon] || Trophy;
  const cardCls = item.earned ? "bg-white dark:bg-[#1F1F28]" : "bg-[#F3F0EA] dark:bg-[#1A1A22]";
  const iconBg = item.earned ? "" : "grayscale opacity-60";

  return (
    <div className={`nb-card nb-card-hover p-5 ${cardCls}`} data-testid={`achievement-${item.id}`}>
      <div className="flex items-start gap-4">
        <div
          className={`w-14 h-14 rounded-2xl border-2 border-[#1E1E24] dark:border-[#FDFCFB] flex items-center justify-center shrink-0 ${iconBg}`}
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
          <p className="text-sm text-[#5C5C68] dark:text-[#9AA0A6] mt-1 mb-3">{item.description}</p>
          {item.earned && item.earned_at ? (
            <div className="text-xs font-bold text-[#5C5C68] dark:text-[#9AA0A6]" data-testid={`achievement-time-${item.id}`}>
              Unlocked {timeAgo(item.earned_at)}
            </div>
          ) : (
            <>
              <ProgressBar percent={item.percent} color={item.color} earned={item.earned} />
              <div className="text-xs font-bold text-[#5C5C68] dark:text-[#9AA0A6] mt-1">
                {Math.min(item.raw_progress, item.target)} / {item.target}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Achievements() {
  const [data, setData] = useState({ items: [], earned_count: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const celebratedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get("/achievements");
      setData(res);
      // Celebrate any newly earned (only on first load of the page lifecycle)
      const newly = res.items.filter((x) => x.newly_earned);
      if (newly.length > 0 && !celebratedRef.current) {
        celebratedRef.current = true;
        celebrateBig();
        newly.forEach((a) => toast.success(`🏆 New trophy: ${a.name}!`));
      }
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
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#5C5C68] dark:text-[#9AA0A6]">Trophy room</p>
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
        <div className="text-center py-16 text-[#5C5C68] dark:text-[#9AA0A6] font-bold">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {data.items.map((a) => <AchievementCard key={a.id} item={a} />)}
        </div>
      )}
    </div>
  );
}
