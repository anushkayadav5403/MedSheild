import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Brain,
  Building2,
  Truck,
  Users,
  SlidersHorizontal,
  TrendingDown,
} from "lucide-react";
import { ForecastChart } from "@/components/ForecastChart";
import { SEIRChart } from "@/components/SEIRChart";
import { AdvancedAnalytics } from "@/components/AdvancedAnalytics";
import { fmtNum } from "@/lib/roleStore";
import {
  forecastOutbreak,
  predictHealthcareCollapse,
  simulateMobility,
  optimizeVaccineDistribution,
  defaultInterventions,
  analyzeInterventions,
  type Intervention,
} from "@/lib/simulation";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";

export const Route = createFileRoute("/_app/intelligence")({
  component: IntelligencePage,
});

const TABS = [
  { id: "forecast", label: "AI Forecasting", icon: Brain },
  { id: "collapse", label: "Collapse Risk", icon: Building2 },
  { id: "advanced", label: "Advanced Suite", icon: Users },
  { id: "interventions", label: "Interventions", icon: SlidersHorizontal },
] as const;

type TabId = (typeof TABS)[number]["id"];

function IntelligencePage() {
  const [tab, setTab] = useState<TabId>("forecast");
  const [lockdown, setLockdown] = useState(35);
  const [baseR0, setBaseR0] = useState(5);
  const [interventions, setInterventions] = useState<Intervention[]>(defaultInterventions);

  const collapseRisks = useMemo(() => predictHealthcareCollapse(), []);
  const mobilityFlows = useMemo(() => simulateMobility(lockdown), [lockdown]);
  const vaccineAlloc = useMemo(() => optimizeVaccineDistribution(2_400_000), []);
  const impact = useMemo(
    () => analyzeInterventions(baseR0, interventions),
    [baseR0, interventions],
  );
  const forecastTotal = useMemo(() => {
    const f = forecastOutbreak(14);
    return f.slice(-7).reduce((s, d) => s + d.forecast, 0);
  }, []);

  const toggleIntervention = (id: string) => {
    setInterventions((prev) =>
      prev.map((i) => (i.id === id ? { ...i, enabled: !i.enabled } : i)),
    );
  };

  return (
    <div className="p-5 md:p-6 max-w-[1600px] mx-auto space-y-5 text-foreground">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-60">
          Advanced Analytics · ML-Enhanced
        </div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl mt-1 text-foreground">
          Crisis Intelligence Hub
        </h1>
        <p className="text-sm text-foreground/60">
          AI outbreak forecasting, healthcare collapse prediction, vaccine logistics, mobility
          simulation, and real-time intervention impact analysis
        </p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-[12px] font-medium transition-all"
              style={
                active
                  ? { background: "var(--teal-dim)", color: "var(--teal)", border: "1px solid var(--teal)" }
                  : { color: "var(--mid)", border: "1px solid var(--border)" }
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "forecast" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="panel lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-display font-bold text-lg">AI Outbreak Forecast</div>
                <div className="text-[11px] text-mid">
                  SEIR-calibrated projection with 95% confidence bands · 14-day horizon
                </div>
              </div>
              <span
                className="text-[10px] font-mono px-2 py-1 rounded-full"
                style={{ background: "var(--blue-dim)", color: "var(--blue)" }}
              >
                MODEL v2.4
              </span>
            </div>
            <ForecastChart height={280} />
          </div>
          <div className="space-y-4">
            <div className="panel">
              <div className="text-[10px] uppercase tracking-wider text-muted">7-Day Forecast Total</div>
              <div className="font-mono font-extrabold text-3xl text-purple mt-1">
                +{fmtNum(forecastTotal)}
              </div>
              <div className="text-[10px] text-mid mt-1">projected new cases (national)</div>
            </div>
            <div className="panel">
              <div className="text-[10px] uppercase tracking-wider text-muted mb-2">SEIR Epidemic Curve</div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-[10px] text-muted">R₀</span>
                <input
                  type="range"
                  min={2}
                  max={8}
                  value={baseR0}
                  onChange={(e) => setBaseR0(Number(e.target.value))}
                  className="flex-1 mx-2 accent-teal"
                />
                <span className="font-mono text-xs text-teal">{baseR0}.0</span>
              </div>
              <SEIRChart r0={baseR0} days={45} height={160} />
            </div>
          </div>
        </div>
      )}

      {tab === "collapse" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(["Critical", "High", "Moderate", "Low"] as const).map((level) => {
              const count = collapseRisks.filter((r) => r.riskLevel === level).length;
              const c =
                level === "Critical"
                  ? "var(--severe)"
                  : level === "High"
                    ? "var(--moderate)"
                    : level === "Moderate"
                      ? "var(--blue)"
                      : "var(--mild)";
              return (
                <div key={level} className="panel">
                  <div className="text-[10px] uppercase tracking-wider text-muted">{level} Risk</div>
                  <div className="font-mono font-extrabold text-3xl mt-1" style={{ color: c }}>
                    {count}
                  </div>
                  <div className="text-[10px] text-mid">districts</div>
                </div>
              );
            })}
          </div>
          <div className="panel overflow-x-auto">
            <div className="font-display font-bold text-lg mb-3">Healthcare Collapse Prediction</div>
            <table className="w-full text-sm">
              <thead>
                <tr
                  className="text-left text-[10px] uppercase tracking-wider text-muted border-b"
                  style={{ borderColor: "var(--border)" }}
                >
                  <th className="py-2 pr-2">City</th>
                  <th className="py-2 px-2">Risk Score</th>
                  <th className="py-2 px-2">ICU Load</th>
                  <th className="py-2 px-2">Days to Collapse</th>
                  <th className="py-2 px-2">Risk Factors</th>
                </tr>
              </thead>
              <tbody>
                {collapseRisks.map((r) => {
                  const c =
                    r.riskLevel === "Critical"
                      ? "var(--severe)"
                      : r.riskLevel === "High"
                        ? "var(--moderate)"
                        : r.riskLevel === "Moderate"
                          ? "var(--blue)"
                          : "var(--mild)";
                  return (
                    <tr
                      key={r.city}
                      className="border-b hover:bg-white/[0.02]"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <td className="py-2.5 pr-2">
                        <div className="font-medium">{r.city}</div>
                        <div className="text-[10px] font-mono text-muted">{r.state}</div>
                      </td>
                      <td className="px-2">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2 flex-1 max-w-[80px] rounded-full overflow-hidden"
                            style={{ background: "rgba(255,255,255,0.06)" }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${r.riskScore}%`, background: c }}
                            />
                          </div>
                          <span className="font-mono font-bold text-xs" style={{ color: c }}>
                            {r.riskScore}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 font-mono text-xs">{r.icuLoadPct}%</td>
                      <td className="px-2 font-mono text-xs" style={{ color: r.daysToCollapse ? "var(--red)" : "var(--mild)" }}>
                        {r.daysToCollapse ? `${r.daysToCollapse}d` : "—"}
                      </td>
                      <td className="px-2 text-[11px] text-mid">{r.factors.join(" · ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "advanced" && <AdvancedAnalytics />}

      {tab === "interventions" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="panel space-y-3">
            <div className="font-display font-bold text-lg">Intervention Controls</div>
            <div className="text-[11px] text-mid mb-2">Toggle policies to see real-time projected impact</div>
            {interventions.map((i) => (
              <label
                key={i.id}
                className="flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors hover:bg-white/[0.03]"
                style={{ border: "1px solid var(--border)" }}
              >
                <div>
                  <div className="text-sm font-medium">{i.label}</div>
                  <div className="text-[10px] font-mono text-muted">
                    Impact: {(i.impact * 100).toFixed(0)}% transmission
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={i.enabled}
                  onChange={() => toggleIntervention(i.id)}
                  className="accent-teal h-4 w-4"
                />
              </label>
            ))}
            <div className="flex items-baseline justify-between pt-2">
              <span className="text-[10px] uppercase text-muted">Base R₀</span>
              <input
                type="range"
                min={2}
                max={9}
                value={baseR0}
                onChange={(e) => setBaseR0(Number(e.target.value))}
                className="flex-1 mx-2 accent-teal"
              />
              <span className="font-mono text-teal">{baseR0}.0</span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="panel">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-5 w-5 text-mild" />
                <div className="font-display font-bold text-lg">Impact Analysis — 30 Days</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <ImpactStat label="Effective R₀" value={String(impact.effectiveR0)} accent="var(--teal)" />
                <ImpactStat label="Case Reduction" value={`${impact.reductionPct}%`} accent="var(--mild)" />
                <ImpactStat label="Baseline Infections" value={fmtNum(impact.baselineCases)} accent="var(--severe)" />
                <ImpactStat label="With Interventions" value={fmtNum(impact.projectedCases)} accent="var(--blue)" />
              </div>
              <div className="mt-4 pt-3 border-t text-[11px] text-mid" style={{ borderColor: "var(--border)" }}>
                Hospitalization delta:{" "}
                <span className="font-mono font-bold" style={{ color: impact.hospitalizationDelta < 0 ? "var(--mild)" : "var(--red)" }}>
                  {impact.hospitalizationDelta > 0 ? "+" : ""}
                  {impact.hospitalizationDelta}K beds
                </span>{" "}
                vs baseline at day 30
              </div>
            </div>
            <div className="panel">
              <div className="text-[10px] uppercase tracking-wider text-muted mb-2">Projected Curve Comparison</div>
              <SEIRChart r0={impact.effectiveR0} days={30} height={180} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ImpactStat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="font-mono font-extrabold text-2xl mt-1" style={{ color: accent }}>
        {value}
      </div>
    </div>
  );
}
