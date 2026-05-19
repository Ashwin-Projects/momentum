import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/button";
import { Menu, X, LogOut, ChevronDown, User, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/targets", label: "Targets" },
  { to: "/study", label: "Study" },
  { to: "/workout", label: "Workout" },
  { to: "/nutrition", label: "Nutrition" },
  { to: "/sleep", label: "Sleep" },
  { to: "/focus", label: "Focus" },
  { to: "/analytics", label: "Analytics" },
  { to: "/ai-planner", label: "AI Planner" },
  { to: "/notifications", label: "Notifications" },
  { to: "/profile", label: "Profile" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const profileMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const handleOutsideClick = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isProfileMenuOpen]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleProfileMenuToggle = () => {
    setIsProfileMenuOpen((prev) => !prev);
  };

  const handleSwitchAccount = async () => {
    await logout();
    setIsProfileMenuOpen(false);
    navigate("/login");
  };

  return (
    <header className="flex h-14 items-center justify-between border-b border-white/[0.04] bg-[#101010] px-4 md:px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden hover:bg-[#1a1a1a]"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <span className="text-base font-medium md:hidden">Momentum</span>
      </div>

      <div className="relative flex items-center gap-3" ref={profileMenuRef}>
        {user && (
          <button
            type="button"
            onClick={handleProfileMenuToggle}
            className="hidden items-center gap-2 rounded-lg border border-white/[0.04] bg-[#141414] px-3 py-1.5 text-left transition-colors hover:bg-[#1a1a1a] sm:flex"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1f1f1f] text-sm font-medium text-zinc-200">
              {user.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <span className="text-sm font-medium text-zinc-300">{user.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
          </button>
        )}
        {isProfileMenuOpen && user && (
          <div className="absolute right-0 top-11 z-50 w-72 rounded-xl border border-white/[0.04] bg-[#141414] p-2 shadow-lg">
            <NavLink
              to="/profile"
              onClick={() => setIsProfileMenuOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-[#1a1a1a]"
            >
              <User className="h-4 w-4 text-zinc-500" />
              Profile
            </NavLink>
            <NavLink
              to="/notifications"
              onClick={() => setIsProfileMenuOpen(false)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-[#1a1a1a]"
            >
              <Bell className="h-4 w-4 text-zinc-500" />
              Notifications
            </NavLink>
            <button
              type="button"
              onClick={handleSwitchAccount}
              className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-zinc-200 transition-colors hover:bg-[#1a1a1a]"
            >
              Sign in with a different account
            </button>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-zinc-500 hover:bg-[#1a1a1a] hover:text-zinc-300"
        >
          <LogOut className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline text-xs">Logout</span>
        </Button>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-14 z-50 w-full border-b border-white/[0.04] bg-[#101010] md:hidden">
          <nav className="max-h-[70vh] space-y-1 overflow-y-auto p-4">
            {mobileNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#d97706]/10 text-white"
                      : "text-zinc-500 hover:bg-[#1a1a1a] hover:text-zinc-300"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
