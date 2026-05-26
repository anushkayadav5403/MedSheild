import { usePassportStore } from '@/lib/passportStore';
import { Droplet } from 'lucide-react';

const BLOOD_TYPES = [
  { type: 'O-', label: 'Universal donor' },
  { type: 'O+', label: 'Most common' },
  { type: 'A-', label: 'Rare' },
  { type: 'A+', label: 'Common' },
  { type: 'B-', label: 'Rare' },
  { type: 'B+', label: 'Common' },
  { type: 'AB-', label: 'Rarest' },
  { type: 'AB+', label: 'Universal recipient' },
];

export default function Chapter2Blood() {
  const { passportData, updatePassportData } = usePassportStore();

  const handleSelect = (type: string) => {
    updatePassportData({ bloodType: type });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display font-bold text-lg mb-1">Your Blood Type</h3>
        <p className="text-sm text-mid">The single most critical piece of emergency information</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {BLOOD_TYPES.map((bt) => {
          const selected = passportData.bloodType === bt.type;
          return (
            <button
              key={bt.type}
              onClick={() => handleSelect(bt.type)}
              className="panel flex flex-col items-center justify-center p-4 transition-all"
              style={selected ? { border: '1px solid var(--red)', background: 'var(--red-dim)' } : {}}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Droplet className={`h-4 w-4 ${selected ? 'text-red' : 'text-muted'}`} style={selected ? { color: 'var(--red)' } : {}} />
                <span className={`font-display font-bold text-lg ${selected ? 'text-white' : 'text-mid'}`}>{bt.type}</span>
              </div>
              <div className="text-[10px] text-muted font-mono uppercase tracking-wider">{bt.label}</div>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => handleSelect('unknown')}
        className="w-full panel py-3 text-sm text-mid hover:bg-white/[0.03] transition-colors"
        style={passportData.bloodType === 'unknown' ? { border: '1px solid var(--red)', background: 'var(--red-dim)' } : {}}
      >
        I don't know my blood type
      </button>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-muted font-bold">Rh Factor (if known)</label>
          <input
            type="text"
            value={passportData.rhFactor || ''}
            onChange={(e) => updatePassportData({ rhFactor: e.target.value })}
            placeholder="e.g., Positive, Negative"
            className="input-base w-full bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wider text-muted font-bold">Rare Antigens (if known)</label>
          <input
            type="text"
            value={passportData.rareAntigens || ''}
            onChange={(e) => updatePassportData({ rareAntigens: e.target.value })}
            placeholder="e.g., Kell, Duffy"
            className="input-base w-full bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
      </div>

      {passportData.bloodType && passportData.bloodType !== 'unknown' && (
        <div className="panel p-5 relative overflow-hidden" style={{ background: 'var(--red-dim)', border: '1px solid var(--red)' }}>
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 rounded-full grid place-items-center bg-red/20" style={{ background: 'rgba(232,32,42,0.1)' }}>
              <Droplet className="h-6 w-6 text-red" style={{ color: 'var(--red)' }} />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted font-bold">Your Blood Type</div>
              <div className="font-display font-extrabold text-3xl text-white mt-0.5">{passportData.bloodType}</div>
            </div>
          </div>
          <p className="text-[11px] text-mid mt-4 relative z-10">
            This will be displayed prominently on your passport card
          </p>
          <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full blur-3xl opacity-20" style={{ background: 'var(--red)' }} />
        </div>
      )}
    </div>
  );
}
