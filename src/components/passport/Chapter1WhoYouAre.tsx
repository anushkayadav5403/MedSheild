import { usePassportStore } from '@/lib/passportStore';
import { User } from 'lucide-react';

export default function Chapter1WhoYouAre() {
  const { passportData, updatePassportData } = usePassportStore();

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-teal/10 grid place-items-center border border-teal/20">
            <User className="h-5 w-5 text-teal" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg leading-tight">Basic Information</h3>
            <p className="text-[11px] text-mid">This information helps medical professionals identify you.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-muted font-bold">Full Legal Name *</label>
            <input
              type="text"
              value={passportData.fullName || ''}
              onChange={(e) => updatePassportData({ fullName: e.target.value })}
              placeholder="John Michael Doe"
              className="input-base w-full bg-white/5 border-white/10 text-white placeholder:text-white/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-muted font-bold">Date of Birth *</label>
            <input
              type="date"
              value={passportData.dateOfBirth || ''}
              onChange={(e) => updatePassportData({ dateOfBirth: e.target.value })}
              className="input-base w-full font-mono bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-muted font-bold">Gender *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['male', 'female', 'non-binary', 'other'].map((g) => (
                <button
                  key={g}
                  onClick={() => updatePassportData({ gender: g })}
                  className={`py-2 rounded-md text-xs font-bold capitalize transition-all ${
                    passportData.gender === g 
                      ? 'bg-teal text-[#031B1D] border border-teal shadow-[0_0_15px_rgba(0,255,209,0.3)]' 
                      : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-muted font-bold">Height (cm)</label>
              <input
                type="number"
                value={passportData.height || ''}
                onChange={(e) => updatePassportData({ height: e.target.value })}
                placeholder="175"
                className="input-base w-full font-mono bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-muted font-bold">Weight (kg)</label>
              <input
                type="number"
                value={passportData.weight || ''}
                onChange={(e) => updatePassportData({ weight: e.target.value })}
                placeholder="70"
                className="input-base w-full font-mono bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
