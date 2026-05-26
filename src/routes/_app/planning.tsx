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
  component: PlanningPage,
});

function PlanningPage() {
  const [scenarios, setScenarios] = useState(emergencyScenarios);
  const [selectedId, setSelectedId] = useState(scenarios[0]?.id ?? "");

  const selected = scenarios.find((s) => s.id === selectedId) ?? scenarios[0];
  const overwhelmed = hospitals.filter((h) => h.status !== "Operational").length;

  const toggleAction = (scenarioId: string, taskIndex: number) => {
    setScenarios((prev) =>
      prev.map((s) => {
        if (s.id !== scenarioId) return s;
        const actions = s.actions.map((a, i) =>
          i === taskIndex ? { ...a, done: !a.done } : a,
        );
        return { ...s, actions };
      }),
    );
  };

  const deployPlan = () => {
    toast.success(`Emergency plan "${selected.name}" deployed to district coordinators`);
  };

  return (
    <div className="p-5 md:p-6 max-w-[1600px] mx-auto space-y-5 text-[#031B1D]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-60">
            Core Feature · Emergency Response
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl mt-1">
            Emergency Response Planning
          </h1>
          <p className="text-sm opacity-60">
            Coordinate multi-agency crisis scenarios, resource deployment, and actionable response
            workflows for healthcare administrators
          </p>
        </div>
        <button className="btn-ghost flex items-center gap-2 text-sm">
          <Plus className="h-4 w-4" /> New Scenario
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric label="Active Scenarios" value={String(scenarios.filter((s) => s.status === "Active").length)} c="var(--red)" />
        <Metric label="Overwhelmed Hospitals" value={String(overwhelmed)} c="var(--moderate)" />
        <Metric label="Zones Covered" value={String(scenarios.reduce((s, sc) => s + sc.zones, 0))} c="var(--teal)" />
        <Metric label="Pending Actions" value={String(scenarios.flatMap((s) => s.actions).filter((a) => !a.done).length)} c="var(--blue)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="panel space-y-2">
          <div className="font-display font-bold text-lg mb-2 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-teal" />
            Response Scenarios
          </div>
          {scenarios.map((s) => {
            const active = s.id === selectedId;
            const sevColor =
              s.severity === "RED" ? "var(--red)" : s.severity === "AMBER" ? "var(--moderate)" : "var(--mild)";
            return (
              <button
                key={s.id}
                onClick={() => setSelectedId(s.id)}
                className="w-full text-left p-3 rounded-md transition-all"
                style={
                  active
                    ? { background: "var(--red-dim)", border: "1px solid var(--red)" }
                    : { border: "1px solid var(--border)" }
                }
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{s.name}</span>
                  <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ color: sevColor, background: `${sevColor}22` }}>
                    {s.severity}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-muted mt-1">
                  {s.status} · {s.zones} zone{s.zones !== 1 ? "s" : ""}
                </div>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="panel lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display font-bold text-xl">{selected.name}</h2>
                <div className="text-[11px] text-mid mt-1">Lead: {selected.leadAgency}</div>
              </div>
              <button onClick={deployPlan} className="btn-primary text-sm flex items-center gap-2">
                <Truck className="h-4 w-4" /> Deploy Plan
              </button>
            </div>

            <div
              className="p-3 rounded-md flex items-start gap-2"
              style={{ background: "var(--moderate-bg)", border: "1px solid rgba(245,158,11,0.3)" }}
            >
              <AlertTriangle className="h-4 w-4 text-moderate shrink-0 mt-0.5" />
              <div>
                <div className="text-[11px] font-mono text-muted uppercase">Resources Deployed</div>
                <div className="text-sm mt-0.5">{selected.resourcesDeployed}</div>
              </div>
            </div>

            <div>
              <div className="font-display font-bold text-base mb-3">Action Checklist</div>
              <ActionTracker
                scenario={selected}
                onToggleAction={(i) => toggleAction(selected.id, i)}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="p-3 rounded-md" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="text-[10px] uppercase text-muted mb-2">Rapid Escalation</div>
                <button
                  onClick={() => toast.info("NDRF and state health desks notified")}
                  className="btn-ghost w-full text-xs"
                >
                  Escalate to National Desk
                </button>
              </div>
              <div className="p-3 rounded-md" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="text-[10px] uppercase text-muted mb-2 flex items-center gap-1">
                  <Phone className="h-3 w-3" /> War Room
                </div>
                <a href="tel:1075" className="text-teal text-sm font-mono hover:underline">
                  1075 — National Health Helpline
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, c }: { label: string; value: string; c: string }) {
  return (
    <div className="panel border-white/10 relative overflow-hidden">
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">{label}</div>
      <div className="font-mono font-extrabold text-3xl mt-2 drop-shadow-sm" style={{ color: c }}>
        {value}
      </div>
      <div className="absolute -bottom-6 -right-6 h-16 w-16 rounded-full blur-2xl" style={{ background: c, opacity: 0.15 }} />
    </div>
  );
}
