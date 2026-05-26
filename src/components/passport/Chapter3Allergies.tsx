import { useState } from 'react';
import { usePassportStore, AllergyDetail } from '@/lib/passportStore';
import { Plus, X, ShieldAlert } from 'lucide-react';

const CATEGORIES = ['Drug', 'Food', 'Environmental', 'Other'] as const;

const COMMON_ALLERGIES: Record<string, string[]> = {
  Drug: ['Penicillin', 'Sulfa drugs', 'Aspirin', 'NSAIDs', 'Contrast dye', 'Codeine', 'Morphine'],
  Food: ['Peanuts', 'Tree nuts', 'Shellfish', 'Milk', 'Eggs', 'Wheat', 'Soy'],
  Environmental: ['Latex', 'Bee stings', 'Pollen', 'Dust mites', 'Pet dander'],
  Other: ['Contrast media', 'Fragrance', 'Adhesive tape'],
};

export default function Chapter3Allergies() {
  const { passportData, updatePassportData } = usePassportStore();
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('Drug');
  const [customAllergy, setCustomAllergy] = useState('');

  const allergyDetails = passportData.allergyDetails || [];

  const addAllergy = (name: string) => {
    if (allergyDetails.some(a => a.name === name)) return;
    
    const newDetail: AllergyDetail = {
      name,
      category,
      severity: 'Moderate',
      reaction: '',
      hasEpiPen: false
    };

    updatePassportData({
      allergyDetails: [...allergyDetails, newDetail],
      allergies: [...(passportData.allergies || []), name]
    });
  };

  const updateDetail = (index: number, detail: Partial<AllergyDetail>) => {
    const updated = [...allergyDetails];
    updated[index] = { ...updated[index], ...detail };
    updatePassportData({ allergyDetails: updated });
  };

  const removeAllergy = (index: number) => {
    const nameToRemove = allergyDetails[index].name;
    updatePassportData({
      allergyDetails: allergyDetails.filter((_, i) => i !== index),
      allergies: (passportData.allergies || []).filter(a => a !== nameToRemove)
    });
  };

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <h3 className="font-display font-bold text-lg mb-1">What Your Body Rejects</h3>
        <p className="text-sm text-mid mb-6">Critical information that could prevent a life-threatening reaction</p>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                category === cat 
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/50' 
                  : 'bg-input-bg text-mid border border-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {COMMON_ALLERGIES[category].map((allergy) => (
            <button
              key={allergy}
              onClick={() => addAllergy(allergy)}
              className="panel flex items-center justify-between p-3 text-sm hover:bg-white/[0.03] transition-all"
            >
              <span>{allergy}</span>
              <Plus className="h-4 w-4 text-muted" />
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={customAllergy}
            onChange={(e) => setCustomAllergy(e.target.value)}
            placeholder="Add custom allergy..."
            className="input-base flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && customAllergy) {
                addAllergy(customAllergy);
                setCustomAllergy('');
              }
            }}
          />
          <button
            onClick={() => {
              if (customAllergy) {
                addAllergy(customAllergy);
                setCustomAllergy('');
              }
            }}
            className="panel p-3 bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 transition-all"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {allergyDetails.map((detail, index) => (
          <div 
            key={index} 
            className="panel p-5 space-y-4 relative"
            style={detail.severity === 'Severe' ? { border: '1px solid var(--red)', background: 'var(--red-dim)' } : {}}
          >
            <button 
              onClick={() => removeAllergy(index)}
              className="absolute top-4 right-4 text-muted hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <div className="font-display font-bold text-lg">{detail.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-muted font-mono">{detail.category} Allergy</div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-muted font-bold">Severity</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Mild', 'Moderate', 'Severe'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => updateDetail(index, { severity: s })}
                    className={`py-2 rounded-md text-xs font-bold transition-all ${
                      detail.severity === s 
                        ? (s === 'Severe' ? 'bg-red text-white' : 'bg-white/20 text-white') 
                        : 'bg-input-bg text-mid'
                    }`}
                    style={detail.severity === s && s === 'Severe' ? { background: 'var(--red)' } : {}}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <input
                type="text"
                value={detail.reaction || ''}
                onChange={(e) => updateDetail(index, { reaction: e.target.value })}
                placeholder="Describe the reaction (optional)..."
                className="input-base w-full bg-black/20"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={detail.hasEpiPen}
                  onChange={(e) => updateDetail(index, { hasEpiPen: e.target.checked })}
                  className="peer h-5 w-5 appearance-none rounded border border-border bg-input-bg checked:bg-teal checked:border-teal transition-all"
                />
                <Plus className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
              </div>
              <span className="text-sm text-mid group-hover:text-white transition-colors">I carry an EpiPen</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
