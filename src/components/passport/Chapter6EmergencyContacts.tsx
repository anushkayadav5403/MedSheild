import { usePassportStore, EmergencyContact } from '@/lib/passportStore';
import { Plus, X, Users } from 'lucide-react';

export default function Chapter6EmergencyContacts() {
  const { passportData, updatePassportData } = usePassportStore();

  const emergencyContacts = passportData.emergencyContacts || [];

  const addContact = () => {
    const newContact: EmergencyContact = {
      name: '',
      relationship: '',
      phone: '',
      secondaryPhone: '',
      canMakeMedicalDecisions: false
    };

    updatePassportData({
      emergencyContacts: [...emergencyContacts, newContact],
    });
  };

  const updateContact = (index: number, detail: Partial<EmergencyContact>) => {
    const updated = [...emergencyContacts];
    updated[index] = { ...updated[index], ...detail };
    updatePassportData({ emergencyContacts: updated });
  };

  const removeContact = (index: number) => {
    updatePassportData({
      emergencyContacts: emergencyContacts.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <h3 className="font-display font-bold text-lg mb-1">Your People</h3>
        <p className="text-sm text-mid mb-6">Who to call when you cannot speak</p>

        <button
          onClick={addContact}
          className="w-full panel py-3 flex items-center justify-center gap-2 text-sm text-blue-400 border-dashed border-2 border-blue-400/30 bg-blue-400/5 hover:bg-blue-400/10 transition-all"
        >
          <Plus className="h-4 w-4" />
          Add Emergency Contact
        </button>
      </div>

      <div className="space-y-4">
        {emergencyContacts.map((contact, index) => (
          <div key={index} className="panel p-5 space-y-4 relative">
            <button 
              onClick={() => removeContact(index)}
              className="absolute top-4 right-4 text-muted hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="font-display font-bold text-lg flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              Contact {index + 1}
            </div>

            <div className="space-y-3">
              <input
                type="text"
                value={contact.name}
                onChange={(e) => updateContact(index, { name: e.target.value })}
                placeholder="Name"
                className="input-base w-full bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
              <input
                type="text"
                value={contact.relationship}
                onChange={(e) => updateContact(index, { relationship: e.target.value })}
                placeholder="Relationship (e.g., Spouse, Parent)"
                className="input-base w-full bg-white/5 border-white/10 text-white placeholder:text-white/30"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => updateContact(index, { phone: e.target.value })}
                  placeholder="Phone number"
                  className="input-base w-full bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
                <input
                  type="tel"
                  value={contact.secondaryPhone || ''}
                  onChange={(e) => updateContact(index, { secondaryPhone: e.target.value })}
                  placeholder="Secondary phone"
                  className="input-base w-full bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={contact.canMakeMedicalDecisions}
                    onChange={(e) => updateContact(index, { canMakeMedicalDecisions: e.target.checked })}
                    className="peer h-5 w-5 appearance-none rounded border border-white/20 bg-white/5 checked:bg-blue-400 checked:border-blue-400 transition-all shadow-inner"
                  />
                  <Plus className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-sm text-mid group-hover:text-white transition-colors">Can make medical decisions on my behalf</span>
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
