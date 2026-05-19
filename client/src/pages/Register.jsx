import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { register } from "../api/auth";
import { Loader2, Zap } from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login: setUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      const data = await register(name, email, password);
      if (data.success) {
        setUser(data.data.user);
        navigate("/dashboard");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-white/[0.04]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#d97706] rounded-md flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold tracking-tight text-lg">Momentum</span>
        </div>
        <div className="space-y-4">
          <p className="text-3xl font-semibold text-white leading-snug tracking-tight">
            Build the habits.<br />Track the progress.<br />Own the outcome.
          </p>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
            Momentum unifies your academic, fitness, and wellness data into a single intelligent dashboard.
          </p>
        </div>
        <p className="text-xs text-zinc-700">© 2026 Momentum</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-amber-500 rounded-md flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold tracking-tight text-lg">Momentum</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl font-semibold text-white tracking-tight">Create account</h1>
            <p className="text-sm text-zinc-500">Start tracking your performance today.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Full name
              </label>
              <input
                type="text"
                placeholder="Ashwin"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#141414] border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d97706]/50 focus:ring-1 focus:ring-[#d97706]/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#141414] border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d97706]/50 focus:ring-1 focus:ring-[#d97706]/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#141414] border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d97706]/50 focus:ring-1 focus:ring-[#d97706]/20 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Confirm password
              </label>
              <input
                type="password"
                placeholder="Repeat your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-[#141414] border border-white/[0.06] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[#d97706]/50 focus:ring-1 focus:ring-[#d97706]/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#d97706] hover:bg-[#b45309] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isLoading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-sm text-zinc-500 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-[#d97706] hover:text-[#fbbf24] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
