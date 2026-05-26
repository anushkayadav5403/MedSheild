import { caseTrend14d, cityOutbreaks, hospitals, type CityOutbreak } from "./mockData";

export type SEIRParams = {
  population: number;
  r0: number;
  infectiousDays: number;
  initialInfected: number;
  days: number;
  vaccinationRate?: number;
};

export type SEIRPoint = {
  day: number;
  susceptible: number;
  exposed: number;
  infected: number;
  recovered: number;
  hospitalized: number;
};

export function runSEIR({
  population,
  r0,
  infectiousDays,
  initialInfected,
  days,
  vaccinationRate = 0,
}: SEIRParams): SEIRPoint[] {
  const beta = r0 / infectiousDays;
  const gamma = 1 / infectiousDays;
  const sigma = 1 / 5;
  const vax = Math.min(0.95, vaccinationRate / 100);

  let S = population * (1 - vax) - initialInfected;
  let E = initialInfected * 0.4;
  let I = initialInfected * 0.6;
  let R = population * vax;
  const points: SEIRPoint[] = [];

  for (let d = 0; d <= days; d++) {
    const hospRate = 0.08;
    points.push({
      day: d,
      susceptible: Math.round(S),
      exposed: Math.round(E),
      infected: Math.round(I),
      recovered: Math.round(R),
      hospitalized: Math.round(I * hospRate),
    });
    if (d === days) break;
    const newExposed = (beta * S * I) / population;
    const newInfected = sigma * E;
    const newRecovered = gamma * I;
    S = Math.max(0, S - newExposed);
    E = Math.max(0, E + newExposed - newInfected);
    I = Math.max(0, I + newInfected - newRecovered);
    R += newRecovered;
  }
  return points;
}

export type ForecastPoint = {
  day: string;
  actual?: number;
  forecast: number;
  lower: number;
  upper: number;
};

export function forecastOutbreak(daysAhead = 14, startingValue?: number): ForecastPoint[] {
  const baseValue = startingValue || 284000;
  
  // Generate historical-like actual points leading to base
  const historical = Array.from({ length: 14 }, (_, i) => {
    const day = new Date();
    day.setDate(day.getDate() - (13 - i));
    const cases = Math.round(baseValue * (0.85 + (i * 0.01)));
    return {
      day: day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      cases
    };
  });

  const n = historical.length;
  const growth = Math.max(100, (historical[n - 1].cases - historical[0].cases) / (n - 1));
  const volatility = Math.max(200, growth * 0.5);

  const result: ForecastPoint[] = historical.map((d) => ({
    day: d.day,
    actual: d.cases,
    forecast: d.cases,
    lower: d.cases * 0.95,
    upper: d.cases * 1.05,
  }));

  for (let i = 1; i <= daysAhead; i++) {
    const last = result[result.length - 1].forecast;
    const trend = growth * (1 + 0.05 * Math.cos(i / 2));
    const predicted = Math.round(last + trend);
    const band = volatility * (1 + i * 0.1);
    result.push({
      day: `+${i}d`,
      forecast: predicted,
      lower: Math.max(0, predicted - band),
      upper: predicted + band,
    });
  }
  return result;
}

export type CollapseRisk = {
  city: string;
  state: string;
  riskScore: number;
  riskLevel: "Critical" | "High" | "Moderate" | "Low";
  icuLoadPct: number;
  daysToCollapse: number | null;
  factors: string[];
};

