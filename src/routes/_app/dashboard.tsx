import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useEffect, useState } from "react";
import { useCountUp, fmtNum, useRole } from "@/lib/roleStore";
import { alerts, myPassport, cityOutbreaks, nationalStats as mockStats } from "@/lib/mockData";
import { OutbreakMap } from "@/components/OutbreakMap";
import { FacilityMap } from "@/components/FacilityMap";
import { CaseTrendChart } from "@/components/CaseTrendChart";
import { ForecastChart } from "@/components/ForecastChart";
import { CollapseRiskWatch } from "@/components/CollapseRiskWatch";
import { fetchNationalStats, type NationalStats } from "@/lib/realDataService";
import {
  computeNationalResourceLoad,
  forecastOutbreak,
  medicineDemand,
} from "@/lib/simulation";
import { TrendingUp, AlertTriangle, Activity, ArrowRight, Brain, Building2, Hospital, Syringe, Pill, Wifi, Bell, Info, Maximize2 } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function StatCard({
  label, value, sub, accent, trend, icon: Icon
}: { label: string; value: number | string; sub: string; accent: string; trend: string; icon: any }) {
  return (
    <div className="panel flex flex-col justify-between h-[140px] relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl grid place-items-center bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
            <Icon className="h-5 w-5" style={{ color: accent }} />
          </div>
          <div className="text-[9px] uppercase tracking-[0.2em] text-white/50 font-bold">{label}</div>
        </div>
        <div className="text-[10px] font-bold font-mono" style={{ color: accent }}>
          {trend}
        </div>
      </div>
      
      <div>
        <div className="font-display font-extrabold text-3xl tracking-tight text-white">
          {value}
        </div>
        <div className="text-[10px] text-white/40 mt-1 font-medium tracking-wide uppercase">{sub}</div>
      </div>

      <div className="absolute bottom-4 right-4 w-16 h-8 opacity-40">
         <div className="w-full h-full border-b-2 border-r-2" style={{ borderColor: accent, borderRadius: '0 0 8px 0' }} />
      </div>
    </div>
  );
}

