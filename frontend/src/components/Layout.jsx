import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { Coins, LayoutDashboard, Flame, ListChecks, Gift, History, LogOut, Sparkles, Trophy, Zap, Sun, Moon } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/habits", label: "Habits", icon: Flame },
  { to: "/tasks", label: "Tasks", icon: ListChecks },
  { to: "/quests", label: "Quests", icon: Zap },
  { to: "/rewards", label: "Rewards", icon: Gift },
  { to: "/achievements", label: "Trophies", icon: Trophy },
  { to: "/history", label: "History", icon: History },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-[#14141A] text-[#1E1E24] dark:text-[#F3F0EA]">
      <header className="sticky top-0 z-30 bg-[#FDFCFB]/95 dark:bg-[#14141A]/95 backdrop-blur border-b-2 border-[#1E1E24] dark:border-[#FDFCFB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2" data-testid="app-logo-link">
            <div className="w-10 h-10 rounded-xl bg-[#0EA5E9] border-2 border-[#1E1E24] dark:border-[#FDFCFB] flex items-center justify-center" style={{ boxShadow: "3px 3px 0 0 currentColor" }}>
              <Sparkles className="w-5 h-5 text-white" strokeWidth={3} />
            </div>
            <span className="font-heading font-black text-2xl tracking-tight">Habio</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all ${
                    isActive
                      ? "bg-[#1E1E24] text-white dark:bg-[#FDFCFB] dark:text-[#1E1E24]"
                      : "text-[#1E1E24] dark:text-[#F3F0EA] hover:bg-[#F3F0EA] dark:hover:bg-[#2A2A33]"
                  }`
                }
              >
                <item.icon className="w-4 h-4" strokeWidth={2.75} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="nb-badge-coin" data-testid="coin-balance">
              <Coins className="w-4 h-4" strokeWidth={3} />
              <span>{user?.coin_balance ?? 0}</span>
            </div>
            <button onClick={toggle} className="nb-btn nb-btn-outline !px-3 !py-2" data-testid="theme-toggle-btn" aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="w-4 h-4" strokeWidth={2.75} /> : <Moon className="w-4 h-4" strokeWidth={2.75} />}
            </button>
            <button onClick={handleLogout} className="nb-btn nb-btn-outline !px-3 !py-2" data-testid="logout-btn" aria-label="Logout">
              <LogOut className="w-4 h-4" strokeWidth={2.75} />
            </button>
          </div>
        </div>

        <nav className="lg:hidden border-t-2 border-[#1E1E24] dark:border-[#FDFCFB] bg-white dark:bg-[#1F1F28] overflow-x-auto">
          <div className="flex items-center gap-1 px-3 py-2 min-w-max">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? "bg-[#1E1E24] text-white dark:bg-[#FDFCFB] dark:text-[#1E1E24]"
                      : "text-[#1E1E24] dark:text-[#F3F0EA]"
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
