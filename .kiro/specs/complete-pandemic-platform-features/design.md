# Design Document

## Overview

This design implements 20 UI features that expose existing backend simulation capabilities in the National Pandemic Simulation Platform. All backend functions already exist in `simulation.ts` and `mockData.ts` — this design focuses on creating React components that surface these capabilities with consistent UX patterns.

**Core Design Principles:**
- Reuse existing shadcn/ui components (Card, Badge, Button, etc.)
- Match existing color scheme (CSS variables: --teal, --severe, --moderate, --mild, --blue, --purple)
- Use JetBrains Mono for monospace text, font-display for headings
- Maintain "panel" class styling for consistency
- Keep components focused and composable
- Use React hooks for local state management
- Leverage existing backend functions without modification

**Technology Stack:**
- React 18 with TypeScript
- TanStack Router for routing
- shadcn/ui component library
- Recharts for data visualization
- Sonner for toast notifications
- CSS custom properties for theming

## Architecture

### Component Hierarchy

```
Dashboard (existing)
├── CollapseRiskWatch (new)
├── CriticalSupplyAlerts (new)
└── LiveAlerts (enhanced)

Intelligence Hub (existing)
├── InterventionControls (enhanced)
├── ImpactAnalysis (new)
└── MobilityFlowTable (enhanced)

Map Page (existing)
├── InterventionPanel (new)
├── SimulationControls (enhanced)
└── SEIRProjection (existing)

Resources Page (existing)
├── VaccineOptimizer (new)
├── ResourceDemandChart (existing)
└── HospitalTable (enhanced with filters)

Planning Page (existing)
└── ActionTracker (new)

Passport Page (existing)
├── VaccinationRecordVerification (new)
├── DailySymptomHistory (new)
├── ReadinessScore (new)
└── EmergencyContactActions (new)

Symptoms Page (existing)
└── OutbreakClusterDetection (new)

Offline Page (existing)
├── FacilityCaching (new)
└── FacilityFilters (new)
```

### Data Flow

**Pattern 1: Direct Backend Call**
```
Component → Backend Function → State → Render
```
Example: `CollapseRiskWatch` calls `predictHealthcareCollapse()` on mount

**Pattern 2: Reactive Computation**
```
User Input → State Update → useMemo → Backend Function → Render
```
Example: Intervention toggles update state, useMemo recalculates impact via `analyzeInterventions()`

**Pattern 3: Cached Data**
```
Component → localStorage → Render (offline mode)
```
Example: Offline page reads cached facilities from localStorage

### State Management Strategy

**Local Component State:**
- UI toggles (filters, checkboxes, sliders)
- Form inputs
- Temporary selections

**React Hooks:**
- `useState` for local state
- `useMemo` for expensive computations
- `useEffect` for side effects (timers, localStorage)

**No Global State:**
- All backend functions are pure or read from mockData
- No need for Redux/Zustand
- Props drilling is minimal due to flat component structure

## Components and Interfaces

### 1. CollapseRiskWatch Component

**Location:** `src/components/CollapseRiskWatch.tsx`

**Purpose:** Display top 4 districts by healthcare collapse risk on dashboard

**Props:**
```typescript
interface CollapseRiskWatchProps {
  limit?: number; // default 4
}
```

**Implementation:**
```typescript
import { useMemo } from 'react';
import { predictHealthcareCollapse } from '@/lib/simulation';
import { Link } from '@tanstack/react-router';

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
            <div key={r.city} className="flex items-center gap-2 p-2 rounded-md" 
                 style={{ background: "rgba(255,255,255,0.02)" }}>
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
```

### 2. CriticalSupplyAlerts Component

**Location:** Inline in Dashboard (small component)

**Purpose:** Show medicines with <= 5 days stock

**Implementation:**
```typescript
// In dashboard.tsx
const criticalMedicine = medicineDemand.filter((m) => m.stockDays <= 5);

// Render within National Resource Status panel:
{criticalMedicine.length > 0 && (
  <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
    <div className="text-[10px] uppercase tracking-wider text-muted mb-2">
      Critical Supply Alerts
    </div>
    {criticalMedicine.slice(0, 3).map((m) => (
      <div key={m.name} className="flex justify-between text-[11px] mb-1">
        <span className="text-mid">{m.name}</span>
        <span className="font-mono" style={{ 
          color: m.stockDays <= 3 ? "var(--red)" : "var(--moderate)" 
        }}>
          {m.stockDays}d stock
        </span>
      </div>
    ))}
  </div>
)}
```

