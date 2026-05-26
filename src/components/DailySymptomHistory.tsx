import { useState } from 'react';

type CheckInStatus = 'ok' | 'mild' | 'bad' | 'none';

interface DayCheckIn {
  date: string;
  status: CheckInStatus;
}

export function DailySymptomHistory() {
  const [history] = useState<DayCheckIn[]>([
    { date: 'Mon', status: 'ok' },
    { date: 'Tue', status: 'ok' },
    { date: 'Wed', status: 'mild' },
    { date: 'Thu', status: 'ok' },
    { date: 'Fri', status: 'none' },
    { date: 'Sat', status: 'none' },
    { date: 'Sun', status: 'none' },
  ]);
  
  const getStatusColor = (status: CheckInStatus) => {
    switch (status) {
      case 'ok': return 'var(--mild)';
      case 'mild': return 'var(--moderate)';
      case 'bad': return 'var(--red)';
      default: return 'transparent';
    }
  };
  
  return (
    <div className="panel">
      <div className="font-display font-bold text-lg mb-3">
        Daily Symptom Check-in
      </div>
      <div className="grid grid-cols-7 gap-2 mb-3">
        {history.map((day, idx) => (
          <div key={idx} className="text-center">
            <div className="text-[9px] text-muted mb-1">{day.date}</div>
            <div 
              className="h-10 rounded-md" 
              style={{
                background: getStatusColor(day.status),
                border: day.status === 'none' ? '1px dashed var(--border)' : 'none'
              }} 
            />
          </div>
        ))}
      </div>
      <button className="btn-primary w-full">Check In Today</button>
    </div>
  );
}
