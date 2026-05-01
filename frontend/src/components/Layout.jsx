import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Coins, LayoutDashboard, Flame, ListChecks, Gift, History, LogOut, Sparkles, Trophy } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/habits", label: "Habits", icon: Flame },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/rewards", label: "Rewards", icon: Gift },
  { to: "/achievements", label: "Trophies", icon: Trophy },
  { to: "/history", label: "History", icon: History },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <header className="sticky top-0 z-30 bg-[#FDFCFB]/95 backdrop-blur border-b-2 border-[#1E1E24]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2" data-testid="app-logo-link">
            <div className="w-10 h-10 rounded-xl bg-[#EF476F] border-2 border-[#1E1E24] flex items-center justify-center" style={{ boxShadow: "3px 3px 0 0 #1E1E24" }}>
              <Sparkles className="w-5 h-5 text-white" strokeWidth={3} />
            </div>
            <span className="font-heading font-black text-2xl tracking-tight">HabitQuest</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                    isActive ? "bg-[#1E1E24] text-white" : "text-[#1E1E24] hover:bg-[#F3F0EA]"
                  }`
                }
              >
                <item.icon className="w-4 h-4" strokeWidth={2.75} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="nb-badge-coin" data-testid="coin-balance">
              <Coins className="w-4 h-4" strokeWidth={3} />
              <span>{user?.coin_balance ?? 0}</span>
            </div>
            <button onClick={handleLogout} className="nb-btn nb-btn-outline !px-3 !py-2" data-testid="logout-btn" aria-label="Logout">
              <LogOut className="w-4 h-4" strokeWidth={2.75} />
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <nav className="md:hidden border-t-2 border-[#1E1E24] bg-white overflow-x-auto">
          <div className="flex items-center gap-1 px-3 py-2 min-w-max">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 whitespace-nowrap ${
                    isActive ? "bg-[#1E1E24] text-white" : "text-[#1E1E24]"
                  }`
                }
              >
                <item.icon className="w-4 h-4" strokeWidth={2.75} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-10">{children}</main>
    </div>
  );
}