### 3. InterventionPanel Component

**Location:** `src/components/InterventionPanel.tsx`

**Purpose:** Toggle intervention policies on map page

**Props:**
```typescript
interface InterventionPanelProps {
  interventions: Intervention[];
  onToggle: (id: string) => void;
  effectiveR0: number;
  reductionPct: number;
}
```

**State Management:**
```typescript
// In map.tsx
const [interventions, setInterventions] = useState<Intervention[]>(defaultInterventions);
const [showInterventions, setShowInterventions] = useState(false);

const impact = useMemo(
  () => analyzeInterventions(spread, interventions, 14),
  [spread, interventions]
);

const toggleIntervention = (id: string) => {
  setInterventions((prev) =>
    prev.map((i) => (i.id === id ? { ...i, enabled: !i.enabled } : i))
  );
};
```

### 4. VaccineOptimizer Component

**Location:** `src/components/VaccineOptimizer.tsx`

**Purpose:** Display optimized vaccine allocation with adjustable total doses

**Props:**
```typescript
interface VaccineOptimizerProps {
  initialDoses?: number; // default 2_400_000
}
```

**Implementation:**
```typescript
import { useState, useMemo } from 'react';
import { optimizeVaccineDistribution } from '@/lib/simulation';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';

export function VaccineOptimizer({ initialDoses = 2_400_000 }: VaccineOptimizerProps) {
  const [totalDoses, setTotalDoses] = useState(initialDoses);
  const allocation = useMemo(() => optimizeVaccineDistribution(totalDoses), [totalDoses]);
  
  const chartData = [
    { name: "P1", doses: allocation.filter(v => v.priority === "P1").reduce((s, v) => s + v.recommendedDoses, 0) },
    { name: "P2", doses: allocation.filter(v => v.priority === "P2").reduce((s, v) => s + v.recommendedDoses, 0) },
    { name: "P3", doses: allocation.filter(v => v.priority === "P3").reduce((s, v) => s + v.recommendedDoses, 0) },
  ];
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="panel lg:col-span-2">
        <div className="font-display font-bold text-lg mb-1">
          Vaccine Distribution Optimizer
        </div>
        <div className="text-[11px] text-mid mb-3">
          Priority allocation across {(totalDoses / 1_000_000).toFixed(1)}M dose weekly supply
        </div>
        <div className="mb-3">
          <label className="text-[10px] uppercase tracking-wider text-muted">
            Total Available Doses
          </label>
          <input
            type="range"
            min={1_000_000}
            max={5_000_000}
            step={100_000}
            value={totalDoses}
            onChange={(e) => setTotalDoses(Number(e.target.value))}
            className="w-full mt-2 accent-teal"
          />
        </div>
        <table className="w-full text-sm">
          {/* Table implementation */}
        </table>
      </div>
      <div className="panel">
        <div className="font-display font-bold text-lg mb-3">
          Allocation by Priority
        </div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fill: "#5c6476", fontSize: 10 }} />
              <YAxis tick={{ fill: "#5c6476", fontSize: 10 }} />
              <Bar dataKey="doses" radius={[4, 4, 0, 0]}>
                <Cell fill="#ef4444" />
                <Cell fill="#f59e0b" />
                <Cell fill="#10b981" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
```

### 5. MobilityFlowTable Component

**Location:** Inline in Intelligence Hub (already exists, needs enhancement)

**Current State:** Already implemented in intelligence.tsx
**Enhancement:** Add lockdown slider integration (already present)

### 6. OutbreakClusterDetection Component

**Location:** `src/components/OutbreakClusterDetection.tsx`

**Purpose:** Detect and display symptom report spikes

