import { useMemo } from 'react';
import { predictHealthcareCollapse } from '@/lib/simulation';
import { Link } from '@tanstack/react-router';

interface CollapseRiskWatchProps {
  limit?: number;
}

export function CollapseRiskWatch({ limit = 4 }: CollapseRiskWatchProps) {
  const risks = useMemo(() => predictHealthcareCollapse().slice(0, limit), [limit]);
  
  return (
    <div className="panel">
      <div className="flex items-center justify-between mb-3">
        <div className="font-display font-bold text-lg">Collapse Risk Watch</div>
        <Link to="/intelligence" className="text-[10px] text-teal hover:underline">
          View all →
        </Link>
      </div>
      <div className="space-y-2">
        {risks.map((r) => {
          const color = getColorForRiskLevel(r.riskLevel);
          return (
            <div 
              key={r.city} 
              className="flex items-center gap-2 p-2 rounded-md" 
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-medium">{r.city}</div>
                <div className="text-[9px] font-mono text-muted">
                  ICU {r.icuLoadPct}% · {r.riskLevel}
                </div>
              </div>
              <div className="font-mono font-bold text-sm" style={{ color }}>
                {r.riskScore}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getColorForRiskLevel(level: string): string {
  switch (level) {
    case "Critical": return "var(--severe)";
    case "High": return "var(--moderate)";
    case "Moderate": return "var(--blue)";
    default: return "var(--mild)";
  }
}
