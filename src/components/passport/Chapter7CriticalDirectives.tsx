import { usePassportStore } from '@/lib/passportStore';
import { ShieldAlert, Heart, Activity } from 'lucide-react';

export default function Chapter7CriticalDirectives() {
  const { passportData, updatePassportData } = usePassportStore();

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-red-500/10 grid place-items-center border border-red-500/20">
            <ShieldAlert className="h-5 w-5 text-red" style={{ color: 'var(--red)' }} />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg leading-tight">Critical Medical Directives</h3>
            <p className="text-[11px] text-mid">Informs healthcare providers of your wishes in emergencies.</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-4 panel cursor-pointer hover:bg-white/[0.03] transition-all">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-red" style={{ color: 'var(--red)' }} />
              <div>
                <div className="font-bold text-sm">Organ Donor</div>
                <div className="text-[11px] text-muted mt-0.5">I consent to organ donation after death</div>
              </div>
            </div>
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={passportData.organDonor || false}
                onChange={(e) => updatePassportData({ organDonor: e.target.checked })}
                className="peer h-6 w-6 appearance-none rounded border border-border bg-input-bg checked:bg-red checked:border-red transition-all"
                style={{ accentColor: 'var(--red)' }}
              />
              <Heart className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
            </div>
          </label>

          <label className="flex items-center justify-between p-4 panel cursor-pointer hover:bg-white/[0.03] transition-all">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-amber-500" />
              <div>
                <div className="font-bold text-sm text-amber-500">Do Not Resuscitate (DNR)</div>
                <div className="text-[11px] text-muted mt-0.5">Do not attempt cardiopulmonary resuscitation</div>
              </div>
            </div>
            <div className="relative flex items-center justify-center">
              <input
                type="checkbox"
                checked={passportData.dnr || false}
                onChange={(e) => updatePassportData({ dnr: e.target.checked })}
                className="peer h-6 w-6 appearance-none rounded border border-border bg-input-bg checked:bg-amber-500 checked:border-amber-500 transition-all"
              />
              <Activity className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
            </div>
          </label>

          <div className="space-y-1.5 mt-4">
            <label className="text-[10px] uppercase tracking-wider text-muted font-bold">Advance Directive (Optional)</label>
            <textarea
              value={passportData.advanceDirective || ''}
              onChange={(e) => updatePassportData({ advanceDirective: e.target.value })}
              placeholder="Any additional healthcare directives or wishes..."
              rows={4}
              className="input-base w-full resize-none bg-black/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
