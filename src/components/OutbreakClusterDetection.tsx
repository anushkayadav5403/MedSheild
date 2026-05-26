import { useMemo } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Cluster {
  district: string;
  spikePercent: number;
  severity: 'critical' | 'high';
}

export function OutbreakClusterDetection() {
  const clusters = useMemo<Cluster[]>(() => {
    // Mock implementation - in production would analyze symptom reports
    return [
      { district: "Mumbai Central", spikePercent: 340, severity: 'critical' },
      { district: "Delhi NCR East", spikePercent: 280, severity: 'high' },
      { district: "Chennai North", spikePercent: 220, severity: 'high' },
    ];
  }, []);
  
  return (
    <div className="panel">
      <div className="font-display font-bold text-lg mb-3">
        Suspected Outbreak Clusters
      </div>
      <div className="space-y-2">
        {clusters.map((c) => {
          const color = c.spikePercent > 300 ? "var(--red)" : "var(--moderate)";
          const bg = c.spikePercent > 300 ? "var(--red-dim)" : "var(--moderate-bg)";
          return (
            <div 
              key={c.district} 
              className="flex items-center gap-3 p-3 rounded-md"
              style={{ background: bg }}
            >
              <AlertTriangle className="h-5 w-5" style={{ color }} />
              <div className="flex-1">
                <div className="text-sm font-medium">{c.district}</div>
                <div className="text-[10px] text-muted">
                  +{c.spikePercent}% spike in 24h
                </div>
              </div>
              <span 
                className="text-[9px] font-mono font-bold px-2 py-1 rounded"
                style={{ color, background: "rgba(0,0,0,0.2)" }}
              >
                EMERGING CLUSTER
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
