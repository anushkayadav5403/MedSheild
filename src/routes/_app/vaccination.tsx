import { createFileRoute } from "@tanstack/react-router";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { vaccines, hospitals } from "@/lib/mockData";
import { fmtNum } from "@/lib/roleStore";
import { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, CheckCircle2, ChevronRight, Search, IdCard } from "lucide-react";
import { toast } from "sonner";
import { usePassportStore } from "@/lib/passportStore";
import { fetchNationalStats, fetchStateVaccinationData, fetchCowinSessionsByPin, type NationalStats, type VaccinationCoverage } from "@/lib/realDataService";

export const Route = createFileRoute("/_app/vaccination")({
  component: VaccinationPage,
});

function VaccinationPage() {
  const { passportData } = usePassportStore();
  const [search, setSearch] = useState("");
  const [selectedHospital, setSelectedHospital] = useState<any | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");
  const [beneficiary, setBeneficiary] = useState({ name: "", age: "", idType: "Aadhaar", idNumber: "" });
  const [bookingStep, setBookingStep] = useState(1); // 1: Select Hospital, 2: Select Date/Slot, 3: Details, 4: Review, 5: Success
  const [stats, setStats] = useState<NationalStats | null>(null);
  const [stateData, setStateData] = useState<VaccinationCoverage[]>([]);
  const [cowinSlots, setCowinSlots] = useState<any[]>([]);
  const [isSearchingSlots, setIsSearchingSlots] = useState(false);

  useEffect(() => {
    const loadStats = async () => {
      const s = await fetchNationalStats();
      const v = await fetchStateVaccinationData();
      setStats(s);
      setStateData(v);
    };
    loadStats();
  }, []);

  // CoWIN slot search logic
  useEffect(() => {
    if (search.length === 6 && /^\d+$/.test(search)) {
      const searchSlots = async () => {
        setIsSearchingSlots(true);
        const today = new Date().toLocaleDateString('en-GB').replace(/\//g, '-');
        const sessions = await fetchCowinSessionsByPin(search, today);
        setCowinSlots(sessions);
        setIsSearchingSlots(false);
      };
      searchSlots();
    }
  }, [search]);

  // Auto-fill beneficiary details from Health Passport
  useEffect(() => {
    if (passportData.fullName) {
      // Calculate age from DOB if available
      let age = "";
      if (passportData.dateOfBirth) {
        const birthDate = new Date(passportData.dateOfBirth);
        const today = new Date();
        age = (today.getFullYear() - birthDate.getFullYear()).toString();
      }

      setBeneficiary(prev => ({
        ...prev,
        name: passportData.fullName || prev.name,
        age: age || prev.age,
      }));
    }
  }, [passportData]);

  const pct = stats?.vaccinationPct || 74;
  const circumference = 2 * Math.PI * 64;
  const offset = circumference - (pct / 100) * circumference;

  const displayHospitals = cowinSlots.length > 0 ? cowinSlots.map(s => ({
    id: s.center_id,
    name: s.name,
    address: s.address,
    city: s.block_name,
    state: s.state_name,
    type: s.fee_type,
    vaccine: s.vaccine,
    slots: s.slots
  })) : hospitals.filter(h => 
    h.name.toLowerCase().includes(search.toLowerCase()) || 
    h.city.toLowerCase().includes(search.toLowerCase())
  );

  const dates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      full: d.toISOString().split('T')[0],
      display: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    };
  });

  const slots = ['09:00 AM', '10:30 AM', '12:00 PM', '02:00 PM', '03:30 PM', '05:00 PM'];

  const handleBookSlot = (hospital: typeof hospitals[0]) => {
    setSelectedHospital(hospital);
    setBookingStep(2);
    setSelectedDate(dates[0].full);
  };

  const goToDetails = () => {
    if (!selectedSlot) {
      toast.error("Please select a time slot");
      return;
    }
    setBookingStep(3);
  };

  const goToReview = () => {
    if (!beneficiary.name || !beneficiary.age || !beneficiary.idNumber) {
      toast.error("Please fill in all beneficiary details");
      return;
    }
    setBookingStep(4);
  };

  const confirmBooking = () => {
    setBookingStep(5);
    toast.success(`Slot booked at ${selectedHospital?.name}!`);
  };

  const resetBooking = () => {
    setBookingStep(1);
    setSelectedHospital(null);
    setSelectedSlot("");
    setSelectedDate("");
    setBeneficiary({ name: "", age: "", idType: "Aadhaar", idNumber: "" });
  };

  const handleDownloadReceipt = () => {
    if (!selectedHospital) return;
    
    const dateDisplay = dates.find(d => d.full === selectedDate)?.display;
    const refId = `SENT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    
    const receiptContent = `
=========================================
      MEDSHIELD CRISIS INTELLIGENCE
      VACCINATION BOOKING RECEIPT
=========================================

REFERENCE ID: ${refId}
STATUS: CONFIRMED

BENEFICIARY DETAILS:
-------------------
Name: ${beneficiary.name}
Age: ${beneficiary.age}
ID: ${beneficiary.idType} - ${beneficiary.idNumber}

APPOINTMENT DETAILS:
-------------------
Center: ${selectedHospital.name}
Location: ${selectedHospital.city}, ${selectedHospital.state}
Date: ${dateDisplay}
Time Slot: ${selectedSlot}

INSTRUCTIONS:
------------
1. Please arrive 15 minutes prior to your slot.
2. Carry your original ${beneficiary.idType} card or government ID.
3. Show this receipt (digital or print) at the center.
4. Do not visit the center if you have active symptoms.

Generated on: ${new Date().toLocaleString('en-IN')}
_________________________________________
MEDSHIELD GLOBAL BIOSECURITY PROTOCOL 2026
    `.trim();

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Vaccine_Receipt_${refId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Receipt downloaded successfully!");
  };

  return (
    <div className="p-5 md:p-6 max-w-[1500px] mx-auto space-y-5 text-[#031B1D] animate-fade-in">
      <div className="animate-slide-up stagger-1">
        <h1 className="font-display font-extrabold text-2xl md:text-3xl">MedShield Vaccination Intelligence</h1>
        <p className="text-sm opacity-60">CoWIN-integrated tracking · State-level breakdown · Booster planning</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
        <div className="panel grid place-items-center text-center animate-slide-up stagger-2">
          <div className="relative">
            <svg width="160" height="160">
              <circle cx="80" cy="80" r="64" stroke="rgba(255,255,255,0.06)" strokeWidth="12" fill="none" />
              <circle
                cx="80" cy="80" r="64" stroke="var(--teal)" strokeWidth="12" fill="none"
                strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
                transform="rotate(-90 80 80)"
                style={{ transition: "stroke-dashoffset 1.2s ease-out" }}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div>
                <div className="font-mono font-extrabold text-4xl text-teal leading-none">{pct}%</div>
                <div className="text-[10px] text-mid mt-1 uppercase tracking-wider">target pop.</div>
              </div>
            </div>
          </div>
          <div className="font-display font-bold mt-3">MedShield Coverage</div>
          <div className="font-mono text-xs text-muted mt-1">{stats ? (stats.vaccinationDoses / 10000000).toFixed(2) + " Cr" : "..."} doses</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 content-start">
          <Mini label="Total Doses" value={stats ? (stats.vaccinationDoses / 10000000).toFixed(2) + " Cr" : "..."} c="var(--blue)" index={1} />
          <Mini label="Fully Vaccinated" value={stats ? (stats.recovered / 10000000).toFixed(2) + " Cr" : "..."} c="var(--mild)" index={2} />
          <Mini label="Partial" value="14.8 Cr" c="var(--moderate)" index={3} />
          <Mini label="Unvaccinated" value="11.2 Cr" c="var(--red)" index={4} />

          <div className="panel col-span-2 md:col-span-4 animate-slide-up stagger-3">
            <div className="font-display font-bold text-base mb-3">State Coverage Trend (Real Data)</div>
            <div style={{ width: "100%", height: 320 }} className="animate-graph-reveal">
              <ResponsiveContainer>
                <AreaChart data={stateData.length > 0 ? stateData : []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFull" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--mild)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--mild)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPartial" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--moderate)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--moderate)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="state" tick={{ fill: "#9ba3b5", fontSize: 11, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `${v}%`} tick={{ fill: "#5c6476", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#0d1829", border: "1px solid rgba(99,130,175,0.28)", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 12 }}
                    itemStyle={{ color: "#eef0f3" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 20 }} />
                  <Area type="monotone" dataKey="full" stroke="var(--mild)" strokeWidth={3} fillOpacity={1} fill="url(#colorFull)" name="Fully Vaccinated" isAnimationActive={true} animationDuration={1500} />
                  <Area type="monotone" dataKey="partial" stroke="var(--moderate)" strokeWidth={3} fillOpacity={1} fill="url(#colorPartial)" name="Partially Vaccinated" isAnimationActive={true} animationDuration={1800} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Vaccine Slot Booker Feature */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="panel lg:col-span-2 flex flex-col animate-slide-up stagger-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display font-bold text-xl flex items-center gap-2">
                <Calendar className="h-5 w-5 text-teal" />
                Vaccine Slot Booker
              </h2>
              <p className="text-[11px] text-muted uppercase tracking-widest mt-1">Book your dose at the nearest verified center</p>
            </div>
            {bookingStep > 1 && (
              <button 
                onClick={() => setBookingStep(1)}
                className="text-[10px] font-bold text-teal uppercase hover:underline"
              >
                ← Back to search
              </button>
            )}
          </div>

          {bookingStep === 1 && (
            <div className="space-y-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                <input 
                  type="text" 
                  placeholder="Enter Pincode (e.g. 110001) or search by name..." 
                  className="input-base w-full pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                {isSearchingSlots ? (
                  <div className="col-span-2 text-center py-10 text-white/40 font-mono text-xs">Accessing CoWIN Real-time Database...</div>
                ) : displayHospitals.length > 0 ? displayHospitals.map((h, i) => (
                  <div key={h.id || i} className={`p-4 rounded-xl bg-white/5 border border-white/5 hover:border-teal/30 transition-all group animate-fade-in stagger-${(i % 4) + 1}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-bold text-white group-hover:text-teal transition-colors truncate pr-2">{h.name}</div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/60 whitespace-nowrap">{h.type}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted mb-4">
                      <MapPin className="h-3 w-3" />
                      {h.city}, {h.state}
                    </div>
                    <button 
                      onClick={() => handleBookSlot(h)}
                      className="w-full py-2 bg-teal text-black font-bold text-xs rounded-lg hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_15px_rgba(0,255,209,0.2)]"
                    >
                      Check Slots
                    </button>
                  </div>
                )) : (
                  <div className="col-span-2 text-center py-10 text-white/20 font-mono text-xs italic">No real-time slots found. Try entering a valid Indian pincode.</div>
                )}
              </div>
            </div>
          )}

          {bookingStep === 2 && (
            <div className="flex-1 flex flex-col items-center py-4 text-center animate-scale-in">
              <div className="h-12 w-12 rounded-2xl bg-teal/10 grid place-items-center mb-4">
                <Clock className="h-6 w-6 text-teal" />
              </div>
              <h3 className="font-display font-bold text-lg mb-1">Select Date & Time</h3>
              <p className="text-xs text-muted mb-6">at {selectedHospital?.name}</p>
              
              <div className="w-full max-w-md space-y-6">
                <div>
                  <div className="text-[10px] text-muted uppercase tracking-widest mb-3 font-bold text-left">1. Select Date</div>
                  <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {dates.map((d) => (
                      <button
                        key={d.full}
                        onClick={() => setSelectedDate(d.full)}
                        className={`px-4 py-2 rounded-xl border shrink-0 transition-all text-xs font-bold ${
                          selectedDate === d.full 
                            ? "bg-teal text-black border-teal shadow-[0_0_15px_rgba(0,255,209,0.3)]" 
                            : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                        }`}
                      >
                        {d.display}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-muted uppercase tracking-widest mb-3 font-bold text-left">2. Select Time Slot</div>
                  <div className="grid grid-cols-3 gap-2">
                    {slots.map((time) => (
                      <button 
                        key={time} 
                        onClick={() => setSelectedSlot(time)}
                        className={`p-2.5 rounded-lg border transition-all font-mono text-[11px] font-bold ${
                          selectedSlot === time 
                            ? "bg-teal/20 text-teal border-teal shadow-[0_0_10px_rgba(0,255,209,0.1)]" 
                            : "bg-white/5 border-white/10 text-white/40 hover:border-white/20"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={goToDetails}
                disabled={!selectedSlot}
                className="mt-8 px-10 py-3 bg-teal text-black font-bold rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
              >
                Beneficiary Details
              </button>
            </div>
          )}

          {bookingStep === 3 && (
            <div className="flex-1 flex flex-col items-center py-4 animate-scale-in">
              <div className="h-12 w-12 rounded-2xl bg-teal/10 grid place-items-center mb-4">
                <IdCard className="h-6 w-6 text-teal" />
              </div>
              <h3 className="font-display font-bold text-lg mb-6 text-white">Beneficiary Details</h3>
              
              <div className="w-full max-w-sm space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-muted uppercase tracking-widest font-bold ml-1">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter name as on ID" 
                    className="input-base w-full"
                    value={beneficiary.name}
                    onChange={(e) => setBeneficiary({ ...beneficiary, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 space-y-1.5 text-left">
                    <label className="text-[10px] text-muted uppercase tracking-widest font-bold ml-1">Age</label>
                    <input 
                      type="number" 
                      placeholder="Age" 
                      className="input-base w-full"
                      value={beneficiary.age}
                      onChange={(e) => setBeneficiary({ ...beneficiary, age: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5 text-left">
                    <label className="text-[10px] text-muted uppercase tracking-widest font-bold ml-1">ID Type</label>
                    <select 
                      className="input-base w-full"
                      value={beneficiary.idType}
                      onChange={(e) => setBeneficiary({ ...beneficiary, idType: e.target.value })}
                    >
                      <option>Aadhaar</option>
                      <option>PAN Card</option>
                      <option>Driving License</option>
                      <option>Passport</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-muted uppercase tracking-widest font-bold ml-1">ID Number</label>
                  <input 
                    type="text" 
                    placeholder="Enter ID number" 
                    className="input-base w-full"
                    value={beneficiary.idNumber}
                    onChange={(e) => setBeneficiary({ ...beneficiary, idNumber: e.target.value })}
                  />
                </div>
              </div>

              <button 
                onClick={goToReview}
                className="mt-8 px-12 py-3 bg-teal text-black font-bold rounded-xl hover:scale-105 transition-all"
              >
                Review Booking
              </button>
            </div>
          )}

          {bookingStep === 4 && (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center animate-scale-in">
              <div className="h-16 w-16 rounded-2xl bg-teal/10 grid place-items-center mb-6">
                <CheckCircle2 className="h-8 w-8 text-teal" />
              </div>
              <h3 className="font-display font-bold text-xl mb-6 text-white">Confirm Your Details</h3>
              
              <div className="w-full max-w-sm p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 text-left mb-8">
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-xs text-muted">Beneficiary</span>
                  <span className="text-xs font-bold text-white">{beneficiary.name}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-xs text-muted">Age / ID</span>
                  <span className="text-xs font-bold text-white">{beneficiary.age}y · {beneficiary.idType}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-xs text-muted">Center</span>
                  <span className="text-xs font-bold text-white text-right">{selectedHospital?.name}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-3">
                  <span className="text-xs text-muted">Date</span>
                  <span className="text-xs font-bold text-white">
                    {dates.find(d => d.full === selectedDate)?.display}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-muted">Time Slot</span>
                  <span className="text-xs font-bold text-teal">{selectedSlot}</span>
                </div>
              </div>

              <button 
                onClick={confirmBooking}
                className="px-12 py-4 bg-teal text-black font-extrabold rounded-xl hover:scale-105 transition-all shadow-[0_0_30px_rgba(0,255,209,0.3)]"
              >
                Confirm & Book
              </button>
            </div>
          )}

          {bookingStep === 5 && (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-center animate-scale-in">
              <div className="h-20 w-20 rounded-full bg-mild/10 grid place-items-center mb-6 border border-mild/20 relative">
                <CheckCircle2 className="h-10 w-10 text-mild" />
                <div className="absolute inset-0 bg-mild/20 animate-ping rounded-full" />
              </div>
              <h3 className="font-display font-bold text-2xl text-white mb-2">Booking Confirmed!</h3>
              <p className="text-sm text-muted mb-8 max-w-sm">
                Your vaccination slot at <strong>{selectedHospital?.name}</strong> has been successfully booked for {dates.find(d => d.full === selectedDate)?.display} at {selectedSlot}.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={resetBooking}
                  className="px-6 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all"
                >
                  Book Another
                </button>
                <button 
                  onClick={handleDownloadReceipt}
                  className="px-6 py-2 rounded-lg bg-teal text-black text-xs font-bold hover:scale-105 transition-all"
                >
                  Download Receipt
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="panel animate-slide-up stagger-5">
          <h2 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-mild" />
            Eligibility Check
          </h2>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-mild-bg border border-mild/20">
              <div className="text-xs font-bold text-mild uppercase tracking-widest mb-1">Status: Eligible</div>
              <div className="text-sm text-white font-medium">You are eligible for the Booster Dose (Dose 3).</div>
            </div>
            <div className="space-y-3">
              {[
                { label: "Age 18+", ok: true },
                { label: "9 months since Dose 2", ok: true },
                { label: "ID Verification", ok: true },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-white/60">{item.label}</span>
                  <CheckCircle2 className="h-4 w-4 text-mild" />
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-white/5">
              <div className="text-[10px] text-muted uppercase tracking-widest mb-2 font-bold">Guidelines</div>
              <ul className="text-[11px] text-white/50 space-y-2">
                <li className="flex gap-2">
                  <ChevronRight className="h-3 w-3 text-teal shrink-0" />
                  Carry original Aadhaar/ID card.
                </li>
                <li className="flex gap-2">
                  <ChevronRight className="h-3 w-3 text-teal shrink-0" />
                  Arrive 15 mins before your slot.
                </li>
                <li className="flex gap-2">
                  <ChevronRight className="h-3 w-3 text-teal shrink-0" />
                  Do not visit if symptomatic.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="panel animate-slide-up stagger-6">
        <div className="font-display font-bold text-lg mb-3">Available Vaccines</div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {vaccines.map((v, i) => (
            <div key={v.name} className={`p-4 rounded-lg bg-white/5 border border-white/10 hover:border-teal/30 transition-all animate-fade-in stagger-${(i % 4) + 1}`}>
              <div className="font-display font-extrabold text-lg text-white">{v.name}</div>
              <div className="text-[11px] text-mid">{v.maker}</div>
              <div className="mt-3 space-y-1.5 font-mono text-[11px]">
                <Row k="Efficacy" v={v.efficacy} c="var(--mild)" />
                <Row k="Doses" v={String(v.doses)} />
                <Row k="Interval" v={v.interval} />
                <Row k="Storage" v={v.storage} c="var(--blue)" />
              </div>
              <div className="text-[10px] text-muted mt-3">Side effects: {v.side}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value, c, index }: { label: string; value: string; c: string; index: number }) {
  return (
    <div className={`panel border-white/10 relative overflow-hidden animate-slide-up stagger-${index}`}>
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">{label}</div>
      <div className="font-mono font-extrabold text-2xl mt-2 drop-shadow-sm" style={{ color: c }}>{value}</div>
      <div className="absolute -bottom-6 -right-6 h-16 w-16 rounded-full blur-2xl" style={{ background: c, opacity: 0.15 }} />
    </div>
  );
}
function Row({ k, v, c }: { k: string; v: string; c?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{k}</span>
      <span style={{ color: c || "white" }} className="font-bold">{v}</span>
    </div>
  );
}
