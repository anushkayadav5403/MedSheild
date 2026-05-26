import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { topSymptoms } from "@/lib/mockData";
import { OutbreakClusterDetection } from "@/components/OutbreakClusterDetection";
import { toast } from "sonner";
import { usePassportStore } from "@/lib/passportStore";
import { fetchNationalStats } from "@/lib/realDataService";

export const Route = createFileRoute("/_app/symptoms")({
  component: SymptomsPage,
});

const SYMPTOMS = ["Fever", "Cough", "Breathlessness", "Fatigue", "Loss of smell", "Headache", "Body aches", "Sore throat"];
const EMOJI: Record<string, string> = {
  Fever: "🌡️", Cough: "😷", Breathlessness: "😮‍💨", Fatigue: "😴",
  "Loss of smell": "👃", Headache: "🤕", "Body aches": "💪", "Sore throat": "🗣️",
};

function SymptomsPage() {
  const { passportData } = usePassportStore();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [severity, setSeverity] = useState<"Mild" | "Moderate" | "Severe">("Mild");
  const [temp, setTemp] = useState("36.8");
  const [submitted, setSubmitted] = useState(false);
  const [activeCases, setActiveCases] = useState(0);

  useEffect(() => {
    fetchNationalStats().then(s => setActiveCases(s.active));
  }, []);

  const realisticTopSymptoms = useMemo(() => {
    const scale = activeCases / 284000;
    return topSymptoms.map(s => ({
      ...s,
      count: Math.round(s.count * scale)
    }));
  }, [activeCases]);

  function toggle(s: string) {
    setSelected((p) => { const n = new Set(p); n.has(s) ? n.delete(s) : n.add(s); return n; });
  }

  function submit() {
    setSubmitted(true);
    toast.success("Report added to national MedShield database");
  }

  return (
    <div className="p-5 md:p-6 max-w-[1400px] mx-auto space-y-5 text-[#031B1D]">
      <div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl">Citizen Symptom Reporting</h1>
        <p className="text-sm opacity-60">Crowdsourced outbreak detection · Anonymous · Aggregated nationally</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="panel">
          <div className="font-display font-bold text-lg mb-1">Report Your Symptoms Today</div>
          <div className="text-xs text-mid mb-4">Submit a daily check-in even if you feel fine</div>

          {submitted ? (
            <div
              className="rounded-md p-4 text-center"
              style={{ background: "var(--mild-bg)", border: "1px solid var(--mild)" }}
            >
              <div className="text-2xl mb-1">✓</div>
              <div className="font-display font-bold text-mild">Report Submitted</div>
              <div className="text-xs text-mid mt-1">Thank you for helping detect outbreaks early.</div>
              <button onClick={() => { setSubmitted(false); setSelected(new Set()); }} className="btn-ghost text-xs mt-3">
                Submit another
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted">Location</label>
                  <input defaultValue={passportData.state ? `India, ${passportData.state}` : "Bengaluru, KA"} className="input-base w-full mt-1 text-sm" />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-wider text-muted">Temperature °C</label>
                  <input value={temp} onChange={(e) => setTemp(e.target.value)} className="input-base w-full mt-1 text-sm font-mono" />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted">Symptoms (tap all that apply)</label>
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                  {SYMPTOMS.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggle(s)}
                      className="text-sm px-3 py-2.5 rounded-md text-left flex items-center gap-2 transition-colors"
                      style={
                        selected.has(s)
                          ? { background: "var(--teal-dim)", color: "var(--teal)", border: "1px solid var(--teal)" }
                          : { background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid var(--border-bright)" }
                      }
                    >
                      <span>{EMOJI[s]}</span>{s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase tracking-wider text-muted">Severity</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(["Mild", "Moderate", "Severe"] as const).map((s) => {
                    const c = s === "Mild" ? "var(--mild)" : s === "Moderate" ? "var(--moderate)" : "var(--red)";
                    const bg = s === "Mild" ? "var(--mild-bg)" : s === "Moderate" ? "var(--moderate-bg)" : "var(--red-dim)";
                    return (
                      <button
                        key={s}
                        onClick={() => setSeverity(s)}
                        className="text-sm py-3 rounded-md font-bold transition-all"
                        style={
                          severity === s
                            ? { background: bg, color: c, border: `1px solid ${c}` }
                            : { background: "rgba(255,255,255,0.05)", color: "white", border: "1px solid var(--border-bright)" }
                        }
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button onClick={submit} className="btn-primary w-full text-sm">
                Submit Report — contributes to national outbreak detection
              </button>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="font-display font-bold text-lg mb-1">Top Reported Symptoms — 7d</div>
          <div className="text-xs text-mid mb-3">National aggregate · sorted by report volume</div>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={realisticTopSymptoms} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" tick={{ fill: "#5c6476", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#9ba3b5", fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                <Tooltip
                  contentStyle={{ background: "#0d1829", border: "1px solid rgba(99,130,175,0.28)", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 12 }}
                  itemStyle={{ color: "#eef0f3" }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {realisticTopSymptoms.map((s, i) => (
                    <Cell key={i} fill={s.severeShare > 0.2 ? "var(--red)" : s.severeShare > 0.1 ? "var(--moderate)" : "var(--mild)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <OutbreakClusterDetection />
    </div>
  );
}
