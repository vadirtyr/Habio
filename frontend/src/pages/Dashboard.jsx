import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { celebrate } from "@/lib/confetti";
import DifficultyBadge from "@/components/DifficultyBadge";
import { Coins, Flame, ListChecks, Gift, TrendingUp, Award, ArrowRight, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

function StatCard({ label, value, icon: Icon, bg, testId }) {
  return (
    <div className="nb-card nb-card-hover p-5" data-testid={testId}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold uppercase tracking-[0.15em] text-[#5C5C68]">{label}</span>
        <div className={`w-9 h-9 rounded-xl border-2 border-[#1E1E24] flex items-center justify-center ${bg}`} style={{ boxShadow: "2px 2px 0 0 #1E1E24" }}>
          <Icon className="w-4 h-4" strokeWidth={3} />
        </div>
      </div>
      <div className="font-heading text-4xl font-black">{value}</div>
    </div>
  );
}

function HabitItem({ habit, onComplete, popCoin }) {
  const { id, name, completed_today, streak, frequency, difficulty, coins_per_completion } = habit;
  const cardCls = completed_today ? "bg-[#F3F0EA] opacity-70" : "bg-white";
  const btnCls = completed_today ? "bg-[#06D6A0]" : "bg-white hover:bg-[#FFD166]";

  return (
    <li className={`relative flex items-center gap-3 p-3 rounded-xl border-2 border-[#1E1E24] ${cardCls}`} style={{ boxShadow: "2px 2px 0 0 #1E1E24" }}>
      <button
        onClick={() => onComplete(id)}
        disabled={completed_today}
        className={`w-10 h-10 shrink-0 rounded-lg border-2 border-[#1E1E24] flex items-center justify-center font-black ${btnCls}`}
        data-testid={`dashboard-complete-habit-${id}`}
        aria-label={`Complete ${name}`}
      >
        {completed_today ? <Check className="w-5 h-5" strokeWidth={3} /> : null}
      </button>
      <div className="flex-1 min-w-0">
        <div className="font-bold truncate">{name}</div>
        <div className="flex items-center gap-2 text-xs text-[#5C5C68]">
          <span className="flex items-center gap-1"><Flame className="w-3 h-3" strokeWidth={3} /> {streak}</span>
          <span>•</span>
          <span>{frequency}</span>
        </div>
      </div>
      <DifficultyBadge value={difficulty} />
      <span className="nb-badge-coin !text-xs !px-2 !py-0.5"><Coins className="w-3 h-3" strokeWidth={3} />{coins_per_completion}</span>
      {popCoin?.id === id && (
        <span className="absolute -top-2 right-3 font-heading font-black text-[#0EA5E9] text-lg animate-float-up">+{popCoin.amount}</span>
      )}
    </li>
  );
}

function TaskItem({ task, onComplete, popCoin }) {
  const { id, name, description, difficulty, coins_reward } = task;
  return (
    <li className="relative flex items-center gap-3 p-3 rounded-xl border-2 border-[#1E1E24] bg-white" style={{ boxShadow: "2px 2px 0 0 #1E1E24" }}>
      <button
        onClick={() => onComplete(id)}
        className="w-10 h-10 shrink-0 rounded-lg border-2 border-[#1E1E24] flex items-center justify-center bg-white hover:bg-[#06D6A0]"
        data-testid={`dashboard-complete-task-${id}`}
        aria-label={`Complete ${name}`}
      />
      <div className="flex-1 min-w-0">
        <div className="font-bold truncate">{name}</div>
        {description && <div className="text-xs text-[#5C5C68] truncate">{description}</div>}
      </div>
      <DifficultyBadge value={difficulty} />
      <span className="nb-badge-coin !text-xs !px-2 !py-0.5"><Coins className="w-3 h-3" strokeWidth={3} />{coins_reward}</span>
      {popCoin?.id === id && (
        <span className="absolute -top-2 right-3 font-heading font-black text-[#0EA5E9] text-lg animate-float-up">+{popCoin.amount}</span>
      )}
    </li>
  );
}

function HabitsCard({ habits, pendingCount, onComplete, popCoin }) {
  return (
    <div className="nb-card p-6" data-testid="today-habits-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-[#0EA5E9]" strokeWidth={3} />
          <h2 className="font-heading text-2xl font-extrabold">Today's Habits</h2>
        </div>
        <Link to="/habits" className="text-sm font-bold text-[#3B82F6] flex items-center gap-1">
          All <ArrowRight className="w-4 h-4" strokeWidth={2.75} />
        </Link>
      </div>
      {habits.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[#5C5C68] mb-3">No habits yet. Create your first one!</p>
          <Link to="/habits" className="nb-btn nb-btn-secondary inline-flex">+ Add Habit</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {habits.slice(0, 6).map((h) => <HabitItem key={h.id} habit={h} onComplete={onComplete} popCoin={popCoin} />)}
        </ul>
      )}
      {pendingCount > 0 && (
        <div className="mt-4 text-xs font-bold uppercase tracking-[0.15em] text-[#5C5C68]">
          {pendingCount} pending today
        </div>
      )}
    </div>
  );
}

function TasksCard({ tasks, onComplete, popCoin }) {
  return (
    <div className="nb-card p-6" data-testid="pending-tasks-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-[#3B82F6]" strokeWidth={3} />
          <h2 className="font-heading text-2xl font-extrabold">Pending Tasks</h2>
        </div>
        <Link to="/tasks" className="text-sm font-bold text-[#3B82F6] flex items-center gap-1">
          All <ArrowRight className="w-4 h-4" strokeWidth={2.75} />
        </Link>
      </div>
      {tasks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[#5C5C68] mb-3">All caught up! Nothing pending.</p>
          <Link to="/tasks" className="nb-btn nb-btn-primary inline-flex">+ Add Task</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {tasks.map((t) => <TaskItem key={t.id} task={t} onComplete={onComplete} popCoin={popCoin} />)}
        </ul>
      )}
    </div>
  );
}

function RewardsCTA() {
  return (
    <div className="mt-8 nb-card p-6 bg-gradient-to-r from-[#FFD166] to-[#0EA5E9] text-white" data-testid="rewards-cta">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Gift className="w-8 h-8" strokeWidth={3} />
          <div>
            <h3 className="font-heading font-black text-2xl">Spend your coins!</h3>
            <p className="font-semibold opacity-95">Create custom rewards and treat yourself.</p>
          </div>
        </div>
        <Link to="/rewards" className="nb-btn bg-white text-[#1E1E24]" data-testid="goto-rewards-btn">
          <Sparkles className="w-4 h-4" strokeWidth={3} /> Go to Rewards Shop
        </Link>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, updateBalance } = useAuth();
  const [stats, setStats] = useState(null);
  const [habits, setHabits] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [popCoin, setPopCoin] = useState(null);

  const load = useCallback(async () => {
    try {
      const [s, h, t] = await Promise.all([api.get("/stats"), api.get("/habits"), api.get("/tasks")]);
      setStats(s.data);
      setHabits(h.data);
      setTasks(t.data.filter((x) => !x.completed).slice(0, 5));
    } catch (e) {
      console.error("Failed to load dashboard", e);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const flashCoin = (amount, id) => {
    setPopCoin({ amount, id });
    setTimeout(() => setPopCoin(null), 900);
  };

  const completeHabit = async (id) => {
    try {
      const { data } = await api.post(`/habits/${id}/complete`);
      updateBalance(data.new_balance);
      flashCoin(data.coins_earned, id);
      celebrate(data.streak >= 7 ? "big" : "normal");
      toast.success(`+${data.coins_earned} coins! Streak: ${data.streak}`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    }
  };

  const completeTask = async (id) => {
    try {
      const { data } = await api.post(`/tasks/${id}/complete`);
      updateBalance(data.new_balance);
      flashCoin(data.coins_earned, id);
      celebrate("normal");
      toast.success(`+${data.coins_earned} coins!`);
      load();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    }
  };

  const pendingCount = habits.filter((h) => !h.completed_today).length;
  const greetingName = user?.name || user?.email?.split("@")[0] || "there";

  return (
    <div data-testid="dashboard-page">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#5C5C68]">Welcome back</p>
          <h1 className="font-heading text-4xl sm:text-5xl font-black tracking-tighter" data-testid="dashboard-greeting">
            Hey, {greetingName}!
          </h1>
        </div>
        <div className="flex gap-2">
          <Link to="/habits" className="nb-btn nb-btn-secondary" data-testid="quick-add-habit">+ New Habit</Link>
          <Link to="/tasks" className="nb-btn nb-btn-primary" data-testid="quick-add-task">+ New Task</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Coin Balance" value={user?.coin_balance ?? 0} icon={Coins} bg="bg-[#FFD166]" testId="stat-balance" />
        <StatCard label="Total Earned" value={stats?.total_earned ?? 0} icon={TrendingUp} bg="bg-[#06D6A0]" testId="stat-earned" />
        <StatCard label="Best Streak" value={stats?.best_streak ?? 0} icon={Flame} bg="bg-[#0EA5E9]" testId="stat-streak" />
        <StatCard label="Tasks Done" value={stats?.tasks_done ?? 0} icon={Award} bg="bg-[#3B82F6]" testId="stat-tasks-done" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HabitsCard habits={habits} pendingCount={pendingCount} onComplete={completeHabit} popCoin={popCoin} />
        <TasksCard tasks={tasks} onComplete={completeTask} popCoin={popCoin} />
      </div>

      <RewardsCTA />
    </div>
  );
}