**Implementation:**
```typescript
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
            <div key={c.district} className="flex items-center gap-3 p-3 rounded-md"
                 style={{ background: bg }}>
              <AlertTriangle className="h-5 w-5" style={{ color }} />
              <div className="flex-1">
                <div className="text-sm font-medium">{c.district}</div>
                <div className="text-[10px] text-muted">
                  +{c.spikePercent}% spike in 24h
                </div>
              </div>
              <span className="text-[9px] font-mono font-bold px-2 py-1 rounded"
                    style={{ color, background: "rgba(0,0,0,0.2)" }}>
                EMERGING CLUSTER
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 7. ActionTracker Component

**Location:** `src/components/ActionTracker.tsx`

**Purpose:** Track emergency scenario action completion

**Props:**
```typescript
interface ActionTrackerProps {
  scenario: EmergencyScenario;
  onToggleAction: (actionIndex: number) => void;
}
```

**Implementation:**
```typescript
import { Check, Circle } from 'lucide-react';

export function ActionTracker({ scenario, onToggleAction }: ActionTrackerProps) {
  return (
    <div className="panel">
      <div className="font-display font-bold text-lg mb-3">
        Action Checklist — {scenario.name}
      </div>
      <div className="space-y-2">
        {scenario.actions.map((action, idx) => (
          <label key={idx} className="flex items-start gap-3 p-2 rounded-md cursor-pointer
                                       hover:bg-white/[0.03] transition-colors">
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
```

### 8. VaccinationRecordVerification Component

**Location:** Inline in Passport Page

**Implementation:**
```typescript
// In passport.tsx
<div className="panel">
  <div className="font-display font-bold text-lg mb-3">Vaccination Record</div>
  <div className="space-y-2">
    {myPassport.doses.map((dose) => (
      <div key={dose.n} className="p-3 rounded-md" 
           style={{ border: "1px solid var(--border)" }}>
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-sm font-medium">Dose {dose.n} — {dose.vaccine}</div>
            <div className="text-[10px] text-muted">{dose.date} · {dose.site}</div>
          </div>
          {dose.verified ? (
            <span className="text-[9px] font-mono font-bold px-2 py-1 rounded flex items-center gap-1"
                  style={{ color: "var(--mild)", background: "var(--mild-bg)" }}>
              <Check className="h-3 w-3" /> COWIN VERIFIED
            </span>
          ) : (
            <span className="text-[9px] font-mono font-bold px-2 py-1 rounded flex items-center gap-1"
                  style={{ color: "var(--moderate)", background: "var(--moderate-bg)" }}>
              <AlertTriangle className="h-3 w-3" /> PENDING
            </span>
          )}
        </div>
        <div className="text-[10px] font-mono text-muted">Batch: {dose.batch}</div>
      </div>
    ))}
  </div>
  <button onClick={() => toast.success("Syncing with CoWIN...")} 
          className="btn-primary w-full mt-3">
    Sync with CoWIN
  </button>
</div>
```

### 9. DailySymptomHistory Component

**Location:** `src/components/DailySymptomHistory.tsx`

**Purpose:** 7-day symptom check-in calendar

**Implementation:**
```typescript
import { useState } from 'react';

type CheckInStatus = 'ok' | 'mild' | 'bad' | 'none';

interface DayCheckIn {
  date: string;
  status: CheckInStatus;
}

export function DailySymptomHistory() {
  const [history, setHistory] = useState<DayCheckIn[]>([
    { date: 'Mon', status: 'ok' },
    { date: 'Tue', status: 'ok' },
    { date: 'Wed', status: 'mild' },
    { date: 'Thu', status: 'ok' },
    { date: 'Fri', status: 'none' },
    { date: 'Sat', status: 'none' },
    { date: 'Sun', status: 'none' },
  ]);
  
  const getStatusColor = (status: CheckInStatus) => {
    switch (status) {
      case 'ok': return 'var(--mild)';
      case 'mild': return 'var(--moderate)';
      case 'bad': return 'var(--red)';
      default: return 'transparent';
    }
  };
  
  return (
    <div className="panel">
      <div className="font-display font-bold text-lg mb-3">
        Daily Symptom Check-in
      </div>
      <div className="grid grid-cols-7 gap-2 mb-3">
        {history.map((day, idx) => (
          <div key={idx} className="text-center">
            <div className="text-[9px] text-muted mb-1">{day.date}</div>
            <div className="h-10 rounded-md" style={{
              background: getStatusColor(day.status),
              border: day.status === 'none' ? '1px dashed var(--border)' : 'none'
            }} />
          </div>
        ))}
      </div>
      <button className="btn-primary w-full">Check In Today</button>
    </div>
  );
}
```

### 10. OfflineFacilityCaching Component

**Location:** Inline in Offline Page

**Implementation:**
```typescript
// In offline.tsx
const [cached, setCached] = useState(false);
const [savedAt, setSavedAt] = useState<string | null>(null);

const saveOfflineData = () => {
  localStorage.setItem('sentinel.facilities', JSON.stringify(facilities));
  localStorage.setItem('sentinel.offlineSavedAt', new Date().toISOString());
  setCached(true);
  setSavedAt(new Date().toLocaleString('en-IN'));
  toast.success('Offline cache ready');
};

// Render:
<button onClick={saveOfflineData} className="btn-primary">
  Save My Area
</button>
{cached && (
  <div className="mt-3 p-3 rounded-md" style={{ background: "var(--mild-bg)" }}>
    <div className="text-sm font-bold text-mild">CACHE READY</div>
    <div className="text-[10px] text-muted mt-1">
      {facilities.length} facilities · {districtContacts.length} contacts · {savedAt}
    </div>
  </div>
)}
```

### 11. ReadinessScore Component

**Location:** Inline in Passport Page

**Implementation:**
```typescript
// In passport.tsx
const computeScore = () => {
  let score = 0;
  if (myPassport.bloodType) score += 20;
  if (myPassport.allergies.length > 0) score += 15;
  if (myPassport.vaccination.doses >= 2) score += 25;
  if (myPassport.emergencyContacts.length >= 2) score += 20;
  if (myPassport.conditions.length > 0 || myPassport.medications.length > 0) score += 20;
  return score;
};

const score = computeScore();

// Render:
<div className="panel">
  <div className="font-display font-bold text-lg mb-3">
    Pandemic Readiness Score
  </div>
  <div className="font-mono font-extrabold text-5xl text-teal mb-2">
    {score}%
  </div>
  <div className="h-2 rounded-full overflow-hidden" 
       style={{ background: "rgba(255,255,255,0.06)" }}>
    <div className="h-full transition-all duration-700" 
         style={{ width: `${score}%`, background: "var(--teal)" }} />
  </div>
  <div className="text-[10px] text-mid mt-2">
    Based on profile completeness and vaccination status
  </div>
</div>
```

### 12. FacilityFilters Component

**Location:** Inline in Offline Page

**Implementation:**
```typescript
// In offline.tsx
const [filter, setFilter] = useState<'all' | 'hospital' | '24hr' | 'oxygen'>('all');

const filteredFacilities = facilities.filter((f) => {
  if (filter === 'hospital') return f.type.includes('Hospital');
  if (filter === '24hr') return f.open24hr;
  if (filter === 'oxygen') return f.hasOxygen;
  return true;
});

// Render:
<div className="flex gap-2 mb-3">
  {(['all', 'hospital', '24hr', 'oxygen'] as const).map((f) => (
    <button
      key={f}
      onClick={() => setFilter(f)}
      className="text-xs px-3 py-1.5 rounded-md transition-colors"
      style={filter === f ? 
        { background: "var(--teal)", color: "white" } : 
        { background: "rgba(255,255,255,0.06)", color: "var(--mid)" }
      }
    >
      {f === 'all' ? 'All' : f === 'hospital' ? 'Hospital' : 
       f === '24hr' ? '24hr' : 'Oxygen'}
    </button>
  ))}
</div>
```

## Data Models

### Existing Types (from simulation.ts)

```typescript
// Already defined in simulation.ts
type CollapseRisk = {
  city: string;
  state: string;
  riskScore: number;
  riskLevel: "Critical" | "High" | "Moderate" | "Low";
  icuLoadPct: number;
  daysToCollapse: number | null;
  factors: string[];
};

type Intervention = {
  id: string;
  label: string;
  enabled: boolean;
  impact: number;
};

type InterventionImpact = {
  baselineCases: number;
  projectedCases: number;
  reductionPct: number;
  effectiveR0: number;
  hospitalizationDelta: number;
};

type VaccineAllocation = {
  city: string;
  state: string;
  populationWeight: number;
  outbreakWeight: number;
  recommendedDoses: number;
  priority: "P1" | "P2" | "P3";
  coverageGap: number;
};

type MobilityFlow = {
  from: string;
  to: string;
  volume: number;
  riskContribution: number;
};

type MedicineDemand = {
  name: string;
  dailyUnits: number;
  stockDays: number;
  trend: "rising" | "stable" | "falling";
};

type EmergencyScenario = {
  id: string;
  name: string;
  severity: "RED" | "AMBER" | "GREEN";
  status: "Active" | "Draft" | "Completed";
  zones: number;
  resourcesDeployed: string;
  leadAgency: string;
  actions: { task: string; owner: string; eta: string; done: boolean }[];
};
```

### New Component State Types

```typescript
// For DailySymptomHistory
type CheckInStatus = 'ok' | 'mild' | 'bad' | 'none';

interface DayCheckIn {
  date: string;
  status: CheckInStatus;
}

// For OutbreakClusterDetection
interface Cluster {
  district: string;
  spikePercent: number;
  severity: 'critical' | 'high';
}

// For FacilityFilters
type FacilityFilter = 'all' | 'hospital' | '24hr' | 'oxygen';

// For ActionTracker (uses existing EmergencyScenario)
interface ActionTrackerState {
  selectedScenario: EmergencyScenario | null;
}
```

### LocalStorage Schema

```typescript
// Offline caching
interface OfflineCache {
  'sentinel.facilities': string; // JSON.stringify(facilities)
  'sentinel.offlineSavedAt': string; // ISO timestamp
}
```

## Error Handling

### Backend Function Errors

All backend functions in `simulation.ts` are pure functions that don't throw errors. They handle edge cases internally:

- `predictHealthcareCollapse()`: Returns empty array if no hospitals
- `optimizeVaccineDistribution()`: Handles zero doses gracefully
- `simulateMobility()`: Returns empty array if no flows meet threshold
- `analyzeInterventions()`: Clamps R₀ to minimum 0.8

### Component Error Boundaries

Not required for this implementation since:
- No async operations (all data is synchronous)
- No external API calls
- Backend functions are defensive

### User Input Validation

**Slider Inputs:**
- All sliders have min/max constraints in HTML
- Values are clamped by browser automatically

**Checkbox Inputs:**
- Boolean state, no validation needed

**LocalStorage:**
```typescript
// Safe localStorage access
const loadCachedFacilities = () => {
  try {
    const cached = localStorage.getItem('sentinel.facilities');
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Failed to load cached facilities:', error);
    return [];
  }
};
```

### Toast Notifications

Use Sonner for user feedback:
```typescript
import { toast } from 'sonner';

// Success
toast.success('Offline cache ready');

// Error (rare, only for localStorage failures)
toast.error('Failed to save offline data');

// Info
toast.info('Syncing with CoWIN...');
```

## Testing Strategy

### Unit Tests

**Focus Areas:**
- Color mapping functions (`getColorForRiskLevel`, `getStatusColor`)
- Score calculation (`computeScore`)
- Filter logic (`filteredFacilities`)
- LocalStorage serialization/deserialization

**Example Test:**
```typescript
describe('getColorForRiskLevel', () => {
  it('returns red for Critical', () => {
    expect(getColorForRiskLevel('Critical')).toBe('var(--severe)');
  });
  
  it('returns orange for High', () => {
    expect(getColorForRiskLevel('High')).toBe('var(--moderate)');
  });
  
  it('returns blue for Moderate', () => {
    expect(getColorForRiskLevel('Moderate')).toBe('var(--blue)');
  });
  
  it('returns green for Low', () => {
    expect(getColorForRiskLevel('Low')).toBe('var(--mild)');
  });
});
```

### Integration Tests

**Focus Areas:**
- Component rendering with backend data
- User interactions (slider changes, checkbox toggles)
- State updates triggering re-renders
- LocalStorage persistence

**Example Test:**
```typescript
describe('VaccineOptimizer', () => {
  it('updates allocation when slider changes', () => {
    render(<VaccineOptimizer />);
    const slider = screen.getByRole('slider');
    
    fireEvent.change(slider, { target: { value: '3000000' } });
    
    // Verify table updates with new allocation
    expect(screen.getByText(/3.0M dose/)).toBeInTheDocument();
  });
});
```

### Visual Regression Tests

**Focus Areas:**
- Panel styling consistency
- Color scheme adherence
- Typography (JetBrains Mono, font-display)
- Responsive layout

**Tools:**
- Storybook for component isolation
- Chromatic for visual diffs

### Manual Testing Checklist

**Dashboard:**
- [ ] Collapse Risk Watch shows top 4 districts
- [ ] Critical Supply Alerts appear when stockDays <= 5
- [ ] Live Alerts display with correct severity colors

**Intelligence Hub:**
- [ ] Intervention toggles update effective R₀
- [ ] Impact metrics recalculate on intervention change
- [ ] Mobility flows update with lockdown slider

**Map Page:**
- [ ] Intervention panel expands/collapses
- [ ] Simulation playback runs at 600ms intervals
- [ ] SEIR chart updates with new R₀

**Resources Page:**
- [ ] Vaccine optimizer slider adjusts allocation
- [ ] Hospital filters work (critical only, state)
- [ ] Medicine demand chart renders correctly

**Planning Page:**
- [ ] Action checkboxes toggle done status
- [ ] Completed actions show strikethrough

**Passport Page:**
- [ ] Vaccination records show verification badges
- [ ] Symptom history calendar displays 7 days
- [ ] Readiness score calculates correctly
- [ ] Emergency contacts are clickable tel: links

**Offline Page:**
- [ ] Save My Area caches facilities to localStorage
- [ ] Facility filters work in offline mode
- [ ] Emergency contact buttons have tel: links


## Correctness Properties

**Property-based testing is not applicable to this feature.**

**Rationale:**

This feature implements UI components that expose existing backend capabilities. The work consists of:

1. **UI Rendering** - React components displaying data with consistent styling
2. **Simple Data Transformations** - Color mapping based on severity levels, filtering arrays, formatting numbers
3. **Local State Management** - Checkbox toggles, slider values, filter selections
4. **Integration with Existing Functions** - Calling backend functions that are already implemented and tested

According to PBT applicability guidelines:

**PBT is NOT appropriate for:**
- ✗ UI rendering and layout (this feature is primarily UI components)
- ✗ Simple CRUD operations (filtering, toggling checkboxes)
- ✗ Configuration validation (slider constraints handled by HTML)

**PBT IS appropriate for:**
- ✓ Pure functions with clear input/output (backend functions already exist in simulation.ts)
- ✓ Universal properties across wide input spaces (backend logic, not UI layer)

**Testing Strategy for This Feature:**

Instead of property-based tests, this feature will use:

1. **Unit Tests** - Test pure helper functions (color mapping, score calculation, filter logic)
2. **Integration Tests** - Test component rendering with mock data, user interactions
3. **Visual Regression Tests** - Ensure UI consistency with design system
4. **Manual Testing** - Verify user flows and accessibility

The backend functions (`predictHealthcareCollapse`, `analyzeInterventions`, `optimizeVaccineDistribution`, etc.) would benefit from property-based testing, but those are out of scope for this design as they already exist and are tested separately.

**Example of appropriate unit test (not PBT):**

```typescript
describe('getColorForRiskLevel', () => {
  it('maps Critical to red', () => {
    expect(getColorForRiskLevel('Critical')).toBe('var(--severe)');
  });
  
  it('maps High to orange', () => {
    expect(getColorForRiskLevel('High')).toBe('var(--moderate)');
  });
  
  it('maps Moderate to blue', () => {
    expect(getColorForRiskLevel('Moderate')).toBe('var(--blue)');
  });
  
  it('maps Low to green', () => {
    expect(getColorForRiskLevel('Low')).toBe('var(--mild)');
  });
});
```

This is a simple mapping function with 4 discrete inputs - example-based tests are more appropriate than generating random risk levels.
