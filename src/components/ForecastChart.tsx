import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { useState, useEffect } from "react";
import { forecastOutbreak } from "@/lib/simulation";
import { fetchNationalStats } from "@/lib/realDataService";

export function ForecastChart({ height = 220 }: { height?: number }) {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const loadForecast = async () => {
      const stats = await fetchNationalStats();
      // Pass the current real active cases as the starting point for the 14-day simulation
      const forecast = forecastOutbreak(14, stats.active);
      setData(forecast);
    };
    loadForecast();
  }, []);

  return (
    <div className="animate-graph-reveal" style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="gForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            tick={{ fill: "#5c6476", fontSize: 9, fontFamily: "JetBrains Mono" }}
            axisLine={{ stroke: "rgba(99,130,175,0.15)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#5c6476", fontSize: 9, fontFamily: "JetBrains Mono" }}
            axisLine={false}
            tickLine={false}
            width={44}
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
          <Legend
            wrapperStyle={{ fontSize: 10, fontFamily: "JetBrains Mono", color: "#9ba3b5" }}
          />
          <Area
            type="monotone"
            dataKey="upper"
            stroke="none"
            fill="url(#gForecast)"
            name="Upper bound"
            isAnimationActive={true}
            animationDuration={1500}
          />
          <Area type="monotone" dataKey="lower" stroke="none" fill="var(--bg)" name="Lower bound" isAnimationActive={true} animationDuration={1500} />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#ef4444"
            strokeWidth={3}
            dot={false}
            name="Actual"
            isAnimationActive={true}
            animationDuration={1800}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#8b5cf6"
            strokeWidth={3}
            strokeDasharray="6 4"
            dot={false}
            name="AI Forecast"
            isAnimationActive={true}
            animationDuration={2000}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
