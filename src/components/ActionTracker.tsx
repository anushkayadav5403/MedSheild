import { Check, Circle } from 'lucide-react';
import type { EmergencyScenario } from '@/lib/simulation';

interface ActionTrackerProps {
  scenario: EmergencyScenario;
  onToggleAction: (actionIndex: number) => void;
}

export function ActionTracker({ scenario, onToggleAction }: ActionTrackerProps) {
  return (
    <div className="panel">
      <div className="font-display font-bold text-lg mb-3">
        Action Checklist — {scenario.name}
      </div>
      <div className="space-y-2">
        {scenario.actions.map((action, idx) => (
          <label 
            key={idx} 
            className="flex items-start gap-3 p-2 rounded-md cursor-pointer hover:bg-white/[0.03] transition-colors"
          >
            <input
              type="checkbox"
              checked={action.done}
              onChange={() => onToggleAction(idx)}
              className="mt-1 accent-teal"
            />
            <div className="flex-1">
              <div className={`text-sm ${action.done ? 'line-through text-muted' : ''}`}>
                {action.task}
              </div>
              <div className="text-[10px] font-mono text-muted mt-0.5">
                {action.owner} · ETA {action.eta}
              </div>
            </div>
            {action.done ? (
              <Check className="h-4 w-4 text-mild" />
            ) : (
              <Circle className="h-4 w-4 text-muted" />
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
