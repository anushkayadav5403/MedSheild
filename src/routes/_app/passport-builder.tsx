import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { usePassportStore } from "@/lib/passportStore";
import { ChevronLeft, ChevronRight, User, Droplets, AlertCircle, Heart, Pill, Phone, FileText, Syringe, ClipboardCheck } from "lucide-react";

// Lazy load each chapter to avoid loading all at once
const Chapter1 = lazy(() => import("@/components/passport/Chapter1WhoYouAre"));
const Chapter2 = lazy(() => import("@/components/passport/Chapter2Blood"));
const Chapter3 = lazy(() => import("@/components/passport/Chapter3Allergies"));
const Chapter4 = lazy(() => import("@/components/passport/Chapter4Conditions"));
const Chapter5 = lazy(() => import("@/components/passport/Chapter5Medications"));
const Chapter6 = lazy(() => import("@/components/passport/Chapter6EmergencyContacts"));
const Chapter7 = lazy(() => import("@/components/passport/Chapter7CriticalDirectives"));
const Chapter8 = lazy(() => import("@/components/passport/Chapter8Pandemic"));
const Chapter9 = lazy(() => import("@/components/passport/Chapter9Review"));

export const Route = createFileRoute("/_app/passport-builder")({
  component: PassportBuilderPage,
});

const CHAPTERS = [
  { id: 1, title: "Who You Are",        icon: User,           desc: "Basic demographics" },
  { id: 2, title: "Blood Type",         icon: Droplets,       desc: "Blood & Rh factor" },
  { id: 3, title: "Allergies",          icon: AlertCircle,    desc: "Known allergies" },
  { id: 4, title: "Conditions",         icon: Heart,          desc: "Medical history" },
  { id: 5, title: "Medications",        icon: Pill,           desc: "Current medications" },
  { id: 6, title: "Emergency Contacts", icon: Phone,          desc: "Who to call" },
  { id: 7, title: "Directives",         icon: FileText,       desc: "DNR & organ donor" },
  { id: 8, title: "Pandemic Record",    icon: Syringe,        desc: "Vaccines & tests" },
  { id: 9, title: "Review",             icon: ClipboardCheck, desc: "Final review" },
];

const CHAPTER_COMPONENTS = [Chapter1, Chapter2, Chapter3, Chapter4, Chapter5, Chapter6, Chapter7, Chapter8, Chapter9];

function PassportBuilderPage() {
  const navigate = useNavigate();
  const { currentChapter, setChapter, passportData } = usePassportStore();

  const ChapterComponent = CHAPTER_COMPONENTS[currentChapter - 1];
  const progress = Math.round((currentChapter / CHAPTERS.length) * 100);

  return (
    <div className="flex flex-col min-h-[calc(100vh-52px)] text-white animate-fade-in" style={{ background: "#050B14" }}>
      {/* Header */}
      <div className="bg-[#0A1220] border-b border-white/5 px-4 py-3 md:px-8 md:py-4 sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-teal grid place-items-center text-black shadow-[0_0_15px_rgba(0,255,209,0.3)]">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display font-black text-sm md:text-base tracking-tight">Medical Identity Builder</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="h-1 w-1 rounded-full bg-teal animate-pulse" />
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Secure AES-256 Storage</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Completion</span>
                <span className="text-[10px] font-mono font-bold text-teal">{Math.round(progress)}%</span>
              </div>
              <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-teal transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <button onClick={() => navigate({ to: "/passport" })} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              <ChevronLeft className="h-5 w-5 text-white/40" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row max-w-[1400px] mx-auto w-full overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 bg-[#0A1220]/50 border-r border-white/5 flex-shrink-0 p-4 md:p-6 space-y-1 overflow-y-auto">
          {CHAPTERS.map((ch) => {
            const Icon = ch.icon;
            const isCompleted = ch.id < currentChapter;
            const isActive = ch.id === currentChapter;
            return (
              <button
                key={ch.id}
                onClick={() => setChapter(ch.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                  isActive 
                    ? "bg-teal/10 text-teal border border-teal/20 shadow-[0_0_20px_rgba(0,255,209,0.1)]" 
                    : isCompleted 
                      ? "text-teal hover:bg-white/5" 
                      : "text-white/40 hover:bg-white/5"
                }`}
              >
                <div className={`h-6 w-6 rounded-lg grid place-items-center transition-colors ${
                  isActive ? "bg-teal text-black" : isCompleted ? "bg-teal/20 text-teal" : "bg-white/5 text-white/20"
                }`}>
                  {isCompleted ? <ClipboardCheck className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1">
                  <div className={`text-[11px] font-bold leading-none ${isActive ? "text-teal" : "text-inherit"}`}>{ch.title}</div>
                  <div className="text-[8px] font-bold uppercase tracking-widest opacity-40 mt-1">Step {ch.id}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="flex-1 p-4 md:p-10">
            <div className="max-w-2xl mx-auto">
              <div className="mb-8 animate-slide-up">
                <div className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-teal/10 text-teal font-mono text-[9px] font-black tracking-widest uppercase mb-3">
                  Section {currentChapter} of {CHAPTERS.length}
                </div>
                <h2 className="font-display font-black text-2xl md:text-3xl text-white tracking-tight">{CHAPTERS[currentChapter - 1].title}</h2>
                <p className="text-sm text-white/50 mt-2 font-medium">{CHAPTERS[currentChapter - 1].desc}</p>
              </div>
              
              <div className="animate-fade-in stagger-1">
                <Suspense fallback={
                  <div className="flex items-center justify-center py-16">
                    <div className="h-6 w-6 border-2 rounded-full animate-spin border-teal border-t-transparent" />
                  </div>
                }>
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <ChapterComponent />
                  </div>
                </Suspense>
              </div>
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="bg-[#0A1220] border-t border-white/5 p-4 md:px-10 md:py-6 sticky bottom-0 z-30">
            <div className="max-w-2xl mx-auto flex items-center justify-between">
              <button
                disabled={currentChapter === 1}
                onClick={() => setChapter(currentChapter - 1)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white/40 hover:text-teal transition-all disabled:opacity-20 uppercase tracking-widest"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              
              <div id="final-sync-portal" />

              {currentChapter < CHAPTERS.length ? (
                <button
                  onClick={() => setChapter(currentChapter + 1)}
                  className="flex items-center gap-2 px-8 py-2.5 bg-teal text-black rounded-xl font-bold text-xs hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,255,209,0.3)] uppercase tracking-widest"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={() => navigate({ to: "/passport" })}
                  className="px-6 py-2.5 rounded-xl text-white/40 hover:text-white hover:bg-white/5 font-bold text-xs transition-all uppercase tracking-widest"
                >
                  Exit without Saving
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