export function predictHealthcareCollapse(): CollapseRisk[] {
  const byCity = new Map<string, typeof hospitals>();
  hospitals.forEach((h) => {
    const list = byCity.get(h.city) ?? [];
    list.push(h);
    byCity.set(h.city, list);
  });

  return cityOutbreaks.map((city) => {
    const cityHospitals = byCity.get(city.name) ?? hospitals.filter((h) => h.state === city.state).slice(0, 2);
    const icuCap = cityHospitals.reduce((s, h) => s + h.icuCapacity, 0) || 100;
    const icuUsed = cityHospitals.reduce((s, h) => s + h.icuUsed, 0);
    const icuLoadPct = Math.round((icuUsed / icuCap) * 100);
    const casePressure = city.activeCases / 10000;
    const vaxProtection = city.vaccinationCoverage / 100;

    let riskScore = icuLoadPct * 0.45 + casePressure * 25 + (1 - vaxProtection) * 20;
    if (city.status === "Critical") riskScore += 15;
    riskScore = Math.min(100, Math.round(riskScore));

    const factors: string[] = [];
    if (icuLoadPct > 85) factors.push("ICU at critical capacity");
    if (city.activeCases > 15000) factors.push("High active case load");
    if (city.vaccinationCoverage < 72) factors.push("Below-target vaccination");
    if (cityHospitals.some((h) => h.oxygenLevel < 40)) factors.push("Oxygen supply strained");

    const riskLevel: CollapseRisk["riskLevel"] =
      riskScore >= 80 ? "Critical" : riskScore >= 60 ? "High" : riskScore >= 40 ? "Moderate" : "Low";

    const dailyGrowth = city.activeCases * 0.04;
    const remainingIcu = Math.max(0, icuCap - icuUsed);
    const daysToCollapse =
      riskScore >= 70 && dailyGrowth > 0
        ? Math.max(1, Math.round((remainingIcu * 8) / dailyGrowth))
        : null;

    return {
      city: city.name,
      state: city.state,
      riskScore,
      riskLevel,
      icuLoadPct,
      daysToCollapse,
      factors: factors.length ? factors : ["Within operational thresholds"],
    };
  }).sort((a, b) => b.riskScore - a.riskScore);
}

export type MobilityFlow = {
  from: string;
  to: string;
  volume: number;
  riskContribution: number;
};

export function simulateMobility(lockdownLevel: number): MobilityFlow[] {
  const G = 0.005; // Gravity constant for simulation
  const factor = 1 - lockdownLevel / 100;
  const flows: MobilityFlow[] = [];

  for (let i = 0; i < cityOutbreaks.length; i++) {
    for (let j = i + 1; j < cityOutbreaks.length; j++) {
      const a = cityOutbreaks[i];
      const b = cityOutbreaks[j];
      
      // Calculate distance in decimal degrees (approximate)
      const dist = Math.hypot(a.lat - b.lat, a.lng - b.lng);
      if (dist > 15 || dist === 0) continue;

      // Gravity Model: Flow proportional to (ActiveCasesA * ActiveCasesB) / Distance^2
      // Using ActiveCases as a proxy for 'economic/social activity' in this context
      const volume = (G * (a.activeCases * b.activeCases) / (dist * dist)) * factor;
      
      if (volume < 100) continue;

      // Risk contribution: Probability of transporting infection
      const risk = (volume / 500) * (a.status === "Critical" || b.status === "Critical" ? 2.5 : 1);

      flows.push({ 
        from: a.name, 
        to: b.name, 
        volume: Math.round(volume), 
        riskContribution: Math.round(risk) 
      });
    }
  }

  return flows
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 20);
}

export type VaccineAllocation = {
  city: string;
  state: string;
  populationWeight: number;
  outbreakWeight: number;
  recommendedDoses: number;
  priority: "P1" | "P2" | "P3";
  coverageGap: number;
};

export function optimizeVaccineDistribution(totalDoses: number): VaccineAllocation[] {
  const risks = predictHealthcareCollapse();
  const riskMap = new Map(risks.map(r => [r.city, r]));

  const weights = cityOutbreaks.map((c) => {
    const collapseRisk = riskMap.get(c.name);
    const riskScore = collapseRisk?.riskScore || 50;
    
    // Growth factor (simulated derivative)
    const growthFactor = c.status === "Critical" ? 1.5 : c.status === "High" ? 1.2 : 1.0;
    
    // Coverage gap (aiming for 90% herd immunity)
    const coverageGap = Math.max(0, 90 - c.vaccinationCoverage);
    
    // Optimization score: Risk * Growth * Gap
    const score = (riskScore / 100) * growthFactor * (coverageGap / 100) * c.activeCases;
    
    return {
      city: c.name,
      state: c.state,
      activeCases: c.activeCases,
      riskScore,
      coverageGap,
      score,
    };
  });

  const totalScore = weights.reduce((s, w) => s + w.score, 0);
  
  // Find thresholds for priority levels
  const sortedScores = [...weights].map(w => w.score).sort((a, b) => b - a);
  const p1Threshold = sortedScores[Math.min(5, sortedScores.length - 1)] || 0;
  const p2Threshold = sortedScores[Math.min(15, sortedScores.length - 1)] || 0;

  return weights
    .map((w) => ({
      city: w.city,
      state: w.state,
      populationWeight: Math.round(w.activeCases / 100),
      outbreakWeight: Math.round(w.score),
      recommendedDoses: totalScore > 0 ? Math.round((w.score / totalScore) * totalDoses) : 0,
      coverageGap: w.coverageGap,
      priority: (w.score >= p1Threshold ? "P1" : w.score >= p2Threshold ? "P2" : "P3") as VaccineAllocation["priority"],
    }))
    .sort((a, b) => b.recommendedDoses - a.recommendedDoses)
    .slice(0, 25);
}

