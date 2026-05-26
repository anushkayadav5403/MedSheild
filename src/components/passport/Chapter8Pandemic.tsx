import { useState } from 'react';
import { usePassportStore } from '@/lib/passportStore';
import { Plus, X, Syringe, TestTube } from 'lucide-react';

export default function Chapter8Pandemic() {
  const { passportData, updatePassportData } = usePassportStore();

  const [newVax, setNewVax] = useState({ vaccine: '', date: '', dose: 1, location: '', batch: '' });
  const [newTest, setNewTest] = useState({ date: '', result: 'negative' as 'positive' | 'negative', type: '' });

  const vaccinations = passportData.vaccinations || [];
  const covidTests = passportData.covidTestHistory || [];

  function addVax() {
    if (!newVax.vaccine.trim() || !newVax.date) return;
    updatePassportData({ vaccinations: [...vaccinations, newVax] });
    setNewVax({ vaccine: '', date: '', dose: 1, location: '', batch: '' });
  }

  function addTest() {
    if (!newTest.date || !newTest.type.trim()) return;
    updatePassportData({ covidTestHistory: [...covidTests, newTest] });
    setNewTest({ date: '', result: 'negative', type: '' });
  }

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-teal/10 grid place-items-center border border-teal/20">
            <Syringe className="h-5 w-5 text-teal" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg leading-tight">Pandemic & Vaccination Record</h3>
            <p className="text-[11px] text-mid">Track your vaccination history and COVID-19 test results.</p>
          </div>
        </div>

        {/* Vaccinations */}
        <div className="space-y-4">
          <div className="text-[10px] uppercase tracking-wider text-muted font-bold">Add Vaccination</div>

          <div className="panel p-4 space-y-3 bg-white/5 border border-white/10">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted font-bold">Vaccine Name *</label>
                <input type="text" value={newVax.vaccine} onChange={(e) => setNewVax({ ...newVax, vaccine: e.target.value })} placeholder="e.g. Pfizer COVID-19" className="input-base w-full text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted font-bold">Date *</label>
                <input type="date" value={newVax.date} onChange={(e) => setNewVax({ ...newVax, date: e.target.value })} className="input-base w-full text-sm font-mono bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted font-bold">Dose #</label>
                <input type="number" min="1" value={newVax.dose} onChange={(e) => setNewVax({ ...newVax, dose: parseInt(e.target.value) || 1 })} className="input-base w-full text-sm font-mono bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted font-bold">Location</label>
                <input type="text" value={newVax.location} onChange={(e) => setNewVax({ ...newVax, location: e.target.value })} placeholder="Clinic name" className="input-base w-full text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted font-bold">Batch ID</label>
                <input type="text" value={newVax.batch} onChange={(e) => setNewVax({ ...newVax, batch: e.target.value })} placeholder="e.g. 4121Z01" className="input-base w-full text-sm font-mono bg-white/5 border-white/10 text-white placeholder:text-white/30" />
              </div>
            </div>
            <button onClick={addVax} className="btn-primary w-full text-sm flex items-center justify-center gap-2 py-3 mt-2 bg-teal hover:bg-teal/80 text-[#031B1D]">
              <Plus className="h-4 w-4" /> Add Vaccination
            </button>
          </div>

          <div className="space-y-2">
            {vaccinations.map((v, i) => (
              <div key={i} className="flex items-center justify-between p-3 panel bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-teal/10 grid place-items-center font-mono font-bold text-teal text-xs">
                    {v.dose}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{v.vaccine}</div>
                    <div className="text-[10px] text-muted font-mono">{v.date}{v.location ? ` · ${v.location}` : ''}</div>
                  </div>
                </div>
                <button onClick={() => updatePassportData({ vaccinations: vaccinations.filter((_, j) => j !== i) })} className="text-muted hover:text-red transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* COVID Tests */}
        <div className="space-y-4 mt-8 pt-8 border-t border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <TestTube className="h-4 w-4 text-purple-400" />
            <div className="text-[10px] uppercase tracking-wider text-muted font-bold">COVID-19 Test History</div>
          </div>

          <div className="panel p-4 space-y-3 bg-white/5 border border-white/10">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted font-bold">Test Date *</label>
                <input type="date" value={newTest.date} onChange={(e) => setNewTest({ ...newTest, date: e.target.value })} className="input-base w-full text-sm font-mono bg-white/5 border-white/10 text-white" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider text-muted font-bold">Result *</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {['negative', 'positive'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setNewTest({ ...newTest, result: r as 'positive' | 'negative' })}
                      className={`py-2 rounded-md text-[10px] font-bold uppercase transition-all ${
                        newTest.result === r 
                          ? (r === 'positive' ? 'bg-red text-white shadow-[0_0_15px_rgba(232,32,42,0.3)]' : 'bg-teal text-[#031B1D] shadow-[0_0_15px_rgba(0,255,209,0.3)]') 
                          : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider text-muted font-bold">Test Type *</label>
              <input type="text" value={newTest.type} onChange={(e) => setNewTest({ ...newTest, type: e.target.value })} placeholder="e.g. PCR, Rapid Antigen" className="input-base w-full text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30" />
            </div>
            <button onClick={addTest} className="btn-primary w-full text-sm flex items-center justify-center gap-2 py-3 mt-2 bg-teal hover:bg-teal/80 text-[#031B1D]">
              <Plus className="h-4 w-4" /> Add Test Result
            </button>
          </div>

          <div className="space-y-2">
            {covidTests.map((t, i) => (
              <div key={i} className="flex items-center justify-between p-3 panel bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <div className={`h-2 w-2 rounded-full ${t.result === 'positive' ? 'bg-red animate-pulse' : 'bg-teal'}`} style={t.result === 'positive' ? { background: 'var(--red)' } : {}} />
                  <div>
                    <div className="text-sm font-bold flex items-center gap-2 text-white">
                      {t.type}
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${t.result === 'positive' ? 'bg-red/20 text-red' : 'bg-teal/20 text-teal'}`} style={t.result === 'positive' ? { color: 'var(--red)', background: 'var(--red-dim)' } : {}}>
                        {t.result.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted font-mono">{t.date}</div>
                  </div>
                </div>
                <button onClick={() => updatePassportData({ covidTestHistory: covidTests.filter((_, j) => j !== i) })} className="text-muted hover:text-red transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
