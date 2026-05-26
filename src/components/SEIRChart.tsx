import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { useState, useEffect } from "react";
import { fetchNationalStats } from "@/lib/realDataService";

export function SEIRChart({ height = 220 }: { height?: number }) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const loadSEIR = async () => {
      const stats = await fetchNationalStats();
      const population = 1428000000; // Real India Population 2024
      const active = stats.active;
      const recovered = stats.recovered;
      
      // Simple SEIR simulation based on real starting values
      const beta = 0.35; // Infection rate
      const gamma = 0.1; // Recovery rate
      
      let S = population - active - recovered;
      let E = active * 2; // Exposed (estimated)
      let I = active;
      let R = recovered;
      
      const simulation = Array.from({ length: 60 }, (_, i) => {
        const dS = -beta * S * I / population;
        const dE = beta * S * I / population - 0.2 * E;
        const dI = 0.2 * E - gamma * I;
        const dR = gamma * I;
        
        S += dS;
        E += dE;
        I += dI;
        R += dR;
        
        return {
          day: `D${i}`,
          infected: Math.round(I),
          hospitalized: Math.round(I * 0.15),
          recovered: Math.round(R)
        };
      });
      setData(simulation);
    };
    loadSEIR();
  }, []);

  return (
    <div className="animate-graph-reveal" style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <XAxis
            dataKey="day"
            tick={{ fill: "#5c6476", fontSize: 9, fontFamily: "JetBrains Mono" }}
            axisLine={{ stroke: "rgba(99,130,175,0.15)" }}
            tickLine={false}
            interval={9}
          />
          <YAxis
            tick={{ fill: "#5c6476", fontSize: 9, fontFamily: "JetBrains Mono" }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v) => `${(v / 1e6).toFixed(1)}M`}
          />
          <Tooltip
            contentStyle={{
              background: "#0d1829",
              border: "1px solid rgba(99,130,175,0.28)",
              borderRadius: 8,
              fontFamily: "JetBrains Mono",
              fontSize: 11,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
          <Line type="monotone" dataKey="infected" stroke="#ef4444" strokeWidth={2} dot={false} name="Infected" isAnimationActive={true} animationDuration={1500} />
          <Line type="monotone" dataKey="hospitalized" stroke="#f59e0b" strokeWidth={2} dot={false} name="Hospitalized" isAnimationActive={true} animationDuration={1800} />
          <Line type="monotone" dataKey="recovered" stroke="#10b981" strokeWidth={2} dot={false} name="Recovered" isAnimationActive={true} animationDuration={2000} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
