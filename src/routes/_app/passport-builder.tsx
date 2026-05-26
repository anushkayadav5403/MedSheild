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
    <div className="p-5 md:p-6 max-w-[1400px] mx-auto text-[#031B1D]">
      <div className="mb-5 flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-60">Health Passport · Profile Builder</div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl mt-1">Build Your Health Passport</h1>
          <p className="text-sm opacity-60">Complete your medical profile · {CHAPTERS.length} chapters · Saved automatically</p>
        </div>
        <button onClick={() => navigate({ to: "/passport" })} className="btn-ghost text-xs">
          ← Back to Passport
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5">
        {/* Chapter Nav */}
        <div className="panel space-y-1">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted mb-2">Progress — {progress}%</div>
          <div className="h-1 rounded-full overflow-hidden mb-4" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "var(--teal)" }} />
          </div>

          {CHAPTERS.map((ch) => {
            const Icon = ch.icon;
            const active = currentChapter === ch.id;
            const done = currentChapter > ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => setChapter(ch.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-all"
                style={
                  active
                    ? { background: "var(--teal-dim)", border: "1px solid var(--teal)", color: "var(--teal)" }
                    : done
                    ? { color: "var(--mild)", border: "1px solid transparent" }
                    : { color: "var(--mid)", border: "1px solid transparent" }
                }
              >
                <div
                  className="h-6 w-6 rounded-full grid place-items-center shrink-0 font-mono text-[10px] font-bold"
                  style={
                    active
                      ? { background: "var(--teal)", color: "#0a1220" }
                      : done
                      ? { background: "var(--mild-bg)", color: "var(--mild)" }
                      : { background: "rgba(255,255,255,0.06)", color: "var(--muted)" }
                  }
                >
                  {done ? "✓" : ch.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium truncate">{ch.title}</div>
                  <div className="text-[10px] text-muted truncate">{ch.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Chapter Content */}
        <div className="panel">
          <div className="mb-5 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted">Chapter {currentChapter} of {CHAPTERS.length}</div>
            <div className="font-display font-bold text-xl mt-1">{CHAPTERS[currentChapter - 1].title}</div>
          </div>

          <Suspense fallback={
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--teal)", borderTopColor: "transparent" }} />
            </div>
          }>
            <ChapterComponent />
          </Suspense>

          <div className="flex justify-between mt-8 pt-5 border-t" style={{ borderColor: "var(--border)" }}>
            <button
              onClick={() => setChapter(currentChapter - 1)}
              disabled={currentChapter === 1}
              className="btn-ghost flex items-center gap-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>

            {currentChapter < CHAPTERS.length ? (
              <button onClick={() => setChapter(currentChapter + 1)} className="btn-primary flex items-center gap-2 text-sm">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => navigate({ to: "/passport" })}
                className="btn-primary flex items-center gap-2 text-sm"
                disabled={!passportData.fullName}
              >
                <ClipboardCheck className="h-4 w-4" /> View Passport
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
