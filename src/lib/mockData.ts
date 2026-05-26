export const nationalStats = {
  activeCases: 284391,
  hospitalized: 47832,
  recoveredToday: 193204,
  vaccinationDoses: 947000000,
  vaccinationPct: 71,
  alertLevel: "ORANGE" as "GREEN" | "AMBER" | "ORANGE" | "RED",
  lastUpdated: new Date().toISOString(),
};

export type CityOutbreak = {
  name: string;
  state: string;
  lat: number;
  lng: number;
  activeCases: number;
  hospitalized: number;
  vaccinationCoverage: number;
  status: "Critical" | "High" | "Moderate" | "Contained";
  nearestHospital: { name: string; phone: string };
};

export const cityOutbreaks: CityOutbreak[] = [
  { name: "Mumbai", state: "Maharashtra", lat: 19.076, lng: 72.8777, activeCases: 28400, hospitalized: 4800, vaccinationCoverage: 78, status: "Critical", nearestHospital: { name: "KEM Hospital", phone: "022-24107000" } },
  { name: "Delhi", state: "Delhi NCR", lat: 28.6139, lng: 77.209, activeCases: 19200, hospitalized: 3100, vaccinationCoverage: 81, status: "Critical", nearestHospital: { name: "AIIMS Delhi", phone: "011-26588500" } },
  { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707, activeCases: 12800, hospitalized: 2200, vaccinationCoverage: 74, status: "Critical", nearestHospital: { name: "Rajiv Gandhi GH", phone: "044-25305000" } },
  { name: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946, activeCases: 8400, hospitalized: 1400, vaccinationCoverage: 82, status: "High", nearestHospital: { name: "Victoria Hospital", phone: "080-26703294" } },
  { name: "Hyderabad", state: "Telangana", lat: 17.385, lng: 78.4867, activeCases: 7200, hospitalized: 1180, vaccinationCoverage: 76, status: "High", nearestHospital: { name: "Gandhi Hospital", phone: "040-27505566" } },
  { name: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639, activeCases: 6800, hospitalized: 1100, vaccinationCoverage: 70, status: "High", nearestHospital: { name: "SSKM Hospital", phone: "033-22041101" } },
  { name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567, activeCases: 5400, hospitalized: 900, vaccinationCoverage: 79, status: "High", nearestHospital: { name: "Sassoon GH", phone: "020-26128000" } },
  { name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714, activeCases: 4200, hospitalized: 700, vaccinationCoverage: 73, status: "Moderate", nearestHospital: { name: "Civil Hospital", phone: "079-22683721" } },
  { name: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873, activeCases: 3100, hospitalized: 520, vaccinationCoverage: 69, status: "Moderate", nearestHospital: { name: "SMS Hospital", phone: "0141-2518109" } },
  { name: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, activeCases: 2800, hospitalized: 470, vaccinationCoverage: 64, status: "Moderate", nearestHospital: { name: "KGMU", phone: "0522-2257540" } },
  { name: "Surat", state: "Gujarat", lat: 21.1702, lng: 72.8311, activeCases: 2200, hospitalized: 360, vaccinationCoverage: 72, status: "Moderate", nearestHospital: { name: "New Civil", phone: "0261-2244456" } },
  { name: "Nagpur", state: "Maharashtra", lat: 21.1458, lng: 79.0882, activeCases: 1800, hospitalized: 290, vaccinationCoverage: 77, status: "Contained", nearestHospital: { name: "GMCH Nagpur", phone: "0712-2741375" } },
  { name: "Indore", state: "Madhya Pradesh", lat: 22.7196, lng: 75.8577, activeCases: 1200, hospitalized: 200, vaccinationCoverage: 68, status: "Contained", nearestHospital: { name: "MY Hospital", phone: "0731-2527144" } },
  { name: "Bhopal", state: "Madhya Pradesh", lat: 23.2599, lng: 77.4126, activeCases: 900, hospitalized: 150, vaccinationCoverage: 66, status: "Contained", nearestHospital: { name: "Hamidia Hospital", phone: "0755-2540222" } },
  { name: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lng: 76.9558, activeCases: 600, hospitalized: 95, vaccinationCoverage: 80, status: "Contained", nearestHospital: { name: "CMCH", phone: "0422-2575605" } },
];