function ResourceBar({ label, pct, icon: Icon }: { label: string; pct: number; icon: any }) {
  const color = pct > 75 ? "#FF3B3B" : pct > 50 ? "#FF9F1C" : "#00FF88";
  return (
    <div className="group relative hover:translate-x-1 transition-transform duration-300">
      <div className="flex items-center justify-between text-[10px] mb-2">
        <div className="flex items-center gap-2 text-white/50 group-hover:text-white transition-colors">
          <Icon className="h-3.5 w-3.5" style={{ color: color }} />
          <span className="font-bold tracking-wider uppercase">{label}</span>
        </div>
        <span className="font-mono font-bold text-white">{pct}%</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden bg-white/5 border border-white/5 relative">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-shimmer" />
        
        <div
          className="h-full rounded-full transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] animate-progress-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

function Dashboard() {
  const [role] = useRole();
  const [isMounted, setIsMounted] = useState(false);
  const [stats, setStats] = useState<NationalStats | null>({
    confirmed: 44993480, // Realistic Indian total
    active: mockStats.activeCases,
    recovered: 44463480,
    deceased: 531910,
    vaccinationPct: mockStats.vaccinationPct,
    vaccinationDoses: mockStats.vaccinationDoses
  });

  useEffect(() => {
    setIsMounted(true);
    const loadData = async () => {
      const s = await fetchNationalStats();
      setStats(s);
    };
    loadData();
    const timer = setInterval(loadData, 30000); // 30s refresh
    return () => clearInterval(timer);
  }, []);

  const resources = useMemo(() => computeNationalResourceLoad(), []);
  const medDemand = useMemo(() => medicineDemand(stats?.active), [stats?.active]);
  
  // Dynamically calculate critical zones from map data
  const criticalZonesCount = useMemo(() => {
    if (!stats) return 0;
    const scaleFactor = stats.active / 284000;
    return cityOutbreaks.filter(c => Math.round(c.activeCases * scaleFactor) > 500).length;
  }, [stats]);

  const today = useMemo(() => {
    if (!isMounted) return "";
    return new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [isMounted]);

  return (
    <div className="min-h-screen text-foreground animate-fade-in">
      <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
        <div className="flex items-end justify-between animate-slide-up stagger-1">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-red-500 font-bold mb-1">
              Role: {role.toUpperCase()}
            </div>
            <h1 className="font-display font-extrabold text-4xl tracking-tight text-foreground">MedShield Command</h1>
            <p className="text-sm text-foreground/50 mt-1 font-medium italic">Real-time pandemic intelligence · {today}</p>
          </div>
          <div className="flex items-center gap-2 text-red-500">
             <Activity className="h-4 w-4 animate-pulse" />
             <span className="text-[10px] font-bold uppercase tracking-widest">Auto-refresh enabled · 30s</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up stagger-2">
          <StatCard label="Active Cases — National" value={stats ? (stats.active / 100000).toFixed(2) + " L" : "..."} sub="+3,241 in last 24h" accent="#FF3B3B" trend="↑ 12%" icon={Activity} />
          <StatCard label="Currently Hospitalised" value={stats ? fmtNum(Math.round(stats.active * 0.15)) : "..."} sub="68% of national ICU capacity" accent="#FF9F1C" trend="↑ 8%" icon={Hospital} />
          <StatCard label="Recovered — National" value={stats ? (stats.recovered / 10000000).toFixed(2) + " Cr" : "..."} sub={`Recovery rate: ${stats ? ((stats.recovered / stats.confirmed) * 100).toFixed(1) : "94.2"}%`} accent="#00FF88" trend="↑ 24%" icon={TrendingUp} />
          <StatCard label="Doses Administered" value={stats ? (stats.vaccinationDoses / 10000000).toFixed(2) + " Cr" : "..."} sub={`${stats ? stats.vaccinationPct : 74}% of target population`} accent="#00C2FF" trend="↑ 7%" icon={Syringe} />
        </div>

        {/* Middle Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up stagger-3">
          <div className="panel lg:col-span-2 p-0 overflow-hidden relative">
            <div className="p-6 flex items-center justify-between border-b border-white/5">
              <div>
                <div className="font-display font-bold text-xl text-white">Pandemic Outbreak Map</div>
                <div className="text-[9px] font-bold text-white/40 uppercase tracking-widest mt-1">Live Simulation Mode</div>
              </div>
              <div className="flex items-center gap-3">
                 <div className={`flex items-center gap-2 py-1 px-3 rounded-lg ${criticalZonesCount > 0 ? 'bg-red-500/20 border border-red-500/20' : 'bg-green-500/20 border border-green-500/20'}`}>
                    <AlertTriangle className={`h-3 w-3 ${criticalZonesCount > 0 ? 'text-red-500' : 'text-green-500'}`} />
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${criticalZonesCount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      {criticalZonesCount} Critical Zones
                    </span>
                 </div>
                 <Link to="/map" className="text-[10px] font-bold text-green-500 flex items-center gap-1 hover:underline uppercase tracking-widest">
                   Full Analysis <ArrowRight className="h-3 w-3" />
                 </Link>
              </div>
            </div>
            <div className="p-4 bg-white/5">
              <OutbreakMap height={400} />
            </div>
          </div>

          <div className="panel flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="font-display font-bold text-xl text-white">Live Alerts</div>
              <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Auto-refresh 30s</span>
            </div>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {alerts.map((a, i) => {
                const isRed = a.severity === "RED" || (i === 0 && criticalZonesCount > 0);
                const badge = isRed ? "CRITICAL" : a.severity === "AMBER" ? "HIGH" : a.severity === "YELLOW" ? "MEDIUM" : "RESOLVED";
                const accent = isRed ? "#FF3B3B" : a.severity === "AMBER" ? "#FF9F1C" : a.severity === "YELLOW" ? "#EAB308" : "#00FF88";
                
                // Dynamically update the first alert if we have critical zones
                const message = (i === 0 && criticalZonesCount > 0) 
                  ? `${criticalZonesCount} Districts report rising transmission — Protocol X-1 Active`
                  : a.message;

                return (
                  <div key={a.id} className="flex items-start gap-4 p-1 group">
                    <div className={`h-8 w-8 rounded-full shrink-0 grid place-items-center ${isRed ? 'bg-red-500' : 'bg-white/5 border border-white/10'}`}>
                       {isRed ? <Bell className="h-4 w-4 text-white animate-pulse" /> : <Info className="h-4 w-4 text-white/50" />}
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center justify-between mb-1">
                          <div className="text-[12px] font-medium text-white/90 leading-tight pr-4">{message}</div>
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase tracking-widest border`} style={{ color: accent, borderColor: `${accent}40`, background: `${accent}10` }}>{badge}</span>
                       </div>
                       <div className="text-[9px] text-white/30 font-bold uppercase tracking-widest">{a.district} · {a.timestamp}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link to="/symptoms" className="mt-6 pt-4 text-center text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white border-t border-white/5 transition-all flex items-center justify-center gap-2">
              View all alerts <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="panel">
            <div className="flex items-center gap-3 mb-8">
               <div className="h-8 w-8 rounded-lg bg-green-500/10 grid place-items-center border border-green-500/20">
                  <Activity className="h-4 w-4 text-green-500" />
               </div>
               <div className="font-display font-bold text-lg text-white">MedShield Resource Status</div>
            </div>
            <div className="space-y-6">
              <ResourceBar label="ICU Beds" pct={resources.icu} icon={Hospital} />
              <ResourceBar label="Ventilators" pct={resources.ventilators} icon={Activity} />
              <ResourceBar label="Oxygen Supply" pct={resources.oxygen} icon={Activity} />
              <ResourceBar label="General Wards" pct={resources.generalWards} icon={Activity} />
              <ResourceBar label="Medicine Stock" pct={resources.medicineStock} icon={Pill} />
            </div>
            <Link to="/resources" className="mt-8 pt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white border-t border-white/5 transition-all">
              View resource center <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="panel relative">
            <div className="flex items-center justify-between mb-8">
               <div className="font-display font-bold text-lg text-white">Case Trend — 14 Days</div>
               <Maximize2 className="h-4 w-4 text-white/20" />
            </div>
            <div className="h-[180px]">
              <CaseTrendChart />
            </div>
            <div className="mt-6 pt-6 border-t border-white/5">
               <div className="text-[9px] font-bold uppercase tracking-widest text-green-500 mb-2">7-Day Projection</div>
               <div className="flex items-end justify-between">
                  <div className="font-display font-extrabold text-3xl text-white">+6,817</div>
                  <div className="h-8 flex items-end gap-1 pb-1">
                     {[30, 45, 60, 40, 80, 50, 70, 90, 60, 85].map((h, i) => (
                        <div key={i} className="w-1.5 bg-green-500/40 rounded-t-sm" style={{ height: `${h}%` }} />
                     ))}
                  </div>
               </div>
               <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Estimated new cases</div>
            </div>
          </div>

          <div className="panel">
            <div className="flex items-center justify-between mb-8">
               <div className="font-display font-bold text-lg text-white">Recent Passport Scans</div>
               <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  <span className="text-[9px] font-bold text-green-500 uppercase tracking-widest">Live</span>
               </div>
            </div>
            <div className="space-y-4">
              {myPassport.recentScans.slice(0, 4).map((s, i) => {
                const isVaccinated = s.status === "Vaccinated";
                const isPartial = s.status === "Partial";
                const accent = isVaccinated ? "#00FF88" : isPartial ? "#FF9F1C" : "#FF3B3B";
                return (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-9 w-9 rounded-full bg-white/5 border border-white/10 grid place-items-center text-[11px] font-bold text-white/80">
                      {s.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-white/90">{s.name}</div>
                      <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{s.doses} doses</div>
                    </div>
                    <span className="text-[8px] font-bold px-2 py-1 rounded-md uppercase tracking-widest border" style={{ color: accent, borderColor: `${accent}40`, background: `${accent}10` }}>
                      {s.status}
                    </span>
                  </div>
                );
              })}
            </div>
            <Link to="/passport" className="mt-8 pt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white border-t border-white/5 transition-all">
              View all scans <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
