import { createFileRoute } from "@tanstack/react-router";
import { useRole, type Role } from "@/lib/roleStore";
import { User, Bell, Shield, Palette, Smartphone, Globe, Info, LogOut, ChevronRight, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { usePassportStore } from "@/lib/passportStore";

export const Route = createFileRoute("/_app/settings")({
  component: Settings,
});

function Settings() {
  const [role, setRole] = useRole();
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(true);
  const { passportData } = usePassportStore();

  const profileName = passportData.fullName || "Aarav Sharma";
  const profileEmail = passportData.fullName ? `${passportData.fullName.toLowerCase().replace(/\s+/g, '.')}@medshield.gov` : "aarav.sharma@medshield.gov";

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto space-y-8 text-white animate-fade-in">
      <div className="animate-slide-up stagger-1">
        <h1 className="font-display font-extrabold text-3xl md:text-4xl text-[#031B1D]">Settings</h1>
        <p className="text-sm text-[#031B1D]/50 mt-1">Platform configuration and profile management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Navigation Tabs (Visual only for now) */}
        <div className="space-y-2 animate-slide-up stagger-2">
          <Tab icon={User} label="Profile" active />
          <Tab icon={Bell} label="Notifications" />
          <Tab icon={Shield} label="Security" />
          <Tab icon={Palette} label="Appearance" />
          <Tab icon={Globe} label="Language" />
          <Tab icon={Info} label="About" />
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* User Profile Section */}
          <div className="panel animate-slide-up stagger-2">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-2xl bg-teal/20 grid place-items-center text-teal border border-teal/20">
                <User className="h-8 w-8" />
              </div>
              <div>
                <div className="font-display font-bold text-xl">{profileName}</div>
                <div className="text-xs text-white/50">{profileEmail}</div>
              </div>
              <button className="ml-auto text-[10px] font-bold text-teal border border-teal/20 px-3 py-1 rounded-lg hover:bg-teal/10 transition-colors uppercase">Edit</button>
            </div>
            
            <div className="space-y-4">
              <div className="font-display font-bold text-sm text-white/40 uppercase tracking-widest">Active Role Control</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {(["citizen", "coordinator", "responder"] as Role[]).map((r) => (
                  <button
                    key={r} 
                    onClick={() => {
                      setRole(r);
                      toast.success(`Role switched to ${r}`);
                    }}
                    className={`p-3 rounded-xl text-xs font-bold capitalize transition-all border ${
                      role === r
                        ? "bg-teal text-black border-teal shadow-[0_0_20px_rgba(0,255,209,0.2)]"
                        : "bg-white/5 text-white/40 border-white/5 hover:border-white/20"
                    }`}
                  >
                    {r === "coordinator" ? "Healthcare Coord." : r === "responder" ? "Crisis Responder" : "Citizen"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="panel animate-slide-up stagger-3">
            <div className="font-display font-bold text-lg mb-6">System Preferences</div>
            <div className="space-y-6">
              <ToggleRow 
                icon={Bell} 
                label="Push Notifications" 
                desc="Receive real-time alerts for critical zone updates" 
                active={notifications} 
                onChange={setNotifications} 
              />
              <ToggleRow 
                icon={Smartphone} 
                label="Biometric Access" 
                desc="Secure Health Passport with FaceID / Fingerprint" 
                active={biometrics} 
                onChange={setBiometrics} 
              />
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-white/5 grid place-items-center text-white/60">
                    <Moon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold">Theme Mode</div>
                    <div className="text-[11px] text-white/40">Switch between light and high-contrast dark</div>
                  </div>
                </div>
                <div className="flex p-1 rounded-lg bg-white/5 border border-white/5">
                  <button className="p-1.5 rounded-md bg-white/10 text-white"><Sun className="h-4 w-4" /></button>
                  <button className="p-1.5 rounded-md text-white/40 hover:text-white"><Moon className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          </div>

          {/* System Info Section */}
          <div className="panel animate-slide-up stagger-4 space-y-3">
            <div className="font-display font-bold text-sm text-white/40 uppercase tracking-widest mb-2">Protocol Information</div>
            <Row k="Protocol Version" v="MEDSHIELD-X 1.0.4" />
            <Row k="Encryption Standard" v="AES-256-GCM" />
            <Row k="Network Node" v="IND-SOUTH-BGL-01" />
            <Row k="Last Security Audit" v="May 20, 2026" />
            <div className="pt-4 border-t border-white/5 flex gap-4">
              <button className="flex-1 py-3 rounded-xl bg-white/5 text-xs font-bold text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
                <Info className="h-4 w-4" />
                Release Notes
              </button>
              <button className="flex-1 py-3 rounded-xl bg-red-500/10 text-xs font-bold text-red-500 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
                <LogOut className="h-4 w-4" />
                Terminate Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tab({ icon: Icon, label, active = false }: { icon: any; label: string; active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
      active ? "bg-teal/10 text-teal border border-teal/20" : "text-white/40 hover:text-white hover:bg-white/5"
    }`}>
      <Icon className="h-4 w-4" />
      <span className="flex-1 text-left">{label}</span>
      <ChevronRight className={`h-4 w-4 opacity-30 ${active ? "opacity-100" : ""}`} />
    </button>
  );
}

function ToggleRow({ icon: Icon, label, desc, active, onChange }: { icon: any; label: string; desc: string; active: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-lg bg-white/5 grid place-items-center text-white/60">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-bold">{label}</div>
          <div className="text-[11px] text-white/40">{desc}</div>
        </div>
      </div>
      <button 
        onClick={() => onChange(!active)}
        className={`w-10 h-5 rounded-full relative transition-colors ${active ? "bg-teal" : "bg-white/10"}`}
      >
        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${active ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between items-center py-1"><span className="text-xs text-white/60">{k}</span><span className="font-mono text-[11px] text-white font-bold">{v}</span></div>;
}