export type Alert = { id: string; severity: "RED" | "AMBER" | "GREEN"; message: string; timestamp: string; district: string };
export const alerts: Alert[] = [
  { id: "a1", severity: "RED", message: "ICU capacity critical — Mumbai General Hospital", timestamp: "14:28", district: "Mumbai" },
  { id: "a2", severity: "RED", message: "New variant cluster detected — Maharashtra", timestamp: "13:45", district: "Maharashtra" },
  { id: "a3", severity: "AMBER", message: "Remdesivir stock depleted — Delhi NCR", timestamp: "12:30", district: "Delhi" },
  { id: "a4", severity: "AMBER", message: "Rapid antigen kits low — 3 Bengaluru districts", timestamp: "11:15", district: "Bengaluru" },
  { id: "a5", severity: "GREEN", message: "Vaccination drive complete — Rajasthan Zone 4", timestamp: "10:00", district: "Rajasthan" },
  { id: "a6", severity: "AMBER", message: "Oxygen supply alert — Chennai metro region", timestamp: "09:42", district: "Chennai" },
  { id: "a7", severity: "RED", message: "Hospital beds exhausted — Pune district", timestamp: "08:55", district: "Pune" },
];

export type Hospital = {
  id: string; name: string; city: string; state: string; type: "Government" | "Private" | "AIIMS";
  icuCapacity: number; icuUsed: number; ventilators: number; ventilatorsUsed: number;
  oxygenLevel: number; beds: number; bedsUsed: number; medicineStock: number; phone: string;
  status: "Operational" | "Overwhelmed" | "At Capacity";
};
export const hospitals: Hospital[] = [
  { id: "h1", name: "AIIMS Delhi", city: "Delhi", state: "Delhi NCR", type: "AIIMS", icuCapacity: 220, icuUsed: 198, ventilators: 140, ventilatorsUsed: 122, oxygenLevel: 42, beds: 2400, bedsUsed: 2180, medicineStock: 71, phone: "011-26588500", status: "Overwhelmed" },
  { id: "h2", name: "KEM Hospital Mumbai", city: "Mumbai", state: "Maharashtra", type: "Government", icuCapacity: 180, icuUsed: 175, ventilators: 90, ventilatorsUsed: 88, oxygenLevel: 28, beds: 1800, bedsUsed: 1790, medicineStock: 44, phone: "022-24107000", status: "At Capacity" },
  { id: "h3", name: "Tata Memorial", city: "Mumbai", state: "Maharashtra", type: "Private", icuCapacity: 90, icuUsed: 64, ventilators: 50, ventilatorsUsed: 32, oxygenLevel: 68, beds: 700, bedsUsed: 520, medicineStock: 82, phone: "022-24177000", status: "Operational" },
  { id: "h4", name: "Apollo Chennai", city: "Chennai", state: "Tamil Nadu", type: "Private", icuCapacity: 120, icuUsed: 95, ventilators: 70, ventilatorsUsed: 55, oxygenLevel: 61, beds: 1100, bedsUsed: 880, medicineStock: 77, phone: "044-28290200", status: "Operational" },
  { id: "h5", name: "Rajiv Gandhi GH", city: "Chennai", state: "Tamil Nadu", type: "Government", icuCapacity: 160, icuUsed: 152, ventilators: 80, ventilatorsUsed: 76, oxygenLevel: 34, beds: 1600, bedsUsed: 1550, medicineStock: 52, phone: "044-25305000", status: "At Capacity" },
  { id: "h6", name: "Victoria Hospital", city: "Bengaluru", state: "Karnataka", type: "Government", icuCapacity: 140, icuUsed: 96, ventilators: 70, ventilatorsUsed: 48, oxygenLevel: 71, beds: 1400, bedsUsed: 1020, medicineStock: 80, phone: "080-26703294", status: "Operational" },
  { id: "h7", name: "Manipal Hospital", city: "Bengaluru", state: "Karnataka", type: "Private", icuCapacity: 100, icuUsed: 78, ventilators: 60, ventilatorsUsed: 41, oxygenLevel: 65, beds: 900, bedsUsed: 690, medicineStock: 74, phone: "080-25023700", status: "Operational" },
  { id: "h8", name: "Gandhi Hospital", city: "Hyderabad", state: "Telangana", type: "Government", icuCapacity: 150, icuUsed: 130, ventilators: 75, ventilatorsUsed: 62, oxygenLevel: 48, beds: 1500, bedsUsed: 1310, medicineStock: 63, phone: "040-27505566", status: "Overwhelmed" },
  { id: "h9", name: "SSKM Hospital", city: "Kolkata", state: "West Bengal", type: "Government", icuCapacity: 130, icuUsed: 110, ventilators: 65, ventilatorsUsed: 54, oxygenLevel: 52, beds: 1300, bedsUsed: 1080, medicineStock: 68, phone: "033-22041101", status: "Overwhelmed" },
  { id: "h10", name: "Sassoon GH Pune", city: "Pune", state: "Maharashtra", type: "Government", icuCapacity: 110, icuUsed: 102, ventilators: 55, ventilatorsUsed: 51, oxygenLevel: 38, beds: 1100, bedsUsed: 1060, medicineStock: 49, phone: "020-26128000", status: "At Capacity" },
  { id: "h11", name: "SMS Hospital Jaipur", city: "Jaipur", state: "Rajasthan", type: "Government", icuCapacity: 120, icuUsed: 84, ventilators: 60, ventilatorsUsed: 38, oxygenLevel: 66, beds: 1200, bedsUsed: 880, medicineStock: 78, phone: "0141-2518109", status: "Operational" },
  { id: "h12", name: "KGMU Lucknow", city: "Lucknow", state: "Uttar Pradesh", type: "Government", icuCapacity: 140, icuUsed: 119, ventilators: 70, ventilatorsUsed: 57, oxygenLevel: 55, beds: 1400, bedsUsed: 1180, medicineStock: 64, phone: "0522-2257540", status: "Overwhelmed" },
];