export type Intervention = {
  id: string;
  label: string;
  enabled: boolean;
  impact: number;
};

export const defaultInterventions: Intervention[] = [
  { id: "lockdown", label: "Regional Lockdown", enabled: false, impact: -0.35 },
  { id: "masks", label: "Mask Mandate", enabled: true, impact: -0.12 },
  { id: "curfew", label: "Night Curfew", enabled: false, impact: -0.18 },
  { id: "schools", label: "School Closure", enabled: false, impact: -0.15 },
  { id: "travel", label: "Inter-state Travel Ban", enabled: false, impact: -0.28 },
  { id: "testing", label: "Mass Testing Drive", enabled: true, impact: -0.08 },
  { id: "vax", label: "Vaccination Push", enabled: true, impact: -0.2 },
];

export type InterventionImpact = {
  baselineCases: number;
  projectedCases: number;
  reductionPct: number;
  effectiveR0: number;
  hospitalizationDelta: number;
};

export function analyzeInterventions(
  baseR0: number,
  interventions: Intervention[],
  horizonDays = 30,
): InterventionImpact {
  const totalImpact = interventions
    .filter((i) => i.enabled)
    .reduce((s, i) => s + i.impact, 0);
  const effectiveR0 = Math.max(0.8, baseR0 * (1 + totalImpact));
  const baseline = runSEIR({
    population: 1_380_000_000,
    r0: baseR0,
    infectiousDays: 7,
    initialInfected: 50000,
    days: horizonDays,
  });
  const adjusted = runSEIR({
    population: 1_380_000_000,
    r0: effectiveR0,
    infectiousDays: 7,
    initialInfected: 50000,
    days: horizonDays,
    vaccinationRate: interventions.find((i) => i.id === "vax")?.enabled ? 71 : 50,
  });
  const baselineCases = baseline[baseline.length - 1].infected;
  const projectedCases = adjusted[adjusted.length - 1].infected;
  const reductionPct = Math.round(((baselineCases - projectedCases) / baselineCases) * 100);
  const hospitalizationDelta = Math.round(
    (adjusted[adjusted.length - 1].hospitalized - baseline[baseline.length - 1].hospitalized) / 1000,
  );

  return {
    baselineCases,
    projectedCases,
    reductionPct: Math.max(0, reductionPct),
    effectiveR0: Math.round(effectiveR0 * 10) / 10,
    hospitalizationDelta,
  };
}

export function computeNationalResourceLoad() {
  const totals = hospitals.reduce(
    (a, h) => ({
      icuCap: a.icuCap + h.icuCapacity,
      icuUsed: a.icuUsed + h.icuUsed,
      ventCap: a.ventCap + h.ventilators,
      ventUsed: a.ventUsed + h.ventilatorsUsed,
      ox: a.ox + h.oxygenLevel,
      bedsCap: a.bedsCap + h.beds,
      bedsUsed: a.bedsUsed + h.bedsUsed,
      med: a.med + h.medicineStock,
    }),
    { icuCap: 0, icuUsed: 0, ventCap: 0, ventUsed: 0, ox: 0, bedsCap: 0, bedsUsed: 0, med: 0 },
  );
  const n = hospitals.length;
  return {
    icu: Math.round((totals.icuUsed / totals.icuCap) * 100),
    ventilators: Math.round((totals.ventUsed / totals.ventCap) * 100),
    oxygen: Math.round(100 - totals.ox / n),
    generalWards: Math.round((totals.bedsUsed / totals.bedsCap) * 100),
    medicineStock: Math.round(totals.med / n),
  };
}

