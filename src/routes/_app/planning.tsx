import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { emergencyScenarios } from "@/lib/simulation";
import { hospitals } from "@/lib/mockData";
import { toast } from "sonner";
import { ActionTracker } from "@/components/ActionTracker";
import {
  ClipboardList,
  Plus,
  AlertTriangle,
  Truck,
  Phone,
} from "lucide-react";

export const Route = createFileRoute("/_app/planning")({
  component: Planning,
});

function Planning() {
  const [district, setDistrict] = useState("Mumbai, MH");
  const stats = useMemo(() => computeLogistics(district), [district]);

  return (
    <div className="p-5 md:p-6 max-w-[1400px] mx-auto space-y-6 text-foreground animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl leading-none">Logistics Intelligence</h1>
          <p className="text-sm text-foreground/60 mt-2">Predictive resource allocation and supply chain monitoring.</p>
        </div>
        <div className="h-12 w-12 rounded-full bg-teal/10 grid place-items-center">
          <Truck className="h-6 w-6 text-teal" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-6">
          <div className="panel bg-white/5 border-white/5">
            <div className="flex items-center justify-between mb-6">
              <div className="font-display font-bold text-lg flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-teal" />
                Resource Demand Forecast
              </div>
              <select 
                value={district} 
                onChange={(e) => setDistrict(e.target.value)}
                className="input-base text-xs bg-white/5 border-white/5"
              >
                {DISTRICTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Metric label="ICU Beds" value={stats.icu} trend={stats.icuTrend} unit="beds" c="var(--teal)" />
              <Metric label="Oxygen" value={stats.oxygen} trend={stats.oxygenTrend} unit="k/litres" c="var(--blue)" />
              <Metric label="Ventilators" value={stats.vent} trend={stats.ventTrend} unit="units" c="var(--moderate)" />
              <Metric label="Medicine" value={stats.med} trend={stats.medTrend} unit="vials" c="var(--mild)" />
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
              <div className="font-display font-bold text-base mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-teal" />
                Supply-Demand Trajectory (7 Days)
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer>
                  <AreaChart data={stats.chart}>
                    <defs>
                      <linearGradient id="colorD" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--teal)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--teal)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorS" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--mild)" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="var(--mild)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: "#9ba3b5", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} />
                    <YAxis tick={{ fill: "#5c6476", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ background: "#0d1829", border: "1px solid rgba(99,130,175,0.28)", borderRadius: 8 }}
                    />
                    <Area type="monotone" dataKey="demand" stroke="var(--teal)" strokeWidth={3} fill="url(#colorD)" name="Projected Demand" />
                    <Area type="monotone" dataKey="supply" stroke="var(--mild)" strokeWidth={3} fill="url(#colorS)" name="Available Supply" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="panel bg-white/5 border-white/5">
            <div className="font-display font-bold text-lg mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-teal" />
              Active Supply Chain Nodes
            </div>
            <div className="space-y-2">
              {stats.nodes.map((n, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={`h-1.5 w-1.5 rounded-full ${n.status === 'Critical' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                    <div>
                      <div className="text-sm font-bold">{n.name}</div>
                      <div className="text-[10px] text-muted uppercase tracking-wider">{n.type}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono text-white">{n.load}% load</div>
                    <div className="text-[9px] text-muted">Capacity</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel bg-white/5 border-white/5 h-fit">
          <div className="font-display font-bold text-lg mb-4 text-[var(--text)]">AI Optimization</div>
          <div className="space-y-5">
            {[
              { t: "Route Efficiency", d: "Current supply routes are 94% efficient. Rerouting via Node-B to avoid containment zones.", c: "var(--teal)" },
              { t: "Stock Alert", d: "Oxygen reserves in North Sector falling below 48h safety threshold. Auto-dispatch initiated.", c: "var(--severe)" },
              { t: "Waste Reduction", d: "Predictive expiry monitoring saved 14,000 vials of critical medication this month.", c: "var(--mild)" },
            ].map(item => (
              <div key={item.t} className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ background: item.c }} />
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--text)]/80">{item.t}</div>
                </div>
                <div className="text-xs text-[var(--mid)] leading-relaxed pl-3.5">{item.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, trend, unit, c }: { label: string; value: string; trend: string; unit: string; c: string }) {
  const isUp = trend.startsWith("+");
  return (
    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
      <div className="text-[9px] uppercase tracking-widest text-muted font-bold mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-display font-bold text-white">{value}</span>
        <span className="text-[10px] text-muted">{unit}</span>
      </div>
      <div className={`text-[10px] font-bold mt-2 flex items-center gap-1 ${isUp ? 'text-red-500' : 'text-green-500'}`}>
        {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        {trend} vs 24h
      </div>
    </div>
  );
}