export const caseTrend14d = Array.from({ length: 14 }, (_, i) => {
  const base = 11000 + i * 950 + Math.sin(i / 2) * 1400;
  return { day: `D-${13 - i}`, cases: Math.round(base) };
});

export const topSymptoms = [
  { name: "Fever", count: 18400, severeShare: 0.18 },
  { name: "Cough", count: 16200, severeShare: 0.12 },
  { name: "Fatigue", count: 12100, severeShare: 0.08 },
  { name: "Headache", count: 9800, severeShare: 0.05 },
  { name: "Sore throat", count: 8700, severeShare: 0.04 },
  { name: "Body aches", count: 7600, severeShare: 0.07 },
  { name: "Breathlessness", count: 5400, severeShare: 0.34 },
  { name: "Loss of smell", count: 3900, severeShare: 0.09 },
];

export const stateVaccination = [
  { state: "KL", full: 84, partial: 11, none: 5 },
  { state: "DL", full: 78, partial: 13, none: 9 },
  { state: "MH", full: 74, partial: 14, none: 12 },
  { state: "KA", full: 80, partial: 12, none: 8 },
  { state: "TN", full: 76, partial: 14, none: 10 },
  { state: "GJ", full: 71, partial: 16, none: 13 },
  { state: "TG", full: 73, partial: 15, none: 12 },
  { state: "WB", full: 68, partial: 17, none: 15 },
  { state: "UP", full: 61, partial: 19, none: 20 },
  { state: "RJ", full: 67, partial: 18, none: 15 },
  { state: "MP", full: 63, partial: 19, none: 18 },
  { state: "BR", full: 58, partial: 21, none: 21 },
];

