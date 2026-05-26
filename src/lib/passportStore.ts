import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  secondaryPhone?: string;
  canMakeMedicalDecisions?: boolean;
}

export interface AllergyDetail {
  name: string;
  category: 'Drug' | 'Food' | 'Environmental' | 'Other';
  severity: 'Mild' | 'Moderate' | 'Severe';
  reaction?: string;
  hasEpiPen?: boolean;
}

export interface ConditionDetail {
  name: string;
  notes?: string;
}

export interface MedicationDetail {
  name: string;
  dosage: string;
  frequency: string;
  reason?: string;
}

export interface HealthPassportData {
  // Chapter 1: Who You Are
  fullName: string;
  dateOfBirth: string;
  gender: string;
  height: string;
  weight: string;
  
  // Chapter 2: Blood
  bloodType: string;
  rhFactor: string;
  rareAntigens?: string;
  
  // Chapter 3: Allergies
  allergies: string[]; // Keeping for backward compatibility or simple lists
  allergyDetails?: AllergyDetail[];
  
  // Chapter 4: Conditions
  conditions: string[]; // Keeping for backward compatibility
  conditionDetails?: ConditionDetail[];
  
  // Chapter 5: Medications
  medications: MedicationDetail[];
  
  // Chapter 6: Emergency Contacts
  emergencyContacts: EmergencyContact[];
  
  // Chapter 7: Critical Directives
  organDonor: boolean;
  dnr: boolean;
  advanceDirective?: string;
  
  // Chapter 8: Pandemic/Vaccination Record
  vaccinations: Array<{
    vaccine: string;
    date: string;
    dose: number;
    location: string;
    batch?: string;
  }>;
  covidTestHistory: Array<{
    date: string;
    result: 'positive' | 'negative';
    type: string;
  }>;
  
  // Metadata
  lastUpdated: string;
  qrCodeId: string;
  privacyLevel: 'full' | 'emergency' | 'medical';
}

interface PassportStore {
  currentChapter: number;
  passportData: Partial<HealthPassportData>;
  isAuthenticated: boolean;
  userId: string | null;
  
  setChapter: (chapter: number) => void;
  updatePassportData: (data: Partial<HealthPassportData>) => void;
  setAuthenticated: (authenticated: boolean, userId?: string) => void;
  resetPassport: () => void;
  completeInterview: () => void;
}

export const usePassportStore = create<PassportStore>()(
  persist(
    (set) => ({
      currentChapter: 1,
      passportData: {},
      isAuthenticated: false,
      userId: null,
      
      setChapter: (chapter) => set({ currentChapter: chapter }),
      
      updatePassportData: (data) =>
        set((state) => ({
          passportData: { ...state.passportData, ...data },
        })),
      
      setAuthenticated: (authenticated, userId) =>
        set({ isAuthenticated: authenticated, userId: userId || null }),
      
      resetPassport: () =>
        set({
          currentChapter: 1,
          passportData: {},
        }),
      
      completeInterview: () =>
        set((state) => ({
          passportData: {
            ...state.passportData,
            lastUpdated: new Date().toISOString(),
            qrCodeId: `MEDSHIELD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })),
    }),
    {
      name: 'medshield-passport-storage',
    }
  )
);
