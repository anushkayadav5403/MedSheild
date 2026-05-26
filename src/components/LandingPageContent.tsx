import { Link } from "@tanstack/react-router";
import { Activity, Shield, Zap, Globe, ArrowRight, Github, Bot, Map, IdCard, Hospital, Stethoscope, Syringe, WifiOff } from "lucide-react";

export function LandingPageContent() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#031B1D] overflow-x-hidden selection:bg-teal selection:text-white font-sans">
      {/* Navigation */}
      <nav className="h-20 flex items-center justify-between px-8 md:px-16 border-b border-black/5 sticky top-0 bg-[#F5F3EF]/80 backdrop-blur-md z-[1000] animate-fade-in">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="h-10 w-10 bg-[#031B1D] rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-500">
            <Shield className="h-6 w-6 text-teal" />
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight group-hover:text-teal transition-colors">MedShield</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest opacity-60">
          <a href="#features" className="hover:opacity-100 hover:text-teal transition-all">Intelligence</a>
          <a href="#reach" className="hover:opacity-100 hover:text-teal transition-all">Global Reach</a>
          <a href="#tech" className="hover:opacity-100 hover:text-teal transition-all">Protocol</a>
        </div>
        <Link 
          to="/dashboard" 
          className="bg-[#031B1D] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:scale-105 hover:shadow-xl hover:shadow-teal/20 transition-all duration-300"
        >
          Access OS
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="px-8 md:px-16 py-24 md:py-40 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal/5 rounded-full blur-[150px] -z-10 animate-pulse" />
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal/10 border border-teal/20 text-teal text-[10px] font-bold uppercase tracking-[0.2em] mb-8 animate-scale-in">
          <Zap className="h-3.5 w-3.5 fill-current animate-pulse" />
          MedShield Biosecurity Protocol v4.0
        </div>
        
        <h1 className="font-display font-extrabold text-6xl md:text-9xl tracking-tight leading-[0.85] max-w-5xl mb-10 animate-slide-up stagger-1">
          Survive the <span className="text-teal relative inline-block">Unthinkable.<span className="absolute bottom-4 left-0 w-full h-3 bg-teal/10 -z-10 animate-progress-fill"></span></span>
        </h1>
        
        <p className="text-xl md:text-2xl text-[#031B1D]/60 max-w-3xl mb-14 animate-slide-up stagger-2 leading-relaxed font-medium">
          The ultimate medical intelligence platform. Real-time outbreak forecasting, 
          resource logistics, and AI-driven clinical guidance at global scale.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-6 animate-slide-up stagger-3">
          <Link 
            to="/dashboard" 
            className="group bg-[#031B1D] text-white px-12 py-6 rounded-2xl font-display font-bold text-xl flex items-center gap-3 hover:shadow-2xl hover:shadow-teal/30 transition-all active:scale-[0.98] animate-float"
          >
            Launch Command Center
            <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
          </Link>
          <a 
            href="#features" 
            className="px-12 py-6 rounded-2xl font-display font-bold text-xl border border-black/10 hover:bg-black/5 hover:border-black/20 transition-all flex items-center gap-3"
          >
            Explore Intelligence
          </a>
        </div>
      </section>

      {/* Real-time Ticker */}
      <div className="bg-[#031B1D] py-4 overflow-hidden border-y border-white/5">
        <div className="flex whitespace-nowrap animate-shimmer" style={{ animationDuration: '30s', animationTimingFunction: 'linear' }}>
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-8 mx-8">
              <span className="text-teal font-mono text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
                Live Node: New Delhi / Active
              </span>
              <span className="text-white/30 font-mono text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                Alert Level: Orange
              </span>
              <span className="text-white/30 font-mono text-xs font-bold uppercase tracking-widest">
                Data Sync: 100% Verified
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <section id="reach" className="px-8 md:px-16 py-32 bg-[#031B1D] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal/10 rounded-full blur-[100px] -z-0" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-6xl mx-auto relative z-10">
          {[
            { label: "Real-time Districts", val: "700+", icon: Globe, desc: "District-level monitoring across all Indian states" },
            { label: "System Uptime", val: "99.99%", icon: Zap, desc: "Redundant node clusters for zero-failure response" },
            { label: "Clinical Response", val: "1.2s", icon: Activity, desc: "Latency-free AI triage and resource allocation" },
          ].map((s, i) => (
            <div key={i} className={`flex flex-col items-center text-center group animate-slide-up stagger-${i + 1}`}>
              <div className="h-20 w-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 group-hover:border-teal/50 group-hover:bg-teal/10 transition-all duration-500 group-hover:scale-110">
                <s.icon className="h-10 w-10 text-teal" />
              </div>
              <div className="font-display font-extrabold text-5xl mb-4 group-hover:text-teal transition-colors tracking-tight">{s.val}</div>
              <div className="text-sm uppercase tracking-[0.2em] text-white/40 font-bold mb-3">{s.label}</div>
              <p className="text-xs text-white/30 font-medium leading-relaxed max-w-[200px]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="px-8 md:px-16 py-40 max-w-7xl mx-auto">
        <div className="text-center mb-32 animate-fade-in">
          <div className="text-teal font-mono text-xs font-black uppercase tracking-[0.3em] mb-4">Core Capabilities</div>
          <h2 className="font-display font-extrabold text-5xl md:text-7xl tracking-tighter mb-6 leading-none">Intelligence Protocol</h2>
          <p className="text-[#031B1D]/50 font-medium text-lg max-w-2xl mx-auto leading-relaxed">
            MedShield integrates six critical domains of pandemic biosecurity into a single, unified operating system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {[
            { 
              title: "Dr. MedShield AI", 
              desc: "Medical assistant powered by Llama 3.3 for symptom triage, clinical guidance, and live outbreak intelligence.", 
              icon: Bot,
              color: "purple" 
            },
            { 
              title: "Geospatial Discovery", 
              desc: "Global facility intelligence using OSM and Overpass API. Neon markers for hospitals, clinics, and pharmacies.", 
              icon: Map,
              color: "teal" 
            },
            { 
              title: "Health Passport", 
              desc: "9-chapter digital medical identity. Secure sync of allergies, history, and vaccinations to the cloud.", 
              icon: IdCard,
              color: "blue" 
            },
            { 
              title: "Resource Intel", 
              desc: "Real-time monitoring of ICU beds, ventilators, and oxygen levels with semantic demand forecasting.", 
              icon: Hospital,
              color: "red" 
            },
            { 
              title: "Symptom Reporting", 
              desc: "Citizen-led symptom tracking with AI risk probability analysis for early outbreak detection.", 
              icon: Stethoscope,
              color: "orange" 
            },
            { 
              title: "Vaccination Hub", 
              desc: "Live CoWIN API integration for real-time slot booking and state-level coverage visualization.", 
              icon: Syringe,
              color: "green" 
            },
            { 
              title: "Offline Crisis Mode", 
              desc: "Local-first persistence architecture. Access saved facilities and medical records during network failure.", 
              icon: WifiOff,
              color: "severe" 
            },
          ].map((f, i) => (
            <div key={i} className={`panel group cursor-default p-10 hover:shadow-2xl hover:shadow-teal/5 transition-all duration-500 animate-slide-up stagger-${(i % 3) + 1} border-white/5`}>
              <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:bg-teal/10 transition-colors border border-white/10 group-hover:border-teal/30">
                <f.icon className={`h-8 w-8 text-[var(--${f.color})] group-hover:scale-110 transition-transform duration-500`} />
              </div>
              <h3 className="font-display font-bold text-2xl mb-4 text-white group-hover:text-teal transition-colors tracking-tight">{f.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed group-hover:text-white/80 transition-colors font-medium">{f.desc}</p>
              <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                <span className="text-[10px] font-mono font-black text-white/20 uppercase tracking-widest">Protocol Active</span>
                <div className="h-1.5 w-1.5 rounded-full bg-teal animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer id="tech" className="px-8 md:px-16 py-32 border-t border-black/5 bg-white/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-16 mb-24">
            <div className="max-w-xs">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="h-8 w-8 text-teal" />
                <span className="font-display font-extrabold text-3xl tracking-tight">MedShield</span>
              </div>
              <p className="text-sm text-[#031B1D]/50 leading-relaxed font-medium">
                The global standard for pandemic biosecurity and medical intelligence. Built for a resilient future.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-12 md:gap-24">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 opacity-30">Platform</div>
                <div className="flex flex-col gap-4 text-sm font-bold opacity-60">
                  <Link to="/dashboard" className="hover:text-teal hover:translate-x-1 transition-all">Command</Link>
                  <Link to="/map" className="hover:text-teal hover:translate-x-1 transition-all">Crisis Map</Link>
                  <Link to="/intelligence" className="hover:text-teal hover:translate-x-1 transition-all">AI Intelligence</Link>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 opacity-30">Identity</div>
                <div className="flex flex-col gap-4 text-sm font-bold opacity-60">
                  <Link to="/passport" className="hover:text-teal hover:translate-x-1 transition-all">Health Passport</Link>
                  <Link to="/settings" className="hover:text-teal hover:translate-x-1 transition-all">Profile</Link>
                  <Link to="/offline" className="hover:text-teal hover:translate-x-1 transition-all">Offline Mode</Link>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-6 opacity-30">Legal</div>
                <div className="flex flex-col gap-4 text-sm font-bold opacity-60">
                  <a href="#" className="hover:text-teal hover:translate-x-1 transition-all">Protocol</a>
                  <a href="#" className="hover:text-teal hover:translate-x-1 transition-all">Privacy</a>
                  <a href="#" className="hover:text-teal hover:translate-x-1 transition-all">Security</a>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-12 border-t border-black/5">
            <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">
              © 2026 MedShield Biosecurity Protocol · All Nodes Active
            </div>
            <div className="flex gap-8 text-[10px] font-black uppercase tracking-[0.3em] opacity-30">
              <span>Status: Operational</span>
              <span>Encrypted: AES-256</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

