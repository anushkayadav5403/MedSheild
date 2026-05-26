import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { OutbreakMap } from "@/components/OutbreakMap";
import { SEIRChart } from "@/components/SEIRChart";
import { InterventionPanel } from "@/components/InterventionPanel";
import { nationalStats } from "@/lib/mockData";
import { fmtNum } from "@/lib/roleStore";
import {
  simulateCitySpread,
  defaultInterventions,
  analyzeInterventions,
  type Intervention,
} from "@/lib/simulation";
import { DISEASE_DB, DISEASE_NAMES, getDiseaseModel } from "@/lib/diseaseDB";
import { Play, Pause, SlidersHorizontal, RotateCcw, Info } from "lucide-react";

export const Route = createFileRoute("/_app/map")({
  component: MapPage,
});

function MapPage() {
  const [disease, setDisease] = useState("COVID-19");
  const [simDay, setSimDay] = useState(0);
  const [running, setRunning] = useState(false);
  const [interventions, setInterventions] = useState<Intervention[]>(defaultInterventions);
  const [showInterventions, setShowInterventions] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const model = useMemo(() => getDiseaseModel(disease), [disease]);

  // Use disease's real R0 as the base spread rate
  const spread = model.r0;

  const impact = useMemo(
    () => analyzeInterventions(spread, interventions, 14),
    [spread, interventions],
  );

  // Use disease-specific city data
  const simCities = useMemo(() => {
    return simulateCitySpread(
      model.indiaOutbreakCities as any,
      impact.effectiveR0,
      simDay
    ).map((c: any) => ({
      name: c.name,
      state: c.state,
      lat: c.lat,
      lng: c.lng,
      activeCases: c.simCases,
      hospitalized: c.simHospitalized,
      vaccinationCoverage: c.vaccinationCoverage,
      status: c.status,
      nearestHospital: c.nearestHospital,
    }));
  }, [simDay, impact.effectiveR0, model]);

  const simActiveCases = useMemo(
    () => simCities.reduce((s, c) => s + c.activeCases, 0),
    [simCities]
  );

  // Use requestAnimationFrame-based timer to avoid lag
  const runSimulation = useCallback(() => {
    setSimDay(0);
    setRunning(true);
  }, []);

  const resetSimulation = useCallback(() => {
    setRunning(false);
    setSimDay(0);
  }, []);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSimDay((d) => {
        if (d >= 30) {
          setRunning(false);
          return 30;
        }
        return d + 1;
      });
    }, 800); // 800ms — less laggy than 600ms
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  // Reset sim when disease changes
  useEffect(() => {
    setRunning(false);
    setSimDay(0);
  }, [disease]);

  const toggleIntervention = useCallback((id: string) => {
    setInterventions((prev) =>
      prev.map((i) => (i.id === id ? { ...i, enabled: !i.enabled } : i)),
    );
  }, []);

  const diseaseColor = model.color;

  return (
    <div className="relative h-[calc(100vh-52px)] w-full overflow-hidden">
      {/* Full-screen map */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
        <OutbreakMap
          height={600}
          full
          spreadRate={impact.effectiveR0}
          cities={simCities}
          simDay={simDay}
        />
      </div>

      {/* Left control panel */}
      <div
        className="absolute top-4 left-4 z-[500] w-[290px] rounded-xl overflow-hidden max-h-[calc(100vh-120px)] overflow-y-auto"
        style={{
          background: "rgba(3, 27, 29, 0.85)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          border: "1px solid rgba(255,255,255,0.1)",
          color: "white"
        }}
      >
        {/* Header — color matches disease */}
        <div style={{ background: `${diseaseColor}cc`, padding: "12px 16px" }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: "white", fontFamily: "var(--font-display)" }}>
            Pandemic Spread Simulation
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 2, fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}>
            SEIR · {model.pathogen.split("(")[0].trim().toUpperCase()}
          </div>
        </div>

        <div style={{ padding: "14px 16px" }} className="space-y-4">
          {/* Disease Model */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-sans)" }}>
              Disease Model
            </label>
            <select
              value={disease}
              onChange={(e) => setDisease(e.target.value)}
              className="input-base w-full mt-2 text-sm bg-black/40 border-white/10 text-white"
              style={{
                border: `1px solid ${diseaseColor}40`,
              }}
            >
              {DISEASE_NAMES.map(d => (
                <option key={d} value={d} style={{ background: "#031B1D", color: "white" }}>{d}</option>
              ))}
            </select>
          </div>

          {/* Disease info card */}
          <div style={{
            background: `${diseaseColor}10`,
            border: `1px solid ${diseaseColor}30`,
            borderRadius: 8, padding: "10px 12px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: diseaseColor, fontFamily: "var(--font-sans)" }}>
                  {model.pathogen}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 2, fontFamily: "var(--font-sans)" }}>
                  {model.transmission}
                </div>
              </div>
              <button onClick={() => setShowInfo(s => !s)} style={{ background: "none", border: "none", cursor: "pointer", color: diseaseColor }}>
                <Info className="h-4 w-4" />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 8 }}>
              {[
                { label: "R₀", value: model.r0Range.split("–")[0] + "–" + (model.r0Range.split("–")[1]?.split(" ")[0] || model.r0.toString()) },
                { label: "CFR", value: `${model.cfr}%` },
                { label: "Incubation", value: `${model.incubationDays}d` },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: "5px 8px", textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 600, fontFamily: "var(--font-sans)" }}>{s.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: diseaseColor, fontFamily: "var(--font-mono)" }}>{s.value}</div>
                </div>
              ))}
            </div>

            {showInfo && (
              <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.7)", fontFamily: "var(--font-sans)", lineHeight: 1.5 }}>
                <div style={{ fontWeight: 600, color: "white", marginBottom: 4 }}>Key Symptoms:</div>
                {model.symptoms.slice(0, 4).map(s => (
                  <div key={s}>• {s}</div>
                ))}
                <div style={{ marginTop: 6, fontWeight: 600, color: "white" }}>High Risk States:</div>
                <div>{model.highRiskStates.join(", ")}</div>
              </div>
            )}
          </div>

          {/* Effective R₀ display */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 12px", background: "rgba(0,0,0,0.3)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)"
          }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "var(--font-sans)" }}>Effective R₀ (with interventions)</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: impact.effectiveR0 > 1 ? "#ef4444" : "#00FF88", fontFamily: "var(--font-mono)" }}>
              {impact.effectiveR0}
            </span>
          </div>

          {/* Simulation Day */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-sans)" }}>
                Simulation Day
              </label>
              <span style={{ fontSize: 13, fontWeight: 700, color: running ? "#ef4444" : diseaseColor, fontFamily: "var(--font-mono)" }}>
                {running ? "▶ " : ""}D+{simDay}
              </span>
            </div>
            <input
              type="range" min={0} max={30} value={simDay}
              onChange={(e) => { setRunning(false); setSimDay(Number(e.target.value)); }}
              style={{ width: "100%", marginTop: 8, accentColor: diseaseColor }}
            />
            <div style={{ height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 2, marginTop: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 2,
                background: running ? "#ef4444" : diseaseColor,
                width: `${(simDay / 30) * 100}%`,
                transition: "width 0.4s ease",
              }} />
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => (running ? setRunning(false) : runSimulation())}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer",
                background: running ? "#ef4444" : diseaseColor, color: "white",
                fontWeight: 700, fontSize: 13, fontFamily: "system-ui",
                boxShadow: `0 2px 8px ${running ? "rgba(239,68,68,0.4)" : diseaseColor + "60"}`,
              }}
            >
              {running ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Run Simulation</>}
            </button>
            <button
              onClick={resetSimulation}
              style={{
                padding: "10px 12px", borderRadius: 8, border: "1px solid #e8eaed",
                background: "white", cursor: "pointer", color: "#5f6368",
              }}
              title="Reset"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Interventions */}
          <button
            onClick={() => setShowInterventions((s) => !s)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "8px 0", borderRadius: 8, border: "1px solid #e8eaed",
              background: showInterventions ? `${diseaseColor}15` : "white",
              color: showInterventions ? diseaseColor : "#5f6368",
              fontWeight: 600, fontSize: 12, fontFamily: "system-ui", cursor: "pointer",
            }}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {showInterventions ? "Hide" : "Show"} Interventions
          </button>

          {showInterventions && (
            <div style={{ borderTop: "1px solid #e8eaed", paddingTop: 12 }}>
              <InterventionPanel
                interventions={interventions}
                onToggle={toggleIntervention}
                effectiveR0={impact.effectiveR0}
                reductionPct={impact.reductionPct}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right SEIR panel */}
      <div
        className="absolute top-4 right-4 z-[500] w-[260px] rounded-xl hidden lg:block"
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
          border: "1px solid rgba(0,0,0,0.08)",
          padding: "14px 16px",
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 13, color: "#202124", marginBottom: 10, fontFamily: "system-ui" }}>
          SEIR Projection — {disease}
        </div>
        <SEIRChart r0={impact.effectiveR0} days={30} height={140} />
        <Link to="/intelligence" style={{ fontSize: 11, color: diseaseColor, textDecoration: "none", marginTop: 8, display: "inline-block", fontFamily: "system-ui" }}>
          Open Intelligence Hub →
        </Link>
      </div>

      {/* Bottom stats bar */}
      <div
        className="absolute bottom-4 left-4 right-4 z-[500] rounded-xl grid grid-cols-2 md:grid-cols-5 gap-0"
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
          border: "1px solid rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        {[
          { label: "Simulated Active Cases", value: fmtNum(simActiveCases), color: diseaseColor },
          { label: "Baseline (National)", value: fmtNum(nationalStats.activeCases), color: "#5f6368" },
          { label: "Districts in Red Zone", value: String(simCities.filter((c) => c.status === "Critical").length), color: "#ef4444" },
          { label: "Effective R₀", value: String(impact.effectiveR0), color: impact.effectiveR0 > 1 ? "#ef4444" : "#188038" },
          { label: "Intervention Impact", value: `−${impact.reductionPct}%`, color: "#188038" },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: "12px 16px", borderRight: i < 4 ? "1px solid #e8eaed" : "none" }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#5f6368", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "system-ui", marginBottom: 4 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "monospace", lineHeight: 1 }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
