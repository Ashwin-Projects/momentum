import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  BookOpen,
  Dumbbell,
  UtensilsCrossed,
  Moon,
  LineChart,
  Sparkles,
  Target,
  Brain,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/targets", icon: Target, label: "Targets" },
  { to: "/study", icon: BookOpen, label: "Study" },
  { to: "/workout", icon: Dumbbell, label: "Workout" },
  { to: "/nutrition", icon: UtensilsCrossed, label: "Nutrition" },
  { to: "/sleep", icon: Moon, label: "Sleep" },
  { to: "/focus", icon: Brain, label: "Focus" },
  { to: "/analytics", icon: LineChart, label: "Analytics" },
  { to: "/ai-planner", icon: Sparkles, label: "AI Planner" },
  { to: "/notifications", icon: Bell, label: "Notifications" },
];

export default function Sidebar() {
  const { user } = useAuth();
  const initial = user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <aside className="hidden w-64 flex-col border-r border-white/[0.04] bg-[#0a0a0a] md:flex">
      <div className="flex h-16 items-center gap-2 border-b border-white/[0.04] px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-[#141414]">
          <span className="text-sm font-bold text-white">M</span>
        </div>
        <span className="text-lg font-semibold tracking-tight">Momentum</span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "relative flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "text-white"
                  : "text-zinc-500 hover:bg-[#1a1a1a] hover:text-zinc-300"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute inset-0 rounded-lg bg-[#d97706]/10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="relative z-10">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      {user && (
        <div className="border-t border-white/[0.04] p-3">
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                isActive ? "bg-[#d97706]/10" : "hover:bg-[#1a1a1a]"
              )
            }
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d97706]/15 text-sm font-semibold text-[#d97706]">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-zinc-200">{user.name}</p>
              <p className="text-xs text-zinc-500">View profile</p>
            </div>
          </NavLink>
        </div>
      )}
    </aside>
  );
}
