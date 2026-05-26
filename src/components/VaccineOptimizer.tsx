import { useState, useMemo } from 'react';
import { optimizeVaccineDistribution } from '@/lib/simulation';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Tooltip } from 'recharts';

interface VaccineOptimizerProps {
  initialDoses?: number;
}

export function VaccineOptimizer({ initialDoses = 2_400_000 }: VaccineOptimizerProps) {
  const [totalDoses, setTotalDoses] = useState(initialDoses);
  const allocation = useMemo(() => optimizeVaccineDistribution(totalDoses), [totalDoses]);
  
  const chartData = useMemo(() => [
    { 
      name: "P1", 
      doses: allocation.filter(v => v.priority === "P1").reduce((s, v) => s + v.recommendedDoses, 0) 
    },
    { 
      name: "P2", 
      doses: allocation.filter(v => v.priority === "P2").reduce((s, v) => s + v.recommendedDoses, 0) 
    },
    { 
      name: "P3", 
      doses: allocation.filter(v => v.priority === "P3").reduce((s, v) => s + v.recommendedDoses, 0) 
    },
  ], [allocation]);
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "P1": return "var(--red)";
      case "P2": return "var(--moderate)";
      case "P3": return "var(--mild)";
      default: return "var(--blue)";
    }
  };
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="panel lg:col-span-2">
        <div className="font-display font-bold text-lg mb-1">
          Vaccine Distribution Optimizer
        </div>
        <div className="text-[11px] text-mid mb-3">
          Priority allocation across {(totalDoses / 1_000_000).toFixed(1)}M dose weekly supply
        </div>
        <div className="mb-4">
          <label className="text-[10px] uppercase tracking-wider text-muted">
            Total Available Doses: {(totalDoses / 1_000_000).toFixed(1)}M
          </label>
          <input
            type="range"
            min={1_000_000}
            max={5_000_000}
            step={100_000}
            value={totalDoses}
            onChange={(e) => setTotalDoses(Number(e.target.value))}
            className="w-full mt-2 accent-teal"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-muted border-b" style={{ borderColor: "var(--border)" }}>
                <th className="text-left pb-2">City</th>
                <th className="text-left pb-2">State</th>
                <th className="text-center pb-2">Priority</th>
                <th className="text-right pb-2">Doses</th>
                <th className="text-right pb-2">Gap</th>
              </tr>
            </thead>
            <tbody>
              {allocation.slice(0, 10).map((v) => (
                <tr key={v.city} className="border-b" style={{ borderColor: "var(--border)" }}>
                  <td className="py-2 text-[12px] font-medium">{v.city}</td>
                  <td className="py-2 text-[11px] text-muted">{v.state}</td>
                  <td className="py-2 text-center">
                    <span 
                      className="text-[9px] font-mono font-bold px-2 py-1 rounded"
                      style={{ 
                        color: getPriorityColor(v.priority),
                        background: `${getPriorityColor(v.priority)}1f`
                      }}
                    >
                      {v.priority}
                    </span>
                  </td>
                  <td className="py-2 text-right font-mono text-[12px]">
                    {(v.recommendedDoses / 1000).toFixed(0)}K
                  </td>
                  <td className="py-2 text-right font-mono text-[11px] text-muted">
                    {v.coverageGap.toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="panel">
        <div className="font-display font-bold text-lg mb-3">
          Allocation by Priority
        </div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis 
                dataKey="name" 
                tick={{ fill: "#5c6476", fontSize: 10, fontFamily: "JetBrains Mono" }} 
              />
              <YAxis 
                tick={{ fill: "#5c6476", fontSize: 10, fontFamily: "JetBrains Mono" }} 
                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip 
                contentStyle={{ 
                  background: "rgba(13,24,41,0.95)", 
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "11px"
                }}
                formatter={(value: number) => [`${(value / 1000).toFixed(0)}K doses`, "Allocation"]}
              />
              <Bar dataKey="doses" radius={[4, 4, 0, 0]}>
                <Cell fill="#ef4444" />
                <Cell fill="#f59e0b" />
                <Cell fill="#10b981" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 space-y-1 text-[10px]">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ background: "#ef4444" }} />
            <span className="text-muted">P1 - Critical outbreak zones</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ background: "#f59e0b" }} />
            <span className="text-muted">P2 - High transmission areas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full" style={{ background: "#10b981" }} />
            <span className="text-muted">P3 - Moderate risk regions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
