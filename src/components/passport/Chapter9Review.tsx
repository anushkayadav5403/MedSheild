import { useNavigate } from '@tanstack/react-router';
import { usePassportStore } from '@/lib/passportStore';
import { CheckCircle2, AlertCircle, Loader2, ShieldCheck, User, Droplet, AlertTriangle, Pill, Users, Activity, Syringe } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/useAuth';
import { savePassportToFirestore } from '@/lib/passportFirestore';
import { useState } from 'react';

export default function Chapter9Review() {
  const navigate = useNavigate();
  const { passportData, completeInterview } = usePassportStore();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const handleComplete = async () => {
    if (!user) {
      toast.error('Please sign in to save your passport to the cloud.');
      return;
    }

    setSaving(true);
    try {
      // Automatically sync to cloud on completion
      await savePassportToFirestore(user.uid, { 
        ...passportData, 
        qrCodeId: user.uid,
        lastUpdated: new Date().toISOString() 
      });
      completeInterview();
      toast.success('Health Passport synced to cloud ✓');
      navigate({ to: '/passport' });
    } catch (e) {
      console.error('Save failed:', e);
      toast.error('Failed to sync to cloud. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const isComplete = passportData.fullName && passportData.dateOfBirth && passportData.gender;

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-teal/10 grid place-items-center border border-teal/20">
            <ShieldCheck className="h-5 w-5 text-teal" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg leading-tight">Review Your Information</h3>
            <p className="text-[11px] text-mid">Please review all the information you've provided before finishing.</p>
          </div>
        </div>

        {!isComplete && (
          <div className="mb-6 p-4 rounded-md flex items-center gap-3 bg-red/10 border border-red/20 text-red" style={{ background: 'rgba(232,32,42,0.1)', border: '1px solid rgba(232,32,42,0.2)', color: 'var(--red)' }}>
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="text-xs font-bold">Please complete the required fields in Chapter 1 (Who You Are) before finishing.</div>
          </div>
        )}

        <div className="space-y-4">
          {/* Chapter 1: Who You Are */}
          <ReviewSection 
            title="1. Who You Are" 
            icon={<User className="h-4 w-4" />} 
            complete={!!passportData.fullName}
          >
            {passportData.fullName ? (
              <div className="text-[13px] space-y-1">
                <p><span className="text-muted">Name:</span> <span className="font-bold">{passportData.fullName}</span></p>
                <p><span className="text-muted">DOB:</span> <span className="font-mono">{passportData.dateOfBirth ? new Date(passportData.dateOfBirth).toLocaleDateString() : '—'}</span></p>
                <p><span className="text-muted">Gender:</span> <span className="font-bold capitalize">{passportData.gender}</span></p>
                {(passportData.height || passportData.weight) && (
                  <p><span className="text-muted">Metrics:</span> <span className="font-mono">{passportData.height || '—'}cm / {passportData.weight || '—'}kg</span></p>
                )}
              </div>
            ) : <p className="text-xs text-muted italic">Incomplete</p>}
          </ReviewSection>

          {/* Chapter 2: Blood */}
          <ReviewSection 
            title="2. Blood Type" 
            icon={<Droplet className="h-4 w-4" />} 
            complete={!!passportData.bloodType}
            accent="red"
          >
            {passportData.bloodType ? (
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-xl text-red" style={{ color: 'var(--red)' }}>{passportData.bloodType}</span>
                {passportData.rhFactor && <span className="text-xs font-bold text-muted uppercase">({passportData.rhFactor})</span>}
              </div>
            ) : <p className="text-xs text-muted italic">Not provided</p>}
          </ReviewSection>

          {/* Chapter 3: Allergies */}
          <ReviewSection 
            title="3. Allergies" 
            icon={<AlertTriangle className="h-4 w-4" />} 
            complete={!!(passportData.allergyDetails?.length)}
            accent="amber"
          >
            {passportData.allergyDetails && passportData.allergyDetails.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {passportData.allergyDetails.map((a, i) => (
                  <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded bg-red/20 text-red border border-red/20" style={{ color: 'var(--red)', background: 'var(--red-dim)', borderColor: 'var(--red)' }}>
                    {a.name} ({a.severity})
                  </span>
                ))}
              </div>
            ) : <p className="text-xs text-muted italic">No allergies listed</p>}
          </ReviewSection>

          {/* Chapter 4: Conditions */}
          <ReviewSection 
            title="4. Conditions" 
            icon={<Activity className="h-4 w-4" />} 
            complete={!!(passportData.conditionDetails?.length)}
          >
            {passportData.conditionDetails && passportData.conditionDetails.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {passportData.conditionDetails.map((c, i) => (
                  <span key={i} className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white border border-white/10">
                    {c.name}
                  </span>
                ))}
              </div>
            ) : <p className="text-xs text-muted italic">No conditions listed</p>}
          </ReviewSection>

          {/* Chapter 5: Medications */}
          <ReviewSection 
            title="5. Medications" 
            icon={<Pill className="h-4 w-4" />} 
            complete={!!(passportData.medications?.length)}
            accent="purple"
          >
            {passportData.medications && passportData.medications.length > 0 ? (
              <div className="space-y-1.5">
                {passportData.medications.map((m, i) => (
                  <div key={i} className="text-[11px]">
                    <span className="font-bold">• {m.name}</span>
                    <span className="text-muted font-mono ml-2">{m.dosage} {m.frequency}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-muted italic">No medications listed</p>}
          </ReviewSection>

          {/* Chapter 6: Emergency Contacts */}
          <ReviewSection 
            title="6. Your People" 
            icon={<Users className="h-4 w-4" />} 
            complete={!!(passportData.emergencyContacts?.length)}
            accent="blue"
          >
            {passportData.emergencyContacts && passportData.emergencyContacts.length > 0 ? (
              <div className="space-y-1.5">
                {passportData.emergencyContacts.map((c, i) => (
                  <div key={i} className="text-[11px]">
                    <span className="font-bold">{c.name}</span>
                    <span className="text-muted ml-2">({c.relationship})</span>
                    <span className="text-blue-400 font-mono ml-2">{c.phone}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-muted italic">No contacts added</p>}
          </ReviewSection>

          {/* Chapter 7: Critical Directives */}
          <ReviewSection 
            title="7. Critical Directives" 
            icon={<ShieldCheck className="h-4 w-4" />} 
            complete={true}
          >
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full ${passportData.organDonor ? 'bg-red' : 'bg-muted'}`} style={passportData.organDonor ? { background: 'var(--red)' } : {}} />
                <span className="text-[11px] font-bold">Organ Donor: {passportData.organDonor ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className={`h-1.5 w-1.5 rounded-full ${passportData.dnr ? 'bg-amber-500' : 'bg-muted'}`} />
                <span className="text-[11px] font-bold">DNR: {passportData.dnr ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </ReviewSection>

          {/* Chapter 8: Pandemic Record */}
          <ReviewSection 
            title="8. Pandemic Record" 
            icon={<Syringe className="h-4 w-4" />} 
            complete={true}
          >
            <div className="flex gap-4">
              <div className="text-[11px]"><span className="text-muted">Vaccinations:</span> <span className="font-mono font-bold">{passportData.vaccinations?.length || 0}</span></div>
              <div className="text-[11px]"><span className="text-muted">COVID Tests:</span> <span className="font-mono font-bold">{passportData.covidTestHistory?.length || 0}</span></div>
            </div>
          </ReviewSection>
        </div>

        <button
          onClick={handleComplete}
          disabled={!isComplete || saving}
          className="btn-primary w-full mt-8 py-3.5 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Syncing to Cloud...
            </>
          ) : !user ? (
            'Sign In to Finish & Sync'
          ) : (
            'Complete & Sync to Cloud'
          )}
        </button>
      </div>
    </div>
  );
}

function ReviewSection({ title, icon, complete, children, accent }: { 
  title: string; 
  icon: React.ReactNode; 
  complete: boolean; 
  children: React.ReactNode;
  accent?: 'red' | 'amber' | 'purple' | 'blue' | 'teal';
}) {
  const accentColor = accent ? `var(--${accent})` : 'var(--teal)';
  return (
    <div className="p-4 panel bg-black/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="text-muted" style={complete ? { color: accentColor } : {}}>{icon}</div>
          <div className="text-[10px] uppercase tracking-wider font-bold text-muted">{title}</div>
        </div>
        {complete && <CheckCircle2 className="h-3.5 w-3.5 text-teal" />}
      </div>
      <div className="pl-6">
        {children}
      </div>
    </div>
  );
}