export const vaccines = [
  { name: "Covishield", maker: "Serum Institute of India", efficacy: "70-90%", doses: 2, interval: "12 weeks", storage: "2–8°C", side: "Mild fever, soreness" },
  { name: "Covaxin", maker: "Bharat Biotech", efficacy: "78%", doses: 2, interval: "4–6 weeks", storage: "2–8°C", side: "Headache, fatigue" },
  { name: "Corbevax", maker: "Biological E", efficacy: "80%", doses: 2, interval: "4 weeks", storage: "2–8°C", side: "Pain at site" },
  { name: "Sputnik V", maker: "Gamaleya / Dr. Reddy's", efficacy: "91%", doses: 2, interval: "3 weeks", storage: "−18°C", side: "Flu-like symptoms" },
];

export const myPassport = {
  uid: "demo-citizen-001",
  name: "Aarav Sharma",
  age: 32,
  bloodType: "O+",
  vaccination: { status: "Vaccinated" as const, doses: 2, lastVaccine: "Covishield", lastDate: "2024-08-12", batch: "4121Z01" },
  allergies: ["Penicillin", "Peanuts"],
  conditions: ["Mild Asthma"],
  medications: ["Salbutamol Inhaler — as needed"],
  emergencyContacts: [
    { name: "Priya Sharma (Spouse)", phone: "+91 98201 12345" },
    { name: "Dr. Mehta", phone: "+91 98455 67890" },
  ],
  doses: [
    { n: 1, vaccine: "Covishield", date: "2024-02-08", site: "Govt PHC Koramangala", batch: "4118A03", verified: true },
    { n: 2, vaccine: "Covishield", date: "2024-08-12", site: "Apollo Hospital Bannerghatta", batch: "4121Z01", verified: true },
  ],
  recentScans: [
    { name: "Aarav Sharma", initials: "AS", bloodType: "O+", doses: 2, status: "Vaccinated" },
    { name: "Priya Sharma", initials: "PS", bloodType: "A+", doses: 2, status: "Vaccinated" },
    { name: "Rohan Iyer", initials: "RI", bloodType: "B+", doses: 1, status: "Partial" },
    { name: "Meera Khan", initials: "MK", bloodType: "AB-", doses: 0, status: "Unvaccinated" },
  ],
};

export const districtContacts = [
  { name: "District Health Officer", phone: "080-22221188" },
  { name: "SDRF Karnataka", phone: "080-22340676" },
  { name: "COVID War Room BBMP", phone: "1912" },
];

export const facilities = [
  { id: "f1", name: "Victoria Hospital", type: "Government", address: "Fort, Bengaluru", lat: 12.9622, lng: 77.5749, phone: "080-26703294", open24hr: true, hasEmergency: true, hasOxygen: true },
  { id: "f2", name: "Manipal Hospital", type: "Private", address: "Old Airport Rd", lat: 12.9583, lng: 77.6488, phone: "080-25023700", open24hr: true, hasEmergency: true, hasOxygen: true },
  { id: "f3", name: "Apollo Hospital", type: "Private", address: "Bannerghatta Rd", lat: 12.8949, lng: 77.5985, phone: "080-26304050", open24hr: true, hasEmergency: true, hasOxygen: true },
  { id: "f4", name: "Bowring Hospital", type: "Government", address: "Shivajinagar", lat: 12.9846, lng: 77.6034, phone: "080-25591362", open24hr: true, hasEmergency: true, hasOxygen: false },
  { id: "f5", name: "Fortis Hospital", type: "Private", address: "Cunningham Rd", lat: 12.9899, lng: 77.5912, phone: "080-66214444", open24hr: true, hasEmergency: true, hasOxygen: true },
  { id: "f6", name: "St. John's Medical College", type: "Private", address: "Koramangala", lat: 12.9279, lng: 77.6271, phone: "080-22065000", open24hr: true, hasEmergency: true, hasOxygen: true },
  { id: "f7", name: "PHC Koramangala", type: "Government", address: "Koramangala 4th Block", lat: 12.9352, lng: 77.6245, phone: "080-25503344", open24hr: false, hasEmergency: false, hasOxygen: false },
  { id: "f8", name: "Narayana Health City", type: "Private", address: "Bommasandra", lat: 12.8009, lng: 77.6989, phone: "080-71222222", open24hr: true, hasEmergency: true, hasOxygen: true },
];
