import { Link } from "@tanstack/react-router";
import { Activity, Shield, Zap, Globe, ArrowRight, Github } from "lucide-react";

export function LandingPageContent() {
  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#031B1D] overflow-x-hidden selection:bg-teal selection:text-white">
      {/* Navigation */}
      <nav className="h-20 flex items-center justify-between px-8 md:px-16 border-b border-black/5 sticky top-0 bg-[#F5F3EF]/80 backdrop-blur-md z-[1000]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-[#031B1D] rounded-xl flex items-center justify-center">
            <Shield className="h-6 w-6 text-teal" />
          </div>
          <span className="font-display font-extrabold text-xl tracking-tight">MedShield</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-widest opacity-60">
          <a href="#features" className="hover:opacity-100 transition-opacity">Intelligence</a>
          <a href="#about" className="hover:opacity-100 transition-opacity">Global Reach</a>
          <a href="#tech" className="hover:opacity-100 transition-opacity">Protocol</a>
        </div>
        <Link 
          to="/dashboard" 
          className="bg-[#031B1D] text-white px-6 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-transform"
        >
          Access OS
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="px-8 md:px-16 py-24 md:py-32 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal/5 rounded-full blur-[120px] -z-10 animate-pulse" />
        
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal/10 border border-teal/20 text-teal text-[10px] font-bold uppercase tracking-[0.2em] mb-8 animate-scale-in">
          <Zap className="h-3.5 w-3.5 fill-current" />
          Next-Gen Pandemic Intelligence
        </div>
        
        <h1 className="font-display font-extrabold text-5xl md:text-8xl tracking-tight leading-[0.9] max-w-4xl mb-8 animate-slide-up stagger-1">
          Crisis Response at <span className="text-teal">Machine Speed.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-[#031B1D]/60 max-w-2xl mb-12 animate-slide-up stagger-2 leading-relaxed">
          The global operating system for pandemic surveillance, resource logistics, 
          and AI-driven outbreak forecasting. Built for the next decade of biosecurity.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 animate-slide-up stagger-3">
          <Link 
            to="/dashboard" 
            className="group bg-[#031B1D] text-white px-10 py-5 rounded-2xl font-display font-bold text-lg flex items-center gap-3 hover:shadow-2xl hover:shadow-teal/20 transition-all active:scale-[0.98] animate-float"
          >
            Launch Command Center
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a 
            href="https://github.com" 
            target="_blank"
            className="px-10 py-5 rounded-2xl font-display font-bold text-lg border border-black/10 hover:bg-black/5 transition-colors flex items-center gap-3 animate-fade-in stagger-4"
          >
            <Github className="h-5 w-5" />
            Documentation
          </a>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-8 md:px-16 py-20 bg-[#031B1D] text-white overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {[
            { label: "Real-time Districts", val: "700+", icon: Globe },
            { label: "Logistics Latency", val: "<100ms", icon: Zap },
            { label: "Forecast Accuracy", val: "94.2%", icon: Activity },
          ].map((s, i) => (
            <div key={i} className={`flex flex-col items-center text-center group animate-slide-up stagger-${i + 1}`}>
              <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 group-hover:border-teal/50 transition-colors group-hover:scale-110 duration-500">
                <s.icon className="h-8 w-8 text-teal" />
              </div>
              <div className="font-display font-extrabold text-4xl mb-2 group-hover:text-teal transition-colors">{s.val}</div>
              <div className="text-xs uppercase tracking-widest text-white/40 font-bold">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="px-8 md:px-16 py-32 max-w-7xl mx-auto">
        <div className="text-center mb-20 animate-fade-in">
          <h2 className="font-display font-extrabold text-4xl md:text-6xl tracking-tight mb-4">Tactical Intelligence Suite</h2>
          <p className="text-[#031B1D]/50 font-medium">Engineered for governments and healthcare leaders.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            { title: "SEIR Simulation", desc: "Advanced mathematical modeling of pathogen spread using real-world mobility data.", color: "teal" },
            { title: "Resource Logistics", desc: "Predictive oxygen and ICU bed allocation to prevent healthcare system collapse.", color: "red" },
            { title: "Digital Passport", desc: "Secure, QR-based medical identity for vaccination and immunity verification.", color: "blue" },
            { title: "Dr. MedShield AI", desc: "LLM-powered epidemiological assistant for rapid scenario analysis.", color: "purple" },
            { title: "Offline Protocol", desc: "Local-first architecture ensures 100% availability during network blackouts.", color: "orange" },
            { title: "Mobility Analysis", desc: "Gravity models to predict district-level transmission risk from population flow.", color: "green" },
          ].map((f, i) => (
            <div key={i} className={`panel group cursor-default animate-slide-up stagger-${(i % 3) + 1}`}>
              <div className="h-12 w-12 rounded-lg bg-white/5 flex items-center justify-center mb-6 group-hover:bg-teal/10 transition-colors">
                <div className="h-3 w-3 rounded-full animate-ping" style={{ backgroundColor: `var(--${f.color})` }} />
              </div>
              <h3 className="font-display font-bold text-xl mb-3 text-white group-hover:text-teal transition-colors">{f.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed group-hover:text-white/70 transition-colors">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 md:px-16 py-20 border-t border-black/5 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 grayscale opacity-40">
            <Shield className="h-6 w-6" />
            <span className="font-display font-extrabold text-xl tracking-tight">MedShield</span>
          </div>
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest opacity-40">
            <span>© 2026 Biosecurity Protocol</span>
            <a href="#" className="hover:text-teal transition-colors">Privacy</a>
            <a href="#" className="hover:text-teal transition-colors">Terms</a>
            <a href="#" className="hover:text-teal transition-colors">API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