export type MedicineStatus = {
   name: string;
   demand: number;
   stock: number;
   stockDays: number;
   trend: "Rising" | "Stable" | "Falling" | "Critical";
   unit?: string;
 };

export function medicineDemand(activeCases?: number): MedicineStatus[] {
   const base = activeCases || 284000;
   return [
     { name: "Remdesivir", demand: Math.round(base * 0.12), stock: 45000, stockDays: Math.round(45000 / (base * 0.12 + 1)), trend: "Stable" },
     { name: "Favipiravir", demand: Math.round(base * 0.25), stock: 120000, stockDays: Math.round(120000 / (base * 0.25 + 1)), trend: "Rising" },
     { name: "Dexamethasone", demand: Math.round(base * 0.08), stock: 85000, stockDays: Math.round(85000 / (base * 0.08 + 1)), trend: "Stable" },
     { name: "Tocilizumab", demand: Math.round(base * 0.02), stock: 2400, stockDays: Math.round(2400 / (base * 0.02 + 1)), trend: "Critical" },
     { name: "Medical Oxygen", demand: Math.round(base * 0.35), stock: 280000, stockDays: Math.round(280000 / (base * 0.35 + 1)), trend: "Rising", unit: "MT" },
   ];
 }

export type EmergencyScenario = {
  id: string;
  name: string;
  severity: "RED" | "AMBER" | "GREEN";
  status: "Active" | "Draft" | "Completed";
  zones: number;
  resourcesDeployed: string;
  leadAgency: string;
  actions: { task: string; owner: string; eta: string; done: boolean }[];
};

export const emergencyScenarios: EmergencyScenario[] = [
  {
    id: "s1",
    name: "Mumbai Metro ICU Surge Response",
    severity: "RED",
    status: "Active",
    zones: 3,
    resourcesDeployed: "240 ICU beds, 80 ventilators, 12 MT oxygen",
    leadAgency: "NDRF + State Health Dept",
    actions: [
      { task: "Activate field hospitals in Navi Mumbai", owner: "MH Health Sec", eta: "6h", done: true },
      { task: "Reroute oxygen convoys from Pune", owner: "Logistics Cell", eta: "4h", done: true },
      { task: "Deploy 50 mobile ICU units", owner: "NDRF", eta: "12h", done: false },
      { task: "Restrict non-essential gatherings", owner: "District Collector", eta: "2h", done: false },
    ],
  },
  {
    id: "s2",
    name: "Delhi NCR Medicine Supply Chain",
    severity: "AMBER",
    status: "Active",
    zones: 2,
    resourcesDeployed: "48h Remdesivir buffer, 200k test kits",
    leadAgency: "MoHFW Central Desk",
    actions: [
      { task: "Release strategic medicine reserve", owner: "CDSCO", eta: "8h", done: true },
      { task: "Coordinate private hospital allocations", owner: "Delhi DM", eta: "24h", done: false },
      { task: "Open 24/7 pharmacy helpline", owner: "NDMC", eta: "6h", done: true },
    ],
  },
  {
    id: "s3",
    name: "Chennai Coastal Evacuation & Triage",
    severity: "AMBER",
    status: "Draft",
    zones: 1,
    resourcesDeployed: "Planning phase",
    leadAgency: "TN Disaster Mgmt",
    actions: [
      { task: "Map alternate care facilities", owner: "TN Health", eta: "48h", done: false },
      { task: "Pre-position ambulances at corridors", owner: "108 Services", eta: "24h", done: false },
    ],
  },
];

export function simulateCitySpread(cities: CityOutbreak[], spreadRate: number, day: number) {
  const factor = spreadRate / 5;
  const wave = Math.sin(day / 4) * 0.15 + 1;
  return cities.map((c) => {
    const mult =
      (c.status === "Critical" ? 1.4 : c.status === "High" ? 1.2 : 1) *
      factor *
      wave *
      (1 + day * 0.02);
    return {
      ...c,
      simCases: Math.round(c.activeCases * mult),
      simHospitalized: Math.round(c.hospitalized * mult * 0.9),
    };
  });
}
