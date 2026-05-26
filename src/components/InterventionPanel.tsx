import type { Intervention } from '@/lib/simulation';

interface InterventionPanelProps {
  interventions: Intervention[];
  onToggle: (id: string) => void;
  effectiveR0: number;
  reductionPct: number;
}

export function InterventionPanel({ 
  interventions, 
  onToggle, 
  effectiveR0, 
  reductionPct 
}: InterventionPanelProps) {
  return (
    <div className="space-y-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
      <div className="text-[10px] uppercase tracking-wider text-muted mb-2">
        Policy Interventions
      </div>
      {interventions.map((i) => (
        <label 
          key={i.id} 
          className="flex items-center justify-between text-xs cursor-pointer hover:bg-white/[0.03] p-1.5 rounded transition-colors"
        >
          <div className="flex-1">
            <span className="text-mid">{i.label}</span>
            <span className="text-[10px] font-mono text-muted ml-2">
              {i.impact > 0 ? '+' : ''}{Math.round(i.impact * 100)}%
            </span>
          </div>
          <input
            type="checkbox"
            checked={i.enabled}
            onChange={() => onToggle(i.id)}
            className="accent-teal"
          />
        </label>
      ))}
      <div className="text-[10px] font-mono text-mid pt-2 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex justify-between mb-1">
          <span>Effective R₀:</span>
          <span className="text-teal font-bold">{effectiveR0}</span>
        </div>
        <div className="flex justify-between">
          <span>Case Reduction:</span>
          <span className="text-mild font-bold">−{reductionPct}%</span>
        </div>
      </div>
    </div>
  );
}
