import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, AreaChart, Area, CartesianGrid } from "recharts";
import { topSymptoms } from "@/lib/mockData";
import { OutbreakClusterDetection } from "@/components/OutbreakClusterDetection";
import { toast } from "sonner";
import { usePassportStore } from "@/lib/passportStore";
import { fetchNationalStats } from "@/lib/realDataService";
import { 
  ClipboardCheck, 
  Activity, 
  Stethoscope, 
  AlertCircle, 
  Thermometer, 
  Wind, 
  Brain, 
  AlertOctagon, 
  ShieldAlert, 
  HeartPulse,
  Info,
  ChevronRight,
  ArrowRight,
  UserCheck,
  TrendingUp,
  Bot
} from "lucide-react";

export const Route = createFileRoute("/_app/symptoms")({
  component: SymptomsPage,
});

interface Symptom {
  id: string;
  label: string;
  icon: any;
  severity: "mild" | "moderate" | "severe";
  description: string;
}

const SYMPTOMS_DATA: Symptom[] = [
  { id: "fever", label: "Fever", icon: Thermometer, severity: "mild", description: "Body temp > 38°C (100.4°F)" },
  { id: "cough", label: "Dry Cough", icon: Activity, severity: "mild", description: "Persistent non-productive cough" },
  { id: "breath", label: "Shortness of Breath", icon: Wind, severity: "moderate", description: "Difficulty breathing during activity" },
  { id: "fatigue", label: "Severe Fatigue", icon: Activity, severity: "mild", description: "Extreme tiredness or exhaustion" },
  { id: "smell", label: "Loss of Smell/Taste", icon: Stethoscope, severity: "mild", description: "Anosmia or ageusia" },
  { id: "headache", label: "Severe Headache", icon: Brain, severity: "mild", description: "Intense, persistent head pain" },
  { id: "chest", label: "Chest Pain/Pressure", icon: HeartPulse, severity: "severe", description: "Persistent pain or pressure in chest" },
  { id: "confusion", label: "New Confusion", icon: AlertOctagon, severity: "severe", description: "Inability to wake or stay awake" },
  { id: "bluish", label: "Bluish Lips/Face", icon: ShieldAlert, severity: "severe", description: "Indicates low blood oxygen levels" },
];

const TREND_DATA = [
  { day: "D-6", reports: 120, severity: 45 },
  { day: "D-5", reports: 145, severity: 48 },
  { day: "D-4", reports: 190, severity: 52 },
  { day: "D-3", reports: 240, severity: 58 },
  { day: "D-2", reports: 310, severity: 65 },
  { day: "D-1", reports: 450, severity: 72 },
  { day: "Today", reports: 580, severity: 85 },
];

function computeProbability(selected: Set<string>) {
  if (selected.size === 0) return [];
  
  const variants = [
    { name: "Delta-X Variant", base: 45, symptoms: ["fever", "cough", "breath", "chest"] },
    { name: "Omicron-7", base: 35, symptoms: ["fever", "headache", "fatigue", "smell"] },
    { name: "Influenza-B", base: 20, symptoms: ["fever", "cough", "headache"] },
  ];

  return variants.map(v => {
    const matchCount = v.symptoms.filter(id => selected.has(id)).length;
    const prob = Math.min(98, Math.round((matchCount / v.symptoms.length) * 85 + (selected.size * 2)));
    return {
      name: v.name,
      status: prob > 70 ? "High Match" : prob > 40 ? "Moderate Match" : "Low Match",
      prob: prob
    };
  }).sort((a, b) => b.prob - a.prob);
}

function SymptomsPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => setIsMounted(true), []);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const results = useMemo(() => computeProbability(selected), [selected]);

  const triageLevel = useMemo(() => {
    const hasSevere = SYMPTOMS_DATA.some(s => s.severity === "severe" && selected.has(s.id));
    const hasModerate = SYMPTOMS_DATA.some(s => s.severity === "moderate" && selected.has(s.id));
    
    if (hasSevere) return { level: "CRITICAL", color: "var(--severe)", action: "EMERGENCY: Call 112 Immediately", desc: "Life-threatening symptoms detected. Do not wait." };
    if (hasModerate) return { level: "URGENT", color: "var(--moderate)", action: "URGENT: Visit Nearest ER", desc: "Moderate respiratory distress. Clinical evaluation required." };
    if (selected.size > 0) return { level: "MONITOR", color: "var(--teal)", action: "Home Isolation & Monitoring", desc: "Mild symptoms. Rest and monitor oxygen/temp levels." };
    return null;
  }, [selected]);

  return (
    <div className="p-5 md:p-8 max-w-[1400px] mx-auto space-y-8 text-foreground animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 animate-slide-up stagger-1">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-teal font-bold mb-1">
            Clinical Diagnostic Suite
          </div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight text-[#031B1D]">Symptom Intelligence</h1>
          <p className="text-sm text-[#031B1D]/50 mt-2 max-w-xl font-medium">
            AI-driven epidemiological assessment. Analyze individual health markers against real-time local variant patterns and transmission clusters.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <div className="text-[10px] font-bold text-[#031B1D]/40 uppercase tracking-widest">Protocol Version</div>
            <div className="text-xs font-mono font-bold text-[#031B1D]">v4.2.0-BIO</div>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-[#031B1D] grid place-items-center shadow-xl">
            <Stethoscope className="h-6 w-6 text-teal" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
        <div className="space-y-8">
          {/* Triage Alert Section */}
          {triageLevel && (
            <div className="animate-scale-in">
              <div 
                className="p-6 rounded-2xl border-2 flex flex-col md:flex-row items-center gap-6 relative overflow-hidden group transition-all duration-500"
                style={{ borderColor: `${triageLevel.color}40`, background: `${triageLevel.color}08` }}
              >
                <div className="absolute top-0 left-0 w-1 h-full" style={{ background: triageLevel.color }} />
                <div 
                  className="h-16 w-16 rounded-2xl grid place-items-center shrink-0 shadow-2xl animate-pulse-fast"
                  style={{ background: `${triageLevel.color}20`, color: triageLevel.color }}
                >
                  <AlertCircle className="h-8 w-8" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: triageLevel.color }}>{triageLevel.level} Protocol</span>
                    <div className="h-1 w-1 rounded-full bg-white/20" />
                    <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Immediate Action Required</span>
                  </div>
                  <h2 className="text-2xl font-display font-black text-white mb-2">{triageLevel.action}</h2>
                  <p className="text-sm text-white/60 font-medium">{triageLevel.desc}</p>
                </div>
                <Link to="/map" className="px-6 py-3 bg-white text-black font-display font-bold text-sm rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl">
                  Find Emergency Care
                </Link>
              </div>
            </div>
          )}

          <div className="panel border-white/5 animate-slide-up stagger-2">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="font-display font-bold text-xl text-white flex items-center gap-3">
                  <ClipboardCheck className="h-6 w-6 text-teal" />
                  Clinical Indicator Analysis
                </div>
                <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">Select all observed symptoms for analysis</div>
              </div>
              {selected.size > 0 && (
                <button 
                  onClick={() => setSelected(new Set())}
                  className="text-[10px] font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {SYMPTOMS_DATA.map((s) => {
                const isActive = selected.has(s.id);
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => toggle(s.id)}
                    className={`flex flex-col p-5 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden group ${
                      isActive
                        ? "bg-teal/10 border-teal shadow-[0_0_20px_rgba(0,255,255,0.1)]"
                        : "bg-white/5 border-white/5 hover:border-white/10"
                    }`}
                  >
                    {s.severity === "severe" && (
                      <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    )}
                    <div className={`h-10 w-10 rounded-xl grid place-items-center mb-4 transition-all ${
                      isActive ? "bg-teal text-black scale-110" : "bg-white/5 text-white/40 group-hover:text-white"
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className={`text-sm font-bold mb-1 ${isActive ? "text-white" : "text-white/70 group-hover:text-white"}`}>{s.label}</div>
                    <div className="text-[10px] text-white/40 font-medium leading-tight line-clamp-2">{s.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="panel border-white/5 animate-slide-up stagger-3">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="font-display font-bold text-xl text-white">AI Probability Hub</div>
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">Variant matching analysis</div>
                </div>
                <Brain className="h-5 w-5 text-purple-500" />
              </div>

              {selected.size === 0 ? (
                <div className="py-16 text-center">
                  <Activity className="h-8 w-8 text-white/5 mx-auto mb-4" />
                  <div className="text-[10px] text-white/20 font-black uppercase tracking-[0.3em]">Awaiting Input Data</div>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  {results.map((r) => (
                    <div key={r.name} className="space-y-2 group">
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-sm font-bold text-white group-hover:text-teal transition-colors">{r.name}</div>
                          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{r.status}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-mono font-black text-white">{r.prob}%</div>
                          <div className="text-[9px] font-bold text-white/20 uppercase">Confidence</div>
                        </div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden p-[2px]">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 animate-progress-fill"
                          style={{ 
                            width: `${r.prob}%`, 
                            background: r.prob > 70 ? "var(--severe)" : r.prob > 40 ? "var(--moderate)" : "var(--mild)" 
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="panel border-white/5 animate-slide-up stagger-4 overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <div className="font-display font-bold text-xl text-white">Regional Symptom Trends</div>
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">Local district reporting (7d)</div>
                </div>
                <TrendingUp className="h-5 w-5 text-teal" />
              </div>
              <div className="h-[200px] w-full mt-4">
                <ResponsiveContainer>
                  <AreaChart data={TREND_DATA}>
                    <defs>
                      <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--teal)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--teal)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 700 }} />
                    <Tooltip 
                      contentStyle={{ background: "#061d1d", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                      itemStyle={{ color: "var(--teal)", fontWeight: 800, fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="reports" stroke="var(--teal)" strokeWidth={3} fillOpacity={1} fill="url(#trendGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-between mt-6 pt-6 border-t border-white/5">
                <div className="text-center">
                  <div className="text-lg font-mono font-black text-white">580</div>
                  <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Today's Reports</div>
                </div>
                <div className="text-center border-x border-white/5 px-8">
                  <div className="text-lg font-mono font-black text-teal">+42%</div>
                  <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Growth Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-mono font-black text-red-500">85%</div>
                  <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest">Severity Index</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 animate-slide-up stagger-5">
          <div className="panel bg-white/5 border-white/5">
            <div className="font-display font-bold text-lg mb-6 text-white flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-teal" />
              Pre-Clinical Protocols
            </div>
            <div className="space-y-6">
              {[
                { 
                  t: "Isolation Protocol", 
                  d: "Mandatory home isolation for 7 days if symptomatic. Use a separate room and bathroom.", 
                  icon: ShieldAlert,
                  c: "var(--severe)" 
                },
                { 
                  t: "Vital Monitoring", 
                  d: "Track SpO2 and body temperature every 4 hours. Record in Health Passport.", 
                  icon: HeartPulse,
                  c: "var(--moderate)" 
                },
                { 
                  t: "Hydration & Nutrition", 
                  d: "High fluid intake and balanced diet. Monitor for signs of dehydration.", 
                  icon: Info,
                  c: "var(--teal)" 
                },
                { 
                  t: "Digital Triage", 
                  d: "Contact Dr. MedShield AI for persistent or worsening symptoms.", 
                  icon: Bot,
                  c: "var(--purple)" 
                },
              ].map(item => (
                <div key={item.t} className="group cursor-default">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                      <item.icon className="h-4 w-4" style={{ color: item.c }} />
                    </div>
                    <div className="text-[11px] font-black uppercase tracking-widest text-white/90">{item.t}</div>
                  </div>
                  <div className="text-xs text-white/40 leading-relaxed pl-11 font-medium group-hover:text-white/60 transition-colors">{item.d}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel border-white/5 bg-gradient-to-br from-teal/20 to-transparent">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-10 w-10 rounded-xl bg-teal grid place-items-center shadow-lg shadow-teal/20">
                <Brain className="h-5 w-5 text-black" />
              </div>
              <div>
                <div className="text-xs font-bold text-white leading-tight">Consult Dr. MedShield</div>
                <div className="text-[10px] text-white/50 font-medium">Real-time Clinical AI</div>
              </div>
            </div>
            <p className="text-xs text-white/70 leading-relaxed mb-6 font-medium">
              Need more specific guidance? Our medical AI can analyze your symptoms against your personal Health Passport history.
            </p>
            <Link to="/dr-sentinel" className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2">
              Start Consultation <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <div className="flex gap-3 items-start">
              <AlertOctagon className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Medical Disclaimer</div>
                <p className="text-[10px] text-red-400/60 leading-relaxed font-medium">
                  This system is for informational purposes only. It does not replace professional medical advice, diagnosis, or treatment. 
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

