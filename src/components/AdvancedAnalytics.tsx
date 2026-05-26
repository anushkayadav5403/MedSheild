import { useState, useMemo, useEffect } from "react";
import { simulateMobility, optimizeVaccineDistribution, type MobilityFlow, type VaccineAllocation } from "@/lib/simulation";
import { MoveRight, Syringe, TrendingUp, AlertCircle, Info } from "lucide-react";
import { fmtNum } from "@/lib/roleStore";
import { fetchNationalStats } from "@/lib/realDataService";

export function AdvancedAnalytics() {
  const [activeCases, setActiveCases] = useState(0);

  useEffect(() => {
    fetchNationalStats().then(s => setActiveCases(s.active));
  }, []);

  const mobilityFlows = useMemo(() => {
    const flows = simulateMobility(0);
    if (activeCases === 0) return flows;
    const scale = activeCases / 284000;
    return flows.map(f => ({
      ...f,
      volume: Math.round(f.volume * scale),
      riskContribution: Math.round(f.riskContribution * (0.8 + Math.random() * 0.4))
    }));
  }, [activeCases]);

  const vaccinePlan = useMemo(() => optimizeVaccineDistribution(500000), []);

  return (
    <div className="space-y-6">
      {/* Population Mobility Simulation */}
      <div className="panel border-purple-500/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              Population Mobility Simulation
            </h3>
            <p className="text-[11px] text-muted uppercase tracking-wider">Inter-district flow & risk transmission analysis</p>
          </div>
          <span className="text-[10px] font-mono bg-purple-500/10 text-purple-400 px-2 py-1 rounded">GRAVITY MODEL v2.0</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mobilityFlows.slice(0, 6).map((flow, i) => (
            <div key={i} className={`p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 transition-all group animate-slide-up stagger-${(i % 3) + 1}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[12px] font-bold text-mid">{flow.from}</span>
                <MoveRight className="h-3.5 w-3.5 text-muted group-hover:text-purple-400 transition-colors" />
                <span className="text-[12px] font-bold text-mid">{flow.to}</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-[9px] text-muted uppercase">Daily Volume</div>
                  <div className="text-lg font-mono font-bold text-white">{fmtNum(flow.volume)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-muted uppercase">Risk Factor</div>
                  <div className="text-sm font-mono font-bold text-red-400">+{flow.riskContribution}%</div>
                </div>
              </div>
              <div className="mt-2 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 animate-progress-fill" 
                  style={{ width: `${Math.min(100, flow.volume / 200)}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vaccine Distribution Optimizer */}
      <div className="panel border-teal-500/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-bold text-lg flex items-center gap-2">
              <Syringe className="h-5 w-5 text-teal-400" />
              AI Vaccine Distribution Optimizer
            </h3>
            <p className="text-[11px] text-muted uppercase tracking-wider">Risk-weighted dose allocation strategy</p>
          </div>
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted cursor-help" title="Optimization targets areas with high collapse risk and low coverage" />
            <span className="text-[10px] font-mono bg-teal-500/10 text-teal-400 px-2 py-1 rounded">HEURISTIC OPTIMIZER</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] text-muted uppercase tracking-widest">
                <th className="pb-3 pl-2">Priority</th>
                <th className="pb-3">Target District</th>
                <th className="pb-3">Recommended Doses</th>
                <th className="pb-3">Coverage Gap</th>
                <th className="pb-3 pr-2">Strategy</th>
              </tr>
            </thead>
            <tbody className="text-[13px]">
              {vaccinePlan.slice(0, 8).map((v, i) => (
                <tr key={i} className={`border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors group animate-fade-in stagger-${(i % 4) + 1}`}>
                  <td className="py-3 pl-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      v.priority === 'P1' ? 'bg-red-500/20 text-red-400' : 
                      v.priority === 'P2' ? 'bg-amber-500/20 text-amber-400' : 
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {v.priority}
                    </span>
                  </td>
                  <td className="py-3 font-medium">{v.city}, {v.state}</td>
                  <td className="py-3 font-mono font-bold text-teal-400">{fmtNum(v.recommendedDoses)}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono">{v.coverageGap}%</span>
                      <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden relative">
                        <div className="h-full bg-red-400 animate-progress-fill" style={{ width: `${v.coverageGap}%` }} />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-2">
                    <div className="flex items-center gap-1.5 text-[11px] text-mid">
                      <AlertCircle className={`h-3 w-3 ${v.priority === 'P1' ? 'text-red-400' : 'text-muted'}`} />
                      {v.priority === 'P1' ? 'Aggressive Containment' : 'Stabilization'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
