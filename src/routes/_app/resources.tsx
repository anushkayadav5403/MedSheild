import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { hospitals } from "@/lib/mockData";
import { medicineDemand } from "@/lib/simulation";
import { VaccineOptimizer } from "@/components/VaccineOptimizer";
import { fetchNationalStats } from "@/lib/realDataService";
import {
  ResponsiveContainer,
  BarChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { toast } from "sonner";
import { Phone, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_app/resources")({
  component: Resources,
});

function Resources() {
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [stateFilter, setStateFilter] = useState("All India");
  const [activeCases, setActiveCases] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const states = ["All India", ...Array.from(new Set(hospitals.map((h) => h.state)))];

  useEffect(() => {
    const loadRealStats = async () => {
      const stats = await fetchNationalStats();
      setActiveCases(stats.active);
      setIsLoading(false);
    };
    loadRealStats();
  }, []);

  // Recalculate realistic hospital utilization based on live active cases
  const realisticHospitals = useMemo(() => {
    return hospitals.map(h => {
      // Simulate occupancy based on active cases (avg 15% hospitalisation rate)
      const stateLoadFactor = 0.15; 
      const estimatedPatients = Math.round((activeCases / 36) * stateLoadFactor); // 36 states/UTs
      
      const bedsUsed = Math.min(h.beds, Math.round(estimatedPatients * (h.beds / (h.beds + 100))));
      const icuUsed = Math.min(h.icuCapacity, Math.round(bedsUsed * 0.25)); // 25% of hospitalised need ICU
      
      return {
        ...h,
        bedsUsed,
        icuUsed,
        ventilatorsUsed: Math.min(h.ventilators, Math.round(icuUsed * 0.4)),
        status: (icuUsed / h.icuCapacity) > 0.85 ? "Overwhelmed" : (icuUsed / h.icuCapacity) > 0.6 ? "Critical" : "Operational"
      };
    });
  }, [activeCases]);

  const medDemand = useMemo(() => medicineDemand(activeCases), [activeCases]);

  const list = realisticHospitals.filter((h) => {
    if (stateFilter !== "All India" && h.state !== stateFilter) return false;
    if (criticalOnly && h.icuUsed / h.icuCapacity < 0.85) return false;
    return true;
  });

  const totals = realisticHospitals.reduce(
    (a, h) => ({
      icu: a.icu + (h.icuCapacity - h.icuUsed),
      icuTotal: a.icuTotal + h.icuCapacity,
      vent: a.vent + (h.ventilators - h.ventilatorsUsed),
      ventTotal: a.ventTotal + h.ventilators,
      ox: a.ox + h.oxygenLevel,
      med: a.med + h.medicineStock,
    }),
    { icu: 0, icuTotal: 0, vent: 0, ventTotal: 0, ox: 0, med: 0 },
  );

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F5F3EF]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-teal animate-spin mx-auto mb-4" />
          <div className="font-display font-bold text-xl text-[#031B1D]">Accessing India Health Database...</div>
          <div className="text-sm text-[#031B1D]/50 mt-2 font-mono uppercase tracking-widest">Live Resource Sync</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 max-w-[1600px] mx-auto space-y-5 text-[#031B1D] animate-fade-in">
      <div className="animate-slide-up stagger-1">
        <h1 className="font-display font-extrabold text-2xl md:text-3xl">Hospital Resource Intelligence</h1>
        <p className="text-sm opacity-60">Real-time capacity, supply and oxygen monitoring across facilities</p>
      </div>

      <div className="panel flex flex-wrap items-center gap-3 animate-slide-up stagger-2">
        <select value={stateFilter} onChange={(e) => setStateFilter(e.target.value)} className="input-base text-sm">
          {states.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="input-base text-sm">
          <option>All resources</option>
          <option>ICU</option>
          <option>Ventilators</option>
          <option>Oxygen</option>
          <option>Beds</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-mid ml-auto cursor-pointer">
          <input type="checkbox" checked={criticalOnly} onChange={(e) => setCriticalOnly(e.target.checked)} className="accent-red" />
          Critical only
        </label>
      </div>

      <div className="animate-slide-up stagger-3">
        <VaccineOptimizer initialDoses={2_400_000} />
      </div>

      <div className="panel animate-slide-up stagger-4">
        <div className="font-display font-bold text-lg mb-1">Resource Demand Analytics</div>
        <div className="text-[11px] text-mid mb-3">Medicine and equipment demand · stock runway days</div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div style={{ height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={medDemand} layout="vertical" margin={{ left: 80, right: 16 }}>
                <XAxis type="number" tick={{ fill: "#5c6476", fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#9ba3b5", fontSize: 10 }} width={78} />
                <Tooltip contentStyle={{ background: "#0d1829", border: "1px solid rgba(99,130,175,0.28)", borderRadius: 8 }} />
                <RechartsBar 
                  dataKey="dailyUnits" 
                  fill="#00c4cc" 
                  radius={[0, 4, 4, 0]} 
                  name="Daily units"
                  animationDuration={1500}
                  animationBegin={300}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2">
            {medDemand.map((m) => {
              const c = m.stockDays <= 4 ? "var(--red)" : m.stockDays <= 8 ? "var(--moderate)" : "var(--mild)";
              return (
                <div key={m.name} className="flex items-center justify-between p-2 rounded-md" style={{ border: "1px solid var(--border)" }}>
                  <div>
                    <div className="text-sm font-medium">{m.name}</div>
                    <div className="text-[10px] font-mono text-muted">{m.dailyUnits.toLocaleString("en-IN")} units/day · {m.trend}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-sm" style={{ color: c }}>{m.stockDays}d</div>
                    <div className="text-[9px] text-muted">stock left</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Summary label="ICU Beds Available" value={totals.icu} total={totals.icuTotal} c="var(--severe)" />
        <Summary label="Ventilators Free" value={totals.vent} total={totals.ventTotal} c="var(--moderate)" />
        <Summary label="Avg Oxygen Level" value={Math.round(totals.ox / hospitals.length)} total={100} c="var(--blue)" suffix="%" />
        <Summary label="Avg Medicine Stock" value={Math.round(totals.med / hospitals.length)} total={100} c="var(--mild)" suffix="%" />
      </div>

      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-muted border-b" style={{ borderColor: "var(--border)" }}>
              <th className="py-3 pr-2">Hospital</th>
              <th className="py-3 px-2">ICU</th>
              <th className="py-3 px-2">Vent.</th>
              <th className="py-3 px-2">Oxygen</th>
              <th className="py-3 px-2">Beds</th>
              <th className="py-3 px-2">Status</th>
              <th className="py-3 px-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((h) => {
              const icuPct = Math.round((h.icuUsed / h.icuCapacity) * 100);
              const ventPct = Math.round((h.ventilatorsUsed / h.ventilators) * 100);
              const bedsPct = Math.round((h.bedsUsed / h.beds) * 100);
              const sc =
                h.status === "Operational" ? "var(--mild)" :
                h.status === "Overwhelmed" ? "var(--moderate)" : "var(--red)";
              const sbg =
                h.status === "Operational" ? "var(--mild-bg)" :
                h.status === "Overwhelmed" ? "var(--moderate-bg)" : "var(--red-dim)";
              return (
                <tr key={h.id} className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: "var(--border)" }}>
                  <td className="py-3 pr-2">
                    <div className="font-medium">{h.name}</div>
                    <div className="text-[10px] font-mono text-muted">{h.city} · {h.type}</div>
                  </td>
                  <td className="px-2 w-32"><Bar pct={icuPct} /></td>
                  <td className="px-2 w-32"><Bar pct={ventPct} /></td>
                  <td className="px-2 w-32"><Bar pct={100 - h.oxygenLevel} label={`${h.oxygenLevel}%`} /></td>
                  <td className="px-2 w-32"><Bar pct={bedsPct} /></td>
                  <td className="px-2">
                    <span className="text-[9px] font-mono font-bold px-2 py-1 rounded-full border shadow-sm" style={{ color: sc, background: sbg, borderColor: `${sc}40` }}>
                      {h.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-2 text-right space-x-1">
                    <a href={`tel:${h.phone}`} className="inline-flex items-center gap-1 text-xs text-teal hover:underline">
                      <Phone className="h-3 w-3" />
                    </a>
                    <button
                      onClick={() => toast.success("Supply request submitted to district coordinator")}
                      className="text-[10px] btn-ghost py-1 px-2"
                    >
                      Request
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Summary({ label, value, total, c, suffix }: { label: string; value: number; total: number; c: string; suffix?: string }) {
  const pct = Math.min(100, Math.round((value / total) * 100));
  return (
    <div className="panel border-white/10 hover:scale-[1.02] transition-transform duration-300">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">{label}</div>
      <div className="font-mono font-extrabold text-3xl mt-2 drop-shadow-sm animate-fade-in" style={{ color: c }}>
        {value.toLocaleString("en-IN")}{suffix || ""}
      </div>
      <div className="text-[10px] text-white/30 mt-1 font-bold uppercase tracking-tight">of {total.toLocaleString("en-IN")}{suffix || ""}</div>
      <div className="h-1.5 rounded-full mt-4 overflow-hidden bg-black/40 border border-white/5 relative">
        <div 
          className="h-full transition-all duration-1000 ease-out animate-progress-fill" 
          style={{ width: `${pct}%`, background: c, boxShadow: `0 0 10px ${c}66` }} 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
      </div>
    </div>
  );
}

function Bar({ pct, label }: { pct: number; label?: string }) {
  // Heat map colors: Green (low utilization) -> Yellow -> Orange -> Red (high utilization/critical)
  const c = pct > 90 ? "var(--red)" : 
            pct > 70 ? "var(--severe)" : 
            pct > 40 ? "var(--moderate)" : 
            "var(--mild)";
            
  return (
    <div className="animate-fade-in">
      <div className="h-2.5 rounded-full overflow-hidden bg-black/60 border border-white/10 shadow-inner relative group/bar">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
        
        <div
          className="h-full rounded-full transition-all duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)] animate-progress-fill"
          style={{ 
            width: `${Math.max(2, pct)}%`, 
            background: c,
            boxShadow: `0 0 12px ${c === "var(--red)" ? "rgba(255,59,59,0.5)" : c === "var(--severe)" ? "rgba(255,107,0,0.5)" : "transparent"}`
          }}
        />
        
        {/* Critical pulse */}
        {pct > 90 && (
          <div className="absolute inset-0 bg-white/20 animate-pulse-fast rounded-full" />
        )}
      </div>
      <div className="font-mono text-[10px] text-white/40 mt-1.5 font-bold flex justify-between group-hover/bar:text-white/60 transition-colors">
        <span>{label || `${pct}%`}</span>
      </div>
    </div>
  );
}
