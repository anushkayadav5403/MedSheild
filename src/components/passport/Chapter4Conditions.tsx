import { useState } from 'react';
import { usePassportStore, ConditionDetail } from '@/lib/passportStore';
import { Plus, X, Search } from 'lucide-react';

const COMMON_CONDITIONS = [
  'Type 1 Diabetes', 'Type 2 Diabetes',
  'Hypertension', 'Asthma',
  'COPD', 'Epilepsy',
  'Heart Disease', 'Atrial Fibrillation',
  'Stroke History', 'Cancer (Active)'
];

export default function Chapter4Conditions() {
  const { passportData, updatePassportData } = usePassportStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [customCondition, setCustomCondition] = useState('');

  const conditionDetails = passportData.conditionDetails || [];

  const addCondition = (name: string) => {
    if (conditionDetails.some(c => c.name === name)) return;
    
    const newDetail: ConditionDetail = {
      name,
      notes: ''
    };

    updatePassportData({
      conditionDetails: [...conditionDetails, newDetail],
      conditions: [...(passportData.conditions || []), name]
    });
  };

  const updateDetail = (index: number, detail: Partial<ConditionDetail>) => {
    const updated = [...conditionDetails];
    updated[index] = { ...updated[index], ...detail };
    updatePassportData({ conditionDetails: updated });
  };

  const removeCondition = (index: number) => {
    const nameToRemove = conditionDetails[index].name;
    updatePassportData({
      conditionDetails: conditionDetails.filter((_, i) => i !== index),
      conditions: (passportData.conditions || []).filter(c => c !== nameToRemove)
    });
  };

  const filteredConditions = COMMON_CONDITIONS.filter(c => 
    c.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <h3 className="font-display font-bold text-lg mb-1">Conditions You Live With</h3>
        <p className="text-sm text-mid mb-6">Information that changes how doctors treat you</p>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conditions..."
            className="input-base w-full pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-6 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredConditions.map((condition) => (
            <button
              key={condition}
              onClick={() => addCondition(condition)}
              className="panel p-3 text-sm text-left hover:bg-white/[0.05] transition-all bg-white/[0.02]"
            >
              {condition}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={customCondition}
            onChange={(e) => setCustomCondition(e.target.value)}
            placeholder="Other condition..."
            className="input-base flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/30"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customCondition) {
                addCondition(customCondition);
                setCustomCondition('');
              }
            }}
          />
          <button
            onClick={() => {
              if (customCondition) {
                addCondition(customCondition);
                setCustomCondition('');
              }
            }}
            className="panel p-3 bg-teal/20 text-teal hover:bg-teal/30 transition-all"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {conditionDetails.map((detail, index) => (
          <div key={index} className="panel p-5 space-y-3 relative">
            <button 
              onClick={() => removeCondition(index)}
              className="absolute top-4 right-4 text-muted hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="font-display font-bold text-lg">{detail.name}</div>

            <textarea
              value={detail.notes || ''}
              onChange={(e) => updateDetail(index, { notes: e.target.value })}
              placeholder="Additional notes..."
              className="input-base w-full bg-white/5 border-white/10 text-white placeholder:text-white/30 min-h-[80px] py-2"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
