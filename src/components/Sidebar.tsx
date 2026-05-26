import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Activity, Map as MapIcon, IdCard, Hospital, Stethoscope, Syringe,
  WifiOff, Settings as SettingsIcon, ShieldAlert, Brain, ClipboardList, Bot, Plus
} from "lucide-react";
import { useOnline, useRole, type Role } from "@/lib/roleStore";

const items = [
  { to: "/dashboard",   label: "Crisis Dashboard",    icon: Activity },
  { to: "/dr-sentinel", label: "Dr. MedShield AI",     icon: Bot },
  { to: "/map",         label: "Pandemic Map",         icon: MapIcon },
  { to: "/passport",    label: "Health Passport",      icon: IdCard },
  { to: "/resources",   label: "Resource Intel",       icon: Hospital },
  { to: "/symptoms",    label: "Symptom Reports",      icon: Stethoscope },
  { to: "/vaccination", label: "Vaccination Status",   icon: Syringe },
  { to: "/offline",     label: "Offline Crisis Mode",  icon: WifiOff },
  { to: "/settings",    label: "Settings",             icon: SettingsIcon },
] as const;

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const online = useOnline();
  const [role, setRole] = useRole();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const syncTime = isMounted
    ? new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <aside
      className="hidden md:flex w-[280px] shrink-0 flex-col glass-sidebar h-screen sticky top-0"
    >
      <div className="px-6 py-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal grid place-items-center text-white">
            <ShieldAlert className="h-6 w-6" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-display font-extrabold tracking-tight text-xl text-white">MedShield</div>
            <div className="font-mono text-[9px] text-white/50 tracking-[0.2em] uppercase">Crisis Intelligence</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {items.map((it, idx) => {
          const active = pathname === it.to || (it.to === "/passport" && pathname.startsWith("/passport"));
          const Icon = it.icon;

          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] font-bold transition-all relative animate-slide-up stagger-${(idx % 4) + 1} ${
                active 
                  ? "bg-teal/10 text-teal border border-teal/20 shadow-[0_0_20px_rgba(0,255,209,0.05)]" 
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1 tracking-wide">{it.label}</span>
              {active && (
                <div className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(255,165,0,0.5)]" />
              )}
              {!active && (
                <div className="h-1.5 w-1.5 rounded-full bg-green-500 opacity-60" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
             <span className="text-[11px] font-bold text-green-500 tracking-widest uppercase">All Systems Live</span>
          </div>
          <div className="text-[10px] text-white/40 font-mono tracking-tighter">
            Sync: {syncTime}
          </div>
        </div>

        <div>
          <div className="font-mono text-[10px] text-white/30 mb-3 tracking-widest uppercase font-bold">Role View:</div>
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/5">
            {(["citizen", "coordinator", "responder"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 text-[10px] py-2 rounded-lg font-bold transition-all ${
                  role === r
                    ? "bg-teal text-black shadow-[0_0_15px_rgba(0,255,209,0.3)]"
                    : "text-white/40 hover:text-white"
                }`}
              >
                {r === "coordinator" ? "Coord." : r[0].toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
