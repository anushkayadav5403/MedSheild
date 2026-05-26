import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { loadPassportFromFirestore } from "@/lib/passportFirestore";
import type { HealthPassportData } from "@/lib/passportStore";
import { Printer, Share2, Phone, Loader2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/passport/scan/$id")({
  component: ScanPage,
});

function ScanPage() {
  const { id } = Route.useParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [passport, setPassport] = useState<Partial<HealthPassportData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Strictly load from Firestore — no demo fallbacks
  useEffect(() => {
    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        const data = await loadPassportFromFirestore(id);
        if (data) {
          setPassport(data);
        } else {
          setNotFound(true);
        }
      } catch (e) {
        console.error("Firestore load failed:", e);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!loading && !notFound && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, window.location.href, { width: 120, margin: 1 });
    }
  }, [loading, notFound]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="font-mono text-sm">Loading health passport...</span>
        </div>
      </div>
    );
  }

  if (notFound || !passport) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="font-display font-bold text-xl text-neutral-900 mb-2">Passport Not Found</h1>
          <p className="text-sm text-neutral-600">
            This health passport doesn't exist or hasn't been saved to the cloud.
            The user must complete their profile and sync it to make it scan-ready.
          </p>
        </div>
      </div>
    );
  }

  const name = passport.fullName || "Unknown Patient";
  const bloodType = passport.bloodType && passport.bloodType !== "unknown"
    ? `${passport.bloodType}${passport.rhFactor === "positive" ? "+" : passport.rhFactor === "negative" ? "-" : ""}`
    : "—";
  const allergies = passport.allergies || [];
  const conditions = passport.conditions || [];
  const medications = passport.medications || [];
  const emergencyContacts = passport.emergencyContacts || [];
  const vaccinations = passport.vaccinations || [];
  const dnr = passport.dnr ?? false;
  const organDonor = passport.organDonor ?? false;

  const vaccinationStatus = vaccinations.length >= 2 ? "FULLY VACCINATED"
    : vaccinations.length === 1 ? "PARTIALLY VACCINATED"
    : "UNVACCINATED";
  const vaccinationColor = vaccinations.length >= 2 ? "emerald" : vaccinations.length === 1 ? "amber" : "red";

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans">
      <div className="max-w-2xl mx-auto p-6 md:p-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md grid place-items-center bg-[#e8202a]">
              <span className="text-white font-display font-extrabold text-lg leading-none">S</span>
            </div>
            <div>
              <div className="font-display font-extrabold text-base leading-none">MedShield</div>
              <div className="font-mono text-[9px] text-neutral-500">EMERGENCY MEDICAL VIEW</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] text-neutral-500">PASSPORT ID</div>
            <div className="font-mono text-xs truncate max-w-[140px]">{id.slice(0, 16)}…</div>
          </div>
        </div>

        {/* Name + Blood Type + QR */}
        <div className="grid grid-cols-[1fr_auto] gap-6 items-start border-b pb-6 border-neutral-200">
          <div>
            <div className="font-mono text-[10px] text-neutral-500 uppercase">Full Name</div>
            <h1 className="font-display font-extrabold text-3xl md:text-4xl mt-1 leading-tight">{name}</h1>
            {passport?.dateOfBirth && (
              <div className="text-sm text-neutral-600">
                {new Date().getFullYear() - new Date(passport.dateOfBirth).getFullYear()} years
                {passport.gender ? ` · ${passport.gender}` : ""}
              </div>
            )}
            <div className="mt-4 flex items-center gap-3">
              <div className="h-14 w-14 rounded-full grid place-items-center bg-[#e8202a] text-white font-display font-extrabold text-xl">
                {bloodType}
              </div>
              <div>
                <div className="text-xs font-mono uppercase text-neutral-500">Blood Type</div>
                <div className="font-display font-bold text-lg">{bloodType}</div>
              </div>
            </div>
          </div>
          <canvas ref={canvasRef} className="border border-neutral-200 rounded" />
        </div>

        {/* Vaccination Status */}
        <div className={`my-6 p-4 rounded-lg ${
          vaccinationColor === "emerald" ? "bg-emerald-50 border border-emerald-300" :
          vaccinationColor === "amber" ? "bg-amber-50 border border-amber-300" :
          "bg-red-50 border border-red-300"
        }`}>
          <div className={`font-mono text-[10px] uppercase tracking-wider font-bold ${
            vaccinationColor === "emerald" ? "text-emerald-700" :
            vaccinationColor === "amber" ? "text-amber-700" : "text-red-700"
          }`}>
            Pandemic Status
          </div>
          <div className={`font-display font-extrabold text-2xl mt-1 ${
            vaccinationColor === "emerald" ? "text-emerald-700" :
            vaccinationColor === "amber" ? "text-amber-700" : "text-red-700"
          }`}>
            {vaccinationStatus}
          </div>
          {vaccinations.length > 0 && (
            <div className="text-sm text-neutral-700 mt-1">
              {vaccinations.length} dose{vaccinations.length !== 1 ? "s" : ""} ·
              Last: {vaccinations[vaccinations.length - 1].vaccine} · {vaccinations[vaccinations.length - 1].date}
            </div>
          )}
        </div>

        {/* Allergies — most critical */}
        {allergies.length > 0 && (
          <Section title="⚠ Allergies — Critical">
            <div className="flex flex-wrap gap-2">
              {allergies.map((a) => (
                <span key={a} className="px-3 py-1.5 rounded-md bg-red-100 text-red-800 font-bold text-sm">
                  {a}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Conditions */}
        {conditions.length > 0 && (
          <Section title="Active Conditions">
            {conditions.map((c) => (
              <div key={c} className="text-sm">• {c}</div>
            ))}
          </Section>
        )}

        {/* Medications */}
        {medications.length > 0 && (
          <Section title="Current Medications">
            <div className="space-y-2">
              {medications.map((m, idx) => (
                <div key={idx} className="text-sm">
                  <span className="font-bold">• {m.name}</span>
                  {(m.dosage || m.frequency) && (
                    <span className="text-neutral-500 font-mono text-xs ml-2">
                      ({m.dosage}{m.dosage && m.frequency ? " · " : ""}{m.frequency})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Critical Directives */}
        {(dnr || organDonor) && (
          <Section title="Critical Directives">
            {dnr && (
              <div className="px-3 py-2 rounded-md bg-red-100 text-red-800 font-bold text-sm mb-2">
                ⚠ DO NOT RESUSCITATE (DNR)
              </div>
            )}
            {organDonor && (
              <div className="px-3 py-2 rounded-md bg-blue-100 text-blue-800 font-bold text-sm">
                ♥ ORGAN DONOR
              </div>
            )}
          </Section>
        )}

        {/* Emergency Contacts */}
        <Section title="Emergency Contacts">
          <div className="space-y-2">
            {emergencyContacts.map((c, i) => (
              <a
                key={i}
                href={`tel:${c.phone}`}
                className="flex items-center justify-between p-3 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors"
              >
                <div>
                  <div className="font-semibold">{c.name}</div>
                  {"relationship" in c && c.relationship && (
                    <div className="text-xs text-neutral-500">{(c as any).relationship}</div>
                  )}
                  <div className="font-mono text-sm text-blue-700">{c.phone}</div>
                </div>
                <Phone className="h-4 w-4 text-blue-700" />
              </a>
            ))}
          </div>
        </Section>

        {/* Actions */}
        <div className="mt-8 flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-neutral-900 text-white font-bold text-sm"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
          <button
            onClick={() => navigator.share?.({ title: `${name} — MedShield Passport`, url: window.location.href })}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-neutral-300 font-bold text-sm"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>

        <div className="mt-6 text-center font-mono text-[10px] text-neutral-400">
          Last updated · {passport?.lastUpdated ? new Date(passport.lastUpdated).toLocaleString("en-IN") : new Date().toLocaleString("en-IN")}<br />
          MedShield Crisis Health Passport · Government of India simulation
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 mb-3 pb-1 border-b border-neutral-100">
        {title}
      </div>
      {children}
    </div>
  );
}
