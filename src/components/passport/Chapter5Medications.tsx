import { useState } from 'react';
import { usePassportStore, MedicationDetail } from '@/lib/passportStore';
import { Plus, X, Pill } from 'lucide-react';

export default function Chapter5Medications() {
  const { passportData, updatePassportData } = usePassportStore();
  const [medName, setMedName] = useState('');

  const medications = passportData.medications || [];

  const addMedication = (name: string) => {
    if (medications.some(m => m.name === name)) return;
    
    const newMed: MedicationDetail = {
      name,
      dosage: '',
      frequency: '',
      reason: ''
    };

    updatePassportData({
      medications: [...medications, newMed]
    });
  };

  const updateMedication = (index: number, detail: Partial<MedicationDetail>) => {
    const updated = [...medications];
    updated[index] = { ...updated[index], ...detail };
    updatePassportData({ medications: updated });
  };

  const removeMedication = (index: number) => {
    updatePassportData({
      medications: medications.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <h3 className="font-display font-bold text-lg mb-1">What You Take</h3>
        <p className="text-sm text-mid mb-6">Current medications and supplements</p>

        <div className="flex gap-2">
          <input
            type="text"
            value={medName}
            onChange={(e) => setMedName(e.target.value)}
            placeholder="Medication name..."
            className="input-base flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && medName) {
                addMedication(medName);
                setMedName('');
              }
            }}
          />
          <button
            onClick={() => {
              if (medName) {
                addMedication(medName);
                setMedName('');
              }
            }}
            className="panel p-3 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-all"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {medications.map((med, index) => (
          <div key={index} className="panel p-5 space-y-3 relative">
            <button 
              onClick={() => removeMedication(index)}
              className="absolute top-4 right-4 text-muted hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Pill className="h-4 w-4 text-purple-400" />
              <div className="font-display font-bold text-lg">{med.name}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={med.dosage}
                  onChange={(e) => updateMedication(index, { dosage: e.target.value })}
                  placeholder="Dose (e.g., 500mg)"
                  className="input-base w-full bg-black/20"
                />
              </div>
              <div className="space-y-1.5">
                <input
                  type="text"
                  value={med.frequency}
                  onChange={(e) => updateMedication(index, { frequency: e.target.value })}
                  placeholder="Frequency (e.g., 2x daily)"
                  className="input-base w-full bg-black/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <input
                type="text"
                value={med.reason || ''}
                onChange={(e) => updateMedication(index, { reason: e.target.value })}
                placeholder="Reason for taking (optional)"
                className="input-base w-full bg-black/20"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
