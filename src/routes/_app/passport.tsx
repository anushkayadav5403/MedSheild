import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { myPassport } from "@/lib/mockData";
import { usePassportStore } from "@/lib/passportStore";
import { useAuth } from "@/lib/useAuth";
import { savePassportToFirestore, loadPassportFromFirestore } from "@/lib/passportFirestore";
import { AuthModal } from "@/components/AuthModal";
import {
  Syringe, Phone, ShieldCheck, AlertCircle, Calendar,
  CheckCircle2, Edit, CloudUpload, LogIn, UserPlus,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/passport")({
  component: PassportPage,
});

function PassportPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [days, setDays] = useState<("none" | "ok" | "mild" | "bad")[]>([
    "ok", "ok", "ok", "mild", "ok", "ok", "none",
  ]);
  const [temp, setTemp] = useState("36.8");
  const [symptoms, setSymptoms] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const { passportData, updatePassportData, resetPassport } = usePassportStore();
  const { user, loading } = useAuth();

  useEffect(() => {
    async function syncFromCloud() {
      if (user?.uid && !passportData.fullName) {
        try {
          const cloudData = await loadPassportFromFirestore(user.uid);
          if (cloudData) {
            updatePassportData(cloudData);
            toast.success("Profile synced from cloud");
          }
        } catch (e) {
          console.error("Cloud sync failed:", e);
        }
      }
    }
    syncFromCloud();
  }, [user?.uid]);

  // A passport is "custom" if it has any meaningful data or if the user is logged in
  const hasCustomPassport = !!(passportData.fullName || passportData.bloodType || passportData.allergyDetails?.length || passportData.vaccinations?.length || user);
  
  const scanUid = user?.uid;
  const scanUrl = scanUid && typeof window !== "undefined"
    ? `${window.location.origin}/passport/scan/${scanUid}`
    : "";

  const name = passportData.fullName || (user?.displayName || "Anonymous User");
  
  const bloodType = (passportData.bloodType && passportData.bloodType !== "unknown")
    ? `${passportData.bloodType}${passportData.rhFactor === "positive" ? "+" : passportData.rhFactor === "negative" ? "-" : ""}`
    : (hasCustomPassport ? "—" : myPassport.bloodType);

  const dob = passportData.dateOfBirth;
  const age = dob ? Math.floor((new Date().getTime() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : (hasCustomPassport ? null : myPassport.age);

  const allergies = hasCustomPassport 
    ? (passportData.allergyDetails?.map(a => a.name) || passportData.allergies || [])
    : myPassport.allergies;

  const score = computeScore(passportData, hasCustomPassport);

  useEffect(() => {
    // No longer using myPassport demo fallback for QR code
    if (hasCustomPassport && scanUrl && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, scanUrl, {
        width: 200, margin: 1,
        color: { dark: "#0a1220", light: "#ffffff" },
      });
    }
  }, [scanUrl, hasCustomPassport]);

  function handleBuildProfile() {
    if (!user) {
      setShowAuthModal(true);
    } else {
      resetPassport();
      navigate({ to: "/passport-builder" });
    }
  }

  function handleAuthSuccess() {
    setShowAuthModal(false);
    resetPassport();
    navigate({ to: "/passport-builder" });
  }

  async function handleSaveToCloud() {
    if (!user) { toast.error("Sign in first to save your passport"); return; }
    setSaving(true);
    try {
      await savePassportToFirestore(user.uid, { ...passportData, qrCodeId: user.uid });
      toast.success("Passport saved to cloud ✓");
    } catch {
      toast.error("Failed to save — check your Firebase config");
    } finally {
      setSaving(false);
    }
  }

  function toggle(s: string) {
    setSymptoms((prev) => {
      const n = new Set(prev);
      n.has(s) ? n.delete(s) : n.add(s);
      return n;
    });
  }

  function submitCheckIn() {
    const t = parseFloat(temp);
    const status: "ok" | "mild" | "bad" =
      symptoms.size === 0 && t < 37.5 ? "ok"
      : symptoms.has("Breathlessness") || t >= 38.5 ? "bad"
      : "mild";
    setDays((d) => [...d.slice(0, 6), status]);
    setShowCheckIn(false);
    setSymptoms(new Set());
  }

  // Loading state while checking auth
  if (loading) {
    return (
      <div className="p-5 md:p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-teal rounded-full animate-spin border-t-transparent mx-auto" style={{ borderColor: "var(--teal)", borderTopColor: "transparent" }} />
          <p className="text-sm text-mid">Loading passport...</p>
        </div>
      </div>
    );
  }

  // Not signed in and no passport → show sign-in prompt
  if (!user && !hasCustomPassport) {
    return (
      <div className="p-5 md:p-6 max-w-[600px] mx-auto text-[#031B1D]">
        <div className="mb-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-60">Health Passport · Medical Identity</div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl mt-1">Crisis Health Passport</h1>
          <p className="text-sm opacity-60">Your medical identity for pandemic response · QR-shareable · Offline-ready</p>
        </div>

        <div
          className="rounded-2xl p-8 text-center space-y-6"
          style={{ background: "linear-gradient(150deg, #111e30 0%, #0d1829 60%, #0a1220 100%)", border: "1px solid var(--border-bright)" }}
        >
          <div
            className="h-20 w-20 rounded-full grid place-items-center mx-auto"
            style={{ background: "var(--teal-dim)", border: "2px solid var(--teal)" }}
          >
            <UserPlus className="h-10 w-10" style={{ color: "var(--teal)" }} />
          </div>

          <div>
            <h2 className="font-display font-extrabold text-xl mb-2">Build Your Health Passport</h2>
            <p className="text-sm text-mid">
              Create a secure digital health profile with your medical information, vaccinations, and emergency contacts.
              Generate a QR code that healthcare providers can scan in emergencies.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleBuildProfile}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm"
            >
              <LogIn className="h-4 w-4" />
              Sign In & Build Passport
            </button>
            <p className="text-[11px] text-muted">
              Sign in with Google or email to save your passport securely to the cloud
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
            {[
              { icon: "🔒", label: "Secure & Private" },
              { icon: "📱", label: "QR Code Access" },
              { icon: "🏥", label: "Emergency Ready" },
            ].map((f) => (
              <div key={f.label} className="text-center">
                <div className="text-2xl mb-1">{f.icon}</div>
                <div className="text-[10px] text-muted font-mono">{f.label}</div>
              </div>
            ))}
          </div>
        </div>

        {showAuthModal && (
          <AuthModal
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        )}
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 max-w-[1400px] mx-auto text-[#031B1D]">
      {/* Header */}
      <div className="mb-5 flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-60">Health Passport · Medical Identity</div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl mt-1">Crisis Health Passport</h1>
          <p className="text-sm opacity-60">Your medical identity for pandemic response · QR-shareable · Offline-ready</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {user && hasCustomPassport && (
            <button onClick={handleSaveToCloud} disabled={saving} className="btn-ghost text-xs flex items-center gap-1.5 py-2 px-3">
              <CloudUpload className="h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save to Cloud"}
            </button>
          )}
          <button onClick={handleBuildProfile} className="btn-primary text-xs flex items-center gap-1.5 py-2 px-3">
            <Edit className="h-3.5 w-3.5" />
            {hasCustomPassport ? "Edit Profile" : "Build Full Profile"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* PASSPORT CARD */}
        <div className="lg:col-span-1">
          <div
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: "linear-gradient(150deg, #111e30 0%, #0d1829 60%, #0a1220 100%)", border: "1px solid var(--border-bright)" }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="font-mono text-[9px] text-muted uppercase tracking-widest">MedShield · IN</div>
                <div className="font-display font-extrabold text-xl mt-1 leading-tight">{name}</div>
                <div className="text-xs text-mid">
                  {age !== null ? `${age} yrs` : "Age unknown"} · Citizen
                </div>
              </div>
              <div
                className="h-11 w-11 rounded-full grid place-items-center font-display font-extrabold text-white text-lg"
                style={{ background: "var(--red)", boxShadow: "0 0 20px var(--red-glow)" }}
              >
                {bloodType}
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-4">
              {(hasCustomPassport ? passportData.vaccinations?.length ?? 0 : myPassport.doses.length) >= 1 && (
                <span className="text-[10px] font-bold font-mono px-2 py-1 rounded-md flex items-center gap-1" style={{ background: "var(--mild-bg)", color: "var(--mild)", border: "1px solid var(--mild)" }}>
                  <Syringe className="h-3 w-3" />
                  VACCINATED · {hasCustomPassport ? passportData.vaccinations?.length : myPassport.doses.length} DOSES
                </span>
              )}
              {allergies.length > 0 && (
                <span className="text-[10px] font-bold font-mono px-2 py-1 rounded-md flex items-center gap-1" style={{ background: "var(--red-dim)", color: "var(--red)", border: "1px solid var(--red)" }}>
                  <AlertCircle className="h-3 w-3" /> ALLERGY
                </span>
              )}
            </div>

            <div className="bg-white rounded-lg p-3 grid place-items-center relative">
              {hasCustomPassport && user ? (
                <QRCodeCanvas value={scanUrl} size={200} level="H" />
              ) : (
                <div className="h-[200px] w-[200px] bg-neutral-100 flex flex-col items-center justify-center text-center p-4">
                  <AlertCircle className="h-8 w-8 text-neutral-400 mb-2" />
                  <div className="text-[10px] text-neutral-500 font-mono">PASSPORT NOT SYNCED</div>
                  <div className="text-[8px] text-neutral-400 mt-1">Complete profile and sign in to generate QR code</div>
                </div>
              )}
            </div>
            <div className="text-center font-mono text-[10px] text-muted mt-2 truncate">{scanUrl || "Not Generated"}</div>

            {!hasCustomPassport ? (
              <div className="mt-4 rounded-md p-2.5 text-center" style={{ background: "var(--red-dim)", border: "1px solid var(--red)" }}>
                <div className="font-mono text-[10px] text-red font-bold tracking-wider">⚠ PROFILE INCOMPLETE</div>
                <div className="text-[10px] text-mid mt-0.5">Start the builder to create your passport</div>
              </div>
            ) : !user ? (
              <div className="mt-4 rounded-md p-2.5 text-center" style={{ background: "var(--moderate-bg)", border: "1px solid var(--moderate)" }}>
                <div className="font-mono text-[10px] text-moderate font-bold tracking-wider">⚠ NOT SYNCED</div>
                <div className="text-[10px] text-mid mt-0.5">Sign in to save your passport to the cloud</div>
              </div>
            ) : (
              <div className="mt-4 rounded-md p-2.5 text-center" style={{ background: "var(--mild-bg)", border: "1px solid var(--mild)" }}>
                <div className="font-mono text-[10px] text-mild font-bold tracking-wider">✓ PANDEMIC READY</div>
                <div className="text-[10px] text-mid mt-0.5">Synced to cloud · Scan-ready</div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[10px] uppercase tracking-wider text-muted">Pandemic Readiness</span>
                <span className="font-mono font-extrabold text-teal text-xl leading-none">{score}%</span>
              </div>
              <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="h-full transition-all duration-700" style={{ width: `${score}%`, background: "var(--teal)" }} />
              </div>
            </div>

            {user && (
              <div className="mt-3 text-center font-mono text-[9px]" style={{ color: "var(--teal)" }}>
                ● {user.displayName || user.email?.split("@")[0]}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 space-y-5">
          <div className="panel">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-display font-bold text-lg">Vaccination Record</div>
                <div className="text-[10px] text-muted font-mono uppercase tracking-widest">CoWIN-verified dose history</div>
              </div>
              <button className="btn-secondary text-[11px] py-1.5 px-3">Sync with CoWIN</button>
            </div>

            <div className="space-y-3">
              {hasCustomPassport ? (
                passportData.vaccinations?.length ? (
                  passportData.vaccinations.map((v, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-md bg-white/[0.03] border border-white/[0.05]">
                      <div className="h-10 w-10 rounded-full border-2 border-teal/30 grid place-items-center font-display font-bold text-teal">
                        {v.dose}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-bold">{v.vaccine}</div>
                          <span className="text-[8px] font-mono font-bold bg-teal/10 text-teal px-1.5 py-0.5 rounded border border-teal/20 flex items-center gap-1">
                            <CheckCircle2 className="h-2 w-2" /> COWIN VERIFIED
                          </span>
                        </div>
                        <div className="text-xs text-muted mt-0.5">{v.location || 'Government Health Center'}</div>
                        <div className="text-[10px] font-mono text-mid mt-1 uppercase tracking-wider">
                          {v.batch ? `Batch ${v.batch}` : 'CoWIN Verified'} · {v.date}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center border border-dashed border-white/10 rounded-md">
                    <Syringe className="h-8 w-8 text-muted mx-auto mb-2 opacity-20" />
                    <div className="text-sm text-muted font-medium">No vaccinations recorded</div>
                    <div className="text-[10px] text-muted/50 mt-1">Update your profile to add your dose history</div>
                  </div>
                )
              ) : (
                myPassport.doses.map((d, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-md bg-white/[0.03] border border-white/[0.05]">
                    <div className="h-10 w-10 rounded-full border-2 border-teal/30 grid place-items-center font-display font-bold text-teal">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-bold">{d.vaccine}</div>
                        <span className="text-[8px] font-mono font-bold bg-teal/10 text-teal px-1.5 py-0.5 rounded border border-teal/20 flex items-center gap-1">
                          <CheckCircle2 className="h-2 w-2" /> COWIN VERIFIED
                        </span>
                      </div>
                      <div className="text-xs text-muted mt-0.5">{d.site}</div>
                      <div className="text-[10px] font-mono text-mid mt-1 uppercase tracking-wider">
                        Batch {d.batch} · {d.date}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="panel">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-display font-bold text-lg">Daily Symptom Check-in</div>
                <div className="text-[11px] text-mid">Helps detect outbreaks in your area</div>
              </div>
              <button onClick={() => setShowCheckIn(true)} className="btn-primary text-sm">Check In Today</button>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {days.map((s, i) => {
                const c = s === "ok" ? "var(--mild)" : s === "mild" ? "var(--moderate)" : s === "bad" ? "var(--red)" : "var(--muted)";
                const bg = s === "ok" ? "var(--mild-bg)" : s === "mild" ? "var(--moderate-bg)" : s === "bad" ? "var(--red-dim)" : "transparent";
                const d = new Date(); d.setDate(d.getDate() - (6 - i));
                return (
                  <div key={i} className="rounded-md p-2 text-center" style={{ background: bg, border: `1px solid ${s === "none" ? "var(--border)" : c}` }}>
                    <div className="font-mono text-[9px] text-muted">{d.toLocaleDateString("en", { weekday: "short" }).slice(0, 2).toUpperCase()}</div>
                    <div className="font-display font-bold text-sm mt-0.5" style={{ color: c }}>{d.getDate()}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="panel">
              <div className="font-display font-bold mb-2 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal" /> Medical Profile
              </div>
              <ProfileRow 
                label="Allergies" 
                items={hasCustomPassport 
                  ? (passportData.allergyDetails?.map(a => `${a.name}${a.severity !== 'Moderate' ? ` (${a.severity})` : ''}`) || passportData.allergies || [])
                  : myPassport.allergies
                } 
                c="var(--red)" 
              />
              <ProfileRow 
                label="Conditions" 
                items={hasCustomPassport 
                  ? (passportData.conditionDetails?.map(c => c.name) || passportData.conditions || [])
                  : myPassport.conditions
                } 
                c="var(--moderate)" 
              />
              <ProfileRow 
                label="Medications" 
                items={hasCustomPassport 
                  ? (passportData.medications?.map(m => `${m.name}${m.dosage ? ` — ${m.dosage}` : ''}`) || [])
                  : myPassport.medications
                } 
                c="var(--blue)" 
              />
            </div>
            <div className="panel">
              <div className="font-display font-bold mb-2 flex items-center gap-2">
                <Phone className="h-4 w-4 text-teal" /> Emergency Contacts
              </div>
              <div className="space-y-2 mt-3">
                {(hasCustomPassport && passportData.emergencyContacts?.length ? passportData.emergencyContacts : myPassport.emergencyContacts).map((c, i) => (
                  <a key={i} href={`tel:${c.phone}`} className="flex items-center justify-between p-2.5 rounded-md hover:bg-white/[0.04] transition-colors" style={{ background: "var(--input-bg)" }}>
                    <div>
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="font-mono text-xs text-teal">{c.phone}</div>
                    </div>
                    <Phone className="h-4 w-4 text-teal" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCheckIn && (
        <div className="fixed inset-0 z-[1000] grid place-items-center p-4" style={{ background: "rgba(5,10,20,0.8)", backdropFilter: "blur(4px)" }} onClick={() => setShowCheckIn(false)}>
          <div className="panel max-w-md w-full" style={{ background: "var(--surface)" }} onClick={(e) => e.stopPropagation()}>
            <div className="font-display font-bold text-lg mb-1">Symptom Check-in</div>
            <div className="text-xs text-mid mb-4 flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {new Date().toDateString()}</div>
            <label className="text-[10px] uppercase tracking-wider text-muted">Body Temperature (°C)</label>
            <input type="number" step="0.1" value={temp} onChange={(e) => setTemp(e.target.value)} className="input-base w-full mt-1 font-mono" />
            {parseFloat(temp) >= 38 && <div className="mt-2 text-xs flex items-center gap-1" style={{ color: "var(--moderate)" }}><AlertCircle className="h-3 w-3" /> Fever detected</div>}
            <div className="mt-4">
              <label className="text-[10px] uppercase tracking-wider text-muted">Symptoms</label>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {["Fever", "Cough", "Breathlessness", "Fatigue", "Loss of smell", "Headache", "Body aches", "Sore throat"].map((s) => (
                  <button key={s} onClick={() => toggle(s)} className="text-xs px-2.5 py-2 rounded-md text-left transition-colors" style={symptoms.has(s) ? { background: "var(--teal-dim)", color: "var(--teal)", border: "1px solid var(--teal)" } : { background: "var(--input-bg)", color: "var(--mid)", border: "1px solid var(--border)" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setShowCheckIn(false)} className="btn-ghost flex-1 text-sm">Cancel</button>
              <button onClick={submitCheckIn} className="btn-primary flex-1 text-sm">Submit Report</button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-5 text-center">
        <Link to="/passport/scan/$id" params={{ id: scanUid }} className="text-xs text-teal hover:underline">
          Open public scan view →
        </Link>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />}
    </div>
  );
}

function ProfileRow({ label, items, c }: { label: string; items: string[]; c: string }) {
  return (
    <div className="mt-3">
      <div className="text-[10px] uppercase tracking-wider text-muted mb-1">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.length === 0 ? <span className="text-xs text-muted">None reported</span> : items.map((x) => (
          <span key={x} className="text-[11px] px-2 py-1 rounded-md font-medium" style={{ color: c, background: `${c}1c`, border: `1px solid ${c}40` }}>{x}</span>
        ))}
      </div>
    </div>
  );
}

function computeScore(data: any, hasCustom: boolean) {
  if (!hasCustom) {
    let s = 0;
    if (myPassport.bloodType) s += 20;
    if (myPassport.allergies.length) s += 15;
    if (myPassport.doses.length >= 2) s += 25;
    if (myPassport.emergencyContacts.length >= 2) s += 20;
    if (myPassport.conditions.length || myPassport.medications.length) s += 20;
    return s;
  }
  let s = 0;
  // Use new detailed structures OR legacy ones
  if (data.bloodType && data.bloodType !== "unknown") s += 20;
  if ((data.allergyDetails?.length) || (data.allergies?.length)) s += 15;
  if (data.vaccinations?.length >= 2) s += 25;
  if (data.emergencyContacts?.length >= 1) s += 20; // Changed to 1 for better feedback
  if ((data.conditionDetails?.length) || (data.conditions?.length) || (data.medications?.length)) s += 20;
  return Math.min(100, s);
}
