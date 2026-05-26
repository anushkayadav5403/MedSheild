import { useNavigate } from '@tanstack/react-router';
import { usePassportStore } from '@/lib/passportStore';
import { CheckCircle2, AlertCircle, Loader2, ShieldCheck, User, Droplet, AlertTriangle, Pill, Users, Activity, Syringe, Cloud } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/useAuth';
import { savePassportToFirestore } from '@/lib/passportFirestore';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Chapter9Review() {
  const navigate = useNavigate();
  const { passportData, completeInterview } = usePassportStore();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [portalNode, setPortalNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalNode(document.getElementById('final-sync-portal'));
  }, []);

  const handleComplete = async () => {
    console.log("HandleComplete triggered", { user: !!user, isComplete });
    if (!user) {
      toast.error('Please sign in to save your passport to the cloud.');
      return;
    }

    setSaving(true);
    try {
      const syncData = { 
        ...passportData, 
        qrCodeId: user.uid,
        lastUpdated: new Date().toISOString() 
      };
      console.log("Attempting Firestore save...", syncData);
      
      await savePassportToFirestore(user.uid, syncData);
      
      console.log("Firestore save successful");
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

  const isComplete = !!(passportData.fullName && passportData.dateOfBirth && passportData.gender);

  const finalButton = (
    <button
      onClick={handleComplete}
      disabled={!isComplete || saving}
      className={`px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
        !isComplete 
          ? 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5' 
          : 'bg-teal text-[#031B1D] hover:bg-teal/80 shadow-[0_0_20px_rgba(0,255,209,0.3)] active:scale-95'
      }`}
    >
      {saving ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Syncing...</span>
        </>
      ) : !user ? (
        <>
          <User className="h-4 w-4" />
          <span>Sign In to Sync</span>
        </>
      ) : (
        <>
          <Cloud className="h-4 w-4" />
          <span>Complete & Sync to Cloud</span>
        </>
      )}
    </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="panel bg-[#031B1D]/30 border-white/10 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-teal/10 grid place-items-center border border-teal/20 shadow-[0_0_15px_rgba(0,255,209,0.1)]">
            <ShieldCheck className="h-6 w-6 text-teal" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl text-white leading-tight">Review Your Information</h3>
            <p className="text-xs text-white/40 mt-1">Verify your health profile before cloud synchronization.</p>
          </div>
        </div>

        {!isComplete && (
          <div className="mb-6 p-4 rounded-xl flex items-center gap-4 bg-red/10 border border-red/20 text-red animate-pulse">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div className="text-xs font-bold">Incomplete: Please fill Name, DOB, and Gender in Chapter 1.</div>
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
              <div className="text-[13px] space-y-2 text-white/80">
                <p><span className="text-white/40 font-mono text-[10px] uppercase mr-2">Name</span> <span className="font-bold text-white">{passportData.fullName}</span></p>
                <p><span className="text-white/40 font-mono text-[10px] uppercase mr-2">DOB</span> <span className="font-mono">{passportData.dateOfBirth ? new Date(passportData.dateOfBirth).toLocaleDateString() : '—'}</span></p>
                <p><span className="text-white/40 font-mono text-[10px] uppercase mr-2">Gender</span> <span className="font-bold capitalize text-teal">{passportData.gender}</span></p>
                {(passportData.height || passportData.weight) && (
                  <p><span className="text-white/40 font-mono text-[10px] uppercase mr-2">Metrics</span> <span className="font-mono text-white/60">{passportData.height || '—'}cm / {passportData.weight || '—'}kg</span></p>
                )}
              </div>
            ) : <p className="text-xs text-white/20 italic">Missing critical information</p>}
          </ReviewSection>

          {/* Chapter 2: Blood */}
          <ReviewSection 
            title="2. Blood Type" 
            icon={<Droplet className="h-4 w-4" />} 
            complete={!!passportData.bloodType}
            accent="red"
          >
            {passportData.bloodType ? (
              <div className="flex items-center gap-3">
                <span className="font-display font-black text-2xl text-red" style={{ color: 'var(--red)' }}>{passportData.bloodType}</span>
                {passportData.rhFactor && <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/5">{passportData.rhFactor}</span>}
              </div>
            ) : <p className="text-xs text-white/20 italic">Not provided</p>}
          </ReviewSection>

          {/* Chapter 3: Allergies */}
          <ReviewSection 
            title="3. Allergies" 
            icon={<AlertTriangle className="h-4 w-4" />} 
            complete={!!(passportData.allergyDetails?.length)}
            accent="amber"
          >
            {passportData.allergyDetails && passportData.allergyDetails.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {passportData.allergyDetails.map((a, i) => (
                  <span key={i} className="text-[10px] font-bold px-3 py-1 rounded bg-red/10 text-red border border-red/20 uppercase tracking-tight" style={{ color: 'var(--red)', background: 'var(--red-dim)', borderColor: 'var(--red)' }}>
                    {a.name} ({a.severity})
                  </span>
                ))}
              </div>
            ) : <p className="text-xs text-white/20 italic">No allergies listed</p>}
          </ReviewSection>

          {/* Chapter 4: Conditions */}
          <ReviewSection 
            title="4. Conditions" 
            icon={<Activity className="h-4 w-4" />} 
            complete={!!(passportData.conditionDetails?.length)}
          >
            {passportData.conditionDetails && passportData.conditionDetails.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {passportData.conditionDetails.map((c, i) => (
                  <span key={i} className="text-[10px] font-bold px-3 py-1 rounded bg-white/5 text-white/80 border border-white/10 uppercase tracking-tight">
                    {c.name}
                  </span>
                ))}
              </div>
            ) : <p className="text-xs text-white/20 italic">No conditions listed</p>}
          </ReviewSection>

          {/* Chapter 5: Medications */}
          <ReviewSection 
            title="5. Medications" 
            icon={<Pill className="h-4 w-4" />} 
            complete={!!(passportData.medications?.length)}
            accent="purple"
          >
            {passportData.medications && passportData.medications.length > 0 ? (
              <div className="space-y-2">
                {passportData.medications.map((m, i) => (
                  <div key={i} className="text-[12px] flex items-center gap-3">
                    <span className="font-bold text-white">• {m.name}</span>
                    <span className="text-white/40 font-mono text-[10px]">{m.dosage} {m.frequency}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-white/20 italic">No medications listed</p>}
          </ReviewSection>

          {/* Chapter 6: Emergency Contacts */}
          <ReviewSection 
            title="6. Emergency Contacts" 
            icon={<Users className="h-4 w-4" />} 
            complete={!!(passportData.emergencyContacts?.length)}
            accent="blue"
          >
            {passportData.emergencyContacts && passportData.emergencyContacts.length > 0 ? (
              <div className="space-y-2">
                {passportData.emergencyContacts.map((c, i) => (
                  <div key={i} className="text-[12px] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white">{c.name}</span>
                      <span className="text-white/40 ml-2 text-[10px]">({c.relationship})</span>
                    </div>
                    <span className="text-blue-400 font-mono text-[11px]">{c.phone}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-white/20 italic">No contacts added</p>}
          </ReviewSection>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10 flex flex-col items-center">
           {!portalNode && finalButton}
           <p className="text-[10px] text-white/20 mt-4 font-medium uppercase tracking-[0.2em]">MedShield Intelligence Network</p>
        </div>
      </div>
      
      {portalNode && createPortal(finalButton, portalNode)}
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
    <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white/5" style={complete ? { color: accentColor, background: `${accentColor}10` } : {}}>{icon}</div>
          <div className="text-[10px] uppercase tracking-widest font-black text-white/40">{title}</div>
        </div>
        {complete ? (
          <CheckCircle2 className="h-4 w-4 text-teal shadow-[0_0_10px_rgba(0,255,209,0.3)]" />
        ) : (
          <AlertCircle className="h-4 w-4 text-white/10" />
        )}
      </div>
      <div className="pl-11">
        {children}
      </div>
    </div>
  );
}
