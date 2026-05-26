import { useEffect, useState } from "react";
import { useOnline } from "@/lib/roleStore";
import { nationalStats } from "@/lib/mockData";
import { Wifi, WifiOff, LogIn, LogOut, User } from "lucide-react";
import { useAuth, logout } from "@/lib/useAuth";
import { AuthModal } from "./AuthModal";
import { toast } from "sonner";

const ALERT_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  GREEN: { bg: "rgba(16,185,129,0.12)", text: "var(--mild)", ring: "var(--mild)" },
  AMBER: { bg: "rgba(245,158,11,0.12)", text: "var(--moderate)", ring: "var(--moderate)" },
  ORANGE: { bg: "rgba(239,68,68,0.14)", text: "#fb923c", ring: "#fb923c" },
  RED: { bg: "var(--red-dim)", text: "var(--red)", ring: "var(--red)" },
};

export function TopBar({ showAlert = true }: { showAlert?: boolean }) {
  const [time, setTime] = useState("");
  const online = useOnline();
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const t = () =>
      setTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    t();
    const i = setInterval(t, 1000);
    return () => clearInterval(i);
  }, []);

  const a = ALERT_COLORS[nationalStats.alertLevel];

  async function handleLogout() {
    await logout();
    toast.success("Signed out");
  }

  return (
    <>
      <header
        className="h-[52px] flex items-center justify-between px-4 border-b shrink-0 bg-white"
        style={{ borderColor: "rgba(0,0,0,0.05)" }}
      >
        <div className="flex items-center gap-3">
          {showAlert && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: a.bg, color: a.text, border: `1px solid ${a.ring}` }}
            >
              <span className="relative h-2 w-2">
                <span
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{ background: a.ring, opacity: 0.7 }}
                />
                <span className="relative block h-2 w-2 rounded-full" style={{ background: a.ring }} />
              </span>
              <span className="font-mono tracking-wider">ALERT LEVEL: {nationalStats.alertLevel}</span>
            </div>
          )}
          <div className="text-xs text-[#031B1D]/50 hidden lg:block font-mono">
            MedShield Emergency Operations Centre · South Asia
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="font-mono text-xs text-[#031B1D]/60">{time} IST</div>
          <div className="flex items-center gap-1.5 text-xs">
            {online ? (
              <>
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                <span className="font-mono font-bold text-green-600">LIVE</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-red-500" />
                <span className="font-mono font-bold text-red-500">OFFLINE</span>
              </>
            )}
          </div>

          {/* Auth section */}
          {!loading && (
            user ? (
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-mono border border-black/5 bg-black/5 text-[#031B1D]"
                >
                  <User className="h-3 w-3" />
                  <span className="max-w-[100px] truncate">{user.displayName || user.email?.split("@")[0]}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-[11px] font-mono text-[#031B1D]/40 hover:text-[#031B1D] transition-colors"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-mono font-bold transition-colors border border-teal/20 bg-teal/5 text-teal"
              >
                <LogIn className="h-3 w-3" />
                Sign In
              </button>
            )
          )}
        </div>
      </header>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
}
