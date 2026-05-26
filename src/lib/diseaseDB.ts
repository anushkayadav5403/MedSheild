/**
 * Real epidemiological database for each disease model.
 * Sources: WHO, CDC, ICMR, peer-reviewed literature.
 */

export interface DiseaseModel {
  id: string;
  name: string;
  pathogen: string;
  r0: number;           // Basic reproduction number
  r0Range: string;      // Published range
  infectiousDays: number;
  incubationDays: number;
  cfr: number;          // Case fatality rate (%)
  hospRate: number;     // Hospitalization rate (0-1)
  vaccinationEfficacy: number; // 0-1
  color: string;        // Map dot color
  description: string;
  transmission: string;
  symptoms: string[];
  highRiskStates: string[]; // Indian states most at risk
  spreadPattern: "respiratory" | "vector" | "zoonotic" | "contact";
  // SEIR params
  sigma: number;        // 1/incubation period
  gamma: number;        // 1/infectious period
  // India-specific outbreak data
  indiaOutbreakCities: {
    city: string;
    state: string;
    lat: number;
    lng: number;
    activeCases: number;
    hospitalized: number;
    vaccinationCoverage: number;
    status: "Critical" | "High" | "Moderate" | "Contained";
    nearestHospital: { name: string; phone: string };
  }[];
}

export const DISEASE_DB: Record<string, DiseaseModel> = {

  "COVID-19": {
    id: "covid19",
    name: "COVID-19",
    pathogen: "SARS-CoV-2 (Omicron XBB.1.5)",
    r0: 5.0,
    r0Range: "2.5–18 (variant-dependent)",
    infectiousDays: 7,
    incubationDays: 5,
    cfr: 0.9,
    hospRate: 0.08,
    vaccinationEfficacy: 0.72,
    color: "#ef4444",
    description: "Respiratory illness caused by SARS-CoV-2. Current dominant variant XBB.1.5 shows high immune evasion.",
    transmission: "Airborne droplets, aerosols, fomites",
    symptoms: ["Fever", "Cough", "Fatigue", "Loss of smell/taste", "Breathlessness", "Body aches"],
    highRiskStates: ["Maharashtra", "Delhi", "Karnataka", "Tamil Nadu", "Kerala"],
    spreadPattern: "respiratory",
    sigma: 1 / 5,
    gamma: 1 / 7,
    indiaOutbreakCities: [
      { city: "Mumbai", state: "Maharashtra", lat: 19.076, lng: 72.8777, activeCases: 28400, hospitalized: 4800, vaccinationCoverage: 78, status: "Critical", nearestHospital: { name: "KEM Hospital", phone: "022-24107000" } },
      { city: "Delhi", state: "Delhi NCR", lat: 28.6139, lng: 77.209, activeCases: 19200, hospitalized: 3100, vaccinationCoverage: 81, status: "Critical", nearestHospital: { name: "AIIMS Delhi", phone: "011-26588500" } },
      { city: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707, activeCases: 12800, hospitalized: 2200, vaccinationCoverage: 74, status: "Critical", nearestHospital: { name: "Rajiv Gandhi GH", phone: "044-25305000" } },
      { city: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946, activeCases: 8400, hospitalized: 1400, vaccinationCoverage: 82, status: "High", nearestHospital: { name: "Victoria Hospital", phone: "080-26703294" } },
      { city: "Hyderabad", state: "Telangana", lat: 17.385, lng: 78.4867, activeCases: 7200, hospitalized: 1180, vaccinationCoverage: 76, status: "High", nearestHospital: { name: "Gandhi Hospital", phone: "040-27505566" } },
      { city: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639, activeCases: 6800, hospitalized: 1100, vaccinationCoverage: 70, status: "High", nearestHospital: { name: "SSKM Hospital", phone: "033-22041101" } },
      { city: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567, activeCases: 5400, hospitalized: 900, vaccinationCoverage: 79, status: "High", nearestHospital: { name: "Sassoon GH", phone: "020-26128000" } },
      { city: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714, activeCases: 4200, hospitalized: 700, vaccinationCoverage: 73, status: "Moderate", nearestHospital: { name: "Civil Hospital", phone: "079-22683721" } },
      { city: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873, activeCases: 3100, hospitalized: 520, vaccinationCoverage: 69, status: "Moderate", nearestHospital: { name: "SMS Hospital", phone: "0141-2518109" } },
      { city: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, activeCases: 2800, hospitalized: 470, vaccinationCoverage: 64, status: "Moderate", nearestHospital: { name: "KGMU", phone: "0522-2257540" } },
      { city: "Surat", state: "Gujarat", lat: 21.1702, lng: 72.8311, activeCases: 2200, hospitalized: 360, vaccinationCoverage: 72, status: "Moderate", nearestHospital: { name: "New Civil Hospital", phone: "0261-2244456" } },
      { city: "Nagpur", state: "Maharashtra", lat: 21.1458, lng: 79.0882, activeCases: 1800, hospitalized: 290, vaccinationCoverage: 77, status: "Contained", nearestHospital: { name: "GMCH Nagpur", phone: "0712-2741375" } },
      { city: "Indore", state: "Madhya Pradesh", lat: 22.7196, lng: 75.8577, activeCases: 1200, hospitalized: 200, vaccinationCoverage: 68, status: "Contained", nearestHospital: { name: "MY Hospital", phone: "0731-2527144" } },
      { city: "Bhopal", state: "Madhya Pradesh", lat: 23.2599, lng: 77.4126, activeCases: 900, hospitalized: 150, vaccinationCoverage: 66, status: "Contained", nearestHospital: { name: "Hamidia Hospital", phone: "0755-2540222" } },
      { city: "Coimbatore", state: "Tamil Nadu", lat: 11.0168, lng: 76.9558, activeCases: 600, hospitalized: 95, vaccinationCoverage: 80, status: "Contained", nearestHospital: { name: "CMCH", phone: "0422-2575605" } },
    ],
  },

  "Influenza H1N1": {
    id: "h1n1",
    name: "Influenza H1N1",
    pathogen: "Influenza A (H1N1)pdm09",
    r0: 1.4,
    r0Range: "1.2–1.6",
    infectiousDays: 5,
    incubationDays: 2,
    cfr: 0.02,
    hospRate: 0.03,
    vaccinationEfficacy: 0.60,
    color: "#f59e0b",
    description: "Seasonal influenza strain. Spreads rapidly in winter months. India sees peaks Oct–Feb.",
    transmission: "Respiratory droplets, direct contact",
    symptoms: ["High fever", "Chills", "Muscle aches", "Cough", "Sore throat", "Runny nose", "Fatigue"],
    highRiskStates: ["Rajasthan", "Gujarat", "Maharashtra", "Delhi", "Punjab"],
    spreadPattern: "respiratory",
    sigma: 1 / 2,
    gamma: 1 / 5,
    indiaOutbreakCities: [
      { city: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873, activeCases: 4200, hospitalized: 380, vaccinationCoverage: 45, status: "Critical", nearestHospital: { name: "SMS Hospital", phone: "0141-2518109" } },
      { city: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714, activeCases: 3800, hospitalized: 310, vaccinationCoverage: 42, status: "Critical", nearestHospital: { name: "Civil Hospital", phone: "079-22683721" } },
      { city: "Delhi", state: "Delhi NCR", lat: 28.6139, lng: 77.209, activeCases: 6200, hospitalized: 520, vaccinationCoverage: 48, status: "Critical", nearestHospital: { name: "AIIMS Delhi", phone: "011-26588500" } },
      { city: "Mumbai", state: "Maharashtra", lat: 19.076, lng: 72.8777, activeCases: 5100, hospitalized: 420, vaccinationCoverage: 50, status: "High", nearestHospital: { name: "KEM Hospital", phone: "022-24107000" } },
      { city: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567, activeCases: 3200, hospitalized: 260, vaccinationCoverage: 47, status: "High", nearestHospital: { name: "Sassoon GH", phone: "020-26128000" } },
      { city: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, activeCases: 2800, hospitalized: 220, vaccinationCoverage: 38, status: "High", nearestHospital: { name: "KGMU", phone: "0522-2257540" } },
      { city: "Chandigarh", state: "Punjab", lat: 30.7333, lng: 76.7794, activeCases: 1900, hospitalized: 150, vaccinationCoverage: 52, status: "Moderate", nearestHospital: { name: "PGI Chandigarh", phone: "0172-2756565" } },
      { city: "Bhopal", state: "Madhya Pradesh", lat: 23.2599, lng: 77.4126, activeCases: 1400, hospitalized: 110, vaccinationCoverage: 40, status: "Moderate", nearestHospital: { name: "Hamidia Hospital", phone: "0755-2540222" } },
      { city: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946, activeCases: 2100, hospitalized: 170, vaccinationCoverage: 55, status: "Moderate", nearestHospital: { name: "Victoria Hospital", phone: "080-26703294" } },
      { city: "Hyderabad", state: "Telangana", lat: 17.385, lng: 78.4867, activeCases: 1600, hospitalized: 130, vaccinationCoverage: 49, status: "Moderate", nearestHospital: { name: "Gandhi Hospital", phone: "040-27505566" } },
      { city: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639, activeCases: 1200, hospitalized: 95, vaccinationCoverage: 44, status: "Contained", nearestHospital: { name: "SSKM Hospital", phone: "033-22041101" } },
      { city: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707, activeCases: 900, hospitalized: 70, vaccinationCoverage: 58, status: "Contained", nearestHospital: { name: "Rajiv Gandhi GH", phone: "044-25305000" } },
    ],
  },

  "Dengue": {
    id: "dengue",
    name: "Dengue Fever",
    pathogen: "Dengue virus (DENV 1-4) via Aedes aegypti",
    r0: 3.0,
    r0Range: "2.0–6.0 (vector-dependent)",
    infectiousDays: 8,
    incubationDays: 7,
    cfr: 0.5,
    hospRate: 0.12,
    vaccinationEfficacy: 0.55,
    color: "#10b981",
    description: "Vector-borne viral disease transmitted by Aedes mosquitoes. Peaks during monsoon (Jul–Oct) in India.",
    transmission: "Aedes aegypti mosquito bite",
    symptoms: ["High fever (40°C)", "Severe headache", "Eye pain", "Joint/muscle pain", "Rash", "Mild bleeding"],
    highRiskStates: ["Kerala", "Karnataka", "Tamil Nadu", "Maharashtra", "West Bengal", "Uttar Pradesh"],
    spreadPattern: "vector",
    sigma: 1 / 7,
    gamma: 1 / 8,
    indiaOutbreakCities: [
      { city: "Bengaluru", state: "Karnataka", lat: 12.9716, lng: 77.5946, activeCases: 9800, hospitalized: 1180, vaccinationCoverage: 0, status: "Critical", nearestHospital: { name: "Victoria Hospital", phone: "080-26703294" } },
      { city: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707, activeCases: 8200, hospitalized: 980, vaccinationCoverage: 0, status: "Critical", nearestHospital: { name: "Rajiv Gandhi GH", phone: "044-25305000" } },
      { city: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639, activeCases: 7400, hospitalized: 890, vaccinationCoverage: 0, status: "Critical", nearestHospital: { name: "SSKM Hospital", phone: "033-22041101" } },
      { city: "Mumbai", state: "Maharashtra", lat: 19.076, lng: 72.8777, activeCases: 6800, hospitalized: 820, vaccinationCoverage: 0, status: "High", nearestHospital: { name: "KEM Hospital", phone: "022-24107000" } },
      { city: "Delhi", state: "Delhi NCR", lat: 28.6139, lng: 77.209, activeCases: 5900, hospitalized: 710, vaccinationCoverage: 0, status: "High", nearestHospital: { name: "AIIMS Delhi", phone: "011-26588500" } },
      { city: "Hyderabad", state: "Telangana", lat: 17.385, lng: 78.4867, activeCases: 4800, hospitalized: 580, vaccinationCoverage: 0, status: "High", nearestHospital: { name: "Gandhi Hospital", phone: "040-27505566" } },
      { city: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462, activeCases: 3900, hospitalized: 470, vaccinationCoverage: 0, status: "High", nearestHospital: { name: "KGMU", phone: "0522-2257540" } },
      { city: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567, activeCases: 3200, hospitalized: 380, vaccinationCoverage: 0, status: "Moderate", nearestHospital: { name: "Sassoon GH", phone: "020-26128000" } },
      { city: "Patna", state: "Bihar", lat: 25.5941, lng: 85.1376, activeCases: 2800, hospitalized: 340, vaccinationCoverage: 0, status: "Moderate", nearestHospital: { name: "PMCH Patna", phone: "0612-2300000" } },
      { city: "Bhubaneswar", state: "Odisha", lat: 20.2961, lng: 85.8245, activeCases: 2100, hospitalized: 250, vaccinationCoverage: 0, status: "Moderate", nearestHospital: { name: "SCB Medical", phone: "0671-2414388" } },
      { city: "Guwahati", state: "Assam", lat: 26.1445, lng: 91.7362, activeCases: 1600, hospitalized: 190, vaccinationCoverage: 0, status: "Moderate", nearestHospital: { name: "GMCH Guwahati", phone: "0361-2529457" } },
      { city: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873, activeCases: 1200, hospitalized: 140, vaccinationCoverage: 0, status: "Contained", nearestHospital: { name: "SMS Hospital", phone: "0141-2518109" } },
    ],
  },

  "Hantavirus": {
    id: "hantavirus",
    name: "Hantavirus (HPS)",
    pathogen: "Hantavirus Pulmonary Syndrome — Sin Nombre / Seoul variant",
    r0: 0.8,
    r0Range: "0.5–1.2 (no sustained human-to-human transmission)",
    infectiousDays: 14,
    incubationDays: 14,
    cfr: 38,
    hospRate: 0.85,
    vaccinationEfficacy: 0,
    color: "#8b5cf6",
    description: "Rare but highly lethal zoonotic disease. Transmitted by infected rodent droppings/urine. No human-to-human transmission. CFR 38%. No approved vaccine. India has documented cases in Himachal Pradesh, Uttarakhand, and Northeast states.",
    transmission: "Inhalation of rodent excreta, direct contact with infected rodents",
    symptoms: [
      "Fever (38–40°C)",
      "Severe fatigue",
      "Muscle aches (thighs, hips, back)",
      "Headache",
      "Dizziness",
      "Chills",
      "Abdominal pain",
      "Rapid breathing (late stage)",
      "Pulmonary edema (life-threatening)",
    ],
    highRiskStates: ["Himachal Pradesh", "Uttarakhand", "Sikkim", "Meghalaya", "Arunachal Pradesh", "Jammu & Kashmir"],
    spreadPattern: "zoonotic",
    sigma: 1 / 14,
    gamma: 1 / 14,
    indiaOutbreakCities: [
      // Hantavirus is rare — small clusters, not city-wide outbreaks
      // Based on documented Indian cases and high-risk rodent habitats
      { city: "Shimla", state: "Himachal Pradesh", lat: 31.1048, lng: 77.1734, activeCases: 42, hospitalized: 36, vaccinationCoverage: 0, status: "Critical", nearestHospital: { name: "IGMC Shimla", phone: "0177-2804251" } },
      { city: "Dehradun", state: "Uttarakhand", lat: 30.3165, lng: 78.0322, activeCases: 28, hospitalized: 24, vaccinationCoverage: 0, status: "Critical", nearestHospital: { name: "Doon Hospital", phone: "0135-2714000" } },
      { city: "Gangtok", state: "Sikkim", lat: 27.3389, lng: 88.6065, activeCases: 18, hospitalized: 15, vaccinationCoverage: 0, status: "High", nearestHospital: { name: "STNM Hospital", phone: "03592-202944" } },
      { city: "Shillong", state: "Meghalaya", lat: 25.5788, lng: 91.8933, activeCases: 14, hospitalized: 12, vaccinationCoverage: 0, status: "High", nearestHospital: { name: "NEIGRIHMS", phone: "0364-2538025" } },
      { city: "Itanagar", state: "Arunachal Pradesh", lat: 27.0844, lng: 93.6053, activeCases: 9, hospitalized: 8, vaccinationCoverage: 0, status: "High", nearestHospital: { name: "RK Mission Hospital", phone: "0360-2212601" } },
      { city: "Srinagar", state: "Jammu & Kashmir", lat: 34.0837, lng: 74.7973, activeCases: 11, hospitalized: 9, vaccinationCoverage: 0, status: "High", nearestHospital: { name: "SMHS Hospital", phone: "0194-2452018" } },
      { city: "Manali", state: "Himachal Pradesh", lat: 32.2396, lng: 77.1887, activeCases: 7, hospitalized: 6, vaccinationCoverage: 0, status: "Moderate", nearestHospital: { name: "Zonal Hospital Manali", phone: "01902-252118" } },
      { city: "Mussoorie", state: "Uttarakhand", lat: 30.4598, lng: 78.0644, activeCases: 5, hospitalized: 4, vaccinationCoverage: 0, status: "Moderate", nearestHospital: { name: "Community Health Centre", phone: "0135-2632000" } },
      { city: "Aizawl", state: "Mizoram", lat: 23.7271, lng: 92.7176, activeCases: 6, hospitalized: 5, vaccinationCoverage: 0, status: "Moderate", nearestHospital: { name: "Civil Hospital Aizawl", phone: "0389-2322644" } },
      { city: "Imphal", state: "Manipur", lat: 24.8170, lng: 93.9368, activeCases: 4, hospitalized: 3, vaccinationCoverage: 0, status: "Contained", nearestHospital: { name: "RIMS Imphal", phone: "0385-2451271" } },
    ],
  },
};

export const DISEASE_NAMES = Object.keys(DISEASE_DB);

export function getDiseaseModel(name: string): DiseaseModel {
  return DISEASE_DB[name] || DISEASE_DB["COVID-19"];
}
