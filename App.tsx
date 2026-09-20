import React, { useEffect, useState } from 'react';
import { AlertCircle, KeyRound, X } from 'lucide-react';
import { AttendanceRecord } from './types';
import { Navbar } from './components/Navbar';
import { StudentPresence } from './components/StudentPresence';
import { AdminDashboard } from './components/AdminDashboard';
import { MADRASAH_INFO } from './data/madrasahData';

const ADMIN_PIN_KEY = 'man1_admin_passcode';

export default function App() {
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isInsideGeofence, setIsInsideGeofence] = useState(true);
  const [gpsDistance, setGpsDistance] = useState(35);
  const [adminPin, setAdminPin] = useState(() => localStorage.getItem(ADMIN_PIN_KEY) || '3103');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setRecords(JSON.parse(localStorage.getItem('man1_local_attendance_records') || '[]'));
    } catch { setRecords([]); }
  }, []);

  const refreshRecords = () => {
    try { setRecords(JSON.parse(localStorage.getItem('man1_local_attendance_records') || '[]')); } catch { setRecords([]); }
  };
  const openAdmin = () => { if (isAdminAuthenticated) setActiveTab('admin'); else { setPinInput(''); setPinError(null); setPinModalOpen(true); } };
  const verifyPin = (event: React.FormEvent) => { event.preventDefault(); if (pinInput.trim() === adminPin) { setIsAdminAuthenticated(true); setPinModalOpen(false); setActiveTab('admin'); } else { setPinError('PIN salah! Silakan hubungi admin.'); setPinInput(''); } };
  const changePin = (value: string) => { localStorage.setItem(ADMIN_PIN_KEY, value); setAdminPin(value); };

  return <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
    <Navbar activeTab={activeTab} setActiveTab={setActiveTab} onOpenAdminAuth={openAdmin} isAdminAuthenticated={isAdminAuthenticated} isInsideGeofence={isInsideGeofence} gpsDistance={gpsDistance} />
    <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
      {activeTab === 'student' && <StudentPresence onRecordSubmitted={refreshRecords} onGpsUpdate={(inside, distance) => { setIsInsideGeofence(inside); setGpsDistance(distance); }} />}
      {activeTab === 'admin' && <AdminDashboard records={records} onRefreshData={refreshRecords} adminPin={adminPin} onChangePin={changePin} />}
    </main>
    <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-sm text-slate-500">{new Date().getFullYear()} {MADRASAH_INFO.name} · Sistem Presensi Sholat Siswa</footer>
    {pinModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40"><div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 shadow-xl relative"><button onClick={() => setPinModalOpen(false)} className="absolute top-3 right-3 p-2 text-slate-500" aria-label="Tutup"><X className="w-5 h-5" /></button><div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3"><KeyRound className="w-7 h-7" /></div><h3 className="font-extrabold text-xl text-center">Akses Guru</h3><p className="text-sm text-slate-500 text-center mt-1">Masukkan PIN untuk membuka rekap presensi.</p><form onSubmit={verifyPin} className="mt-5 space-y-4"><input type="password" inputMode="numeric" maxLength={10} autoFocus placeholder="Masukkan PIN" value={pinInput} onChange={(event) => { setPinInput(event.target.value); setPinError(null); }} className="w-full border border-slate-300 rounded-xl py-3 px-4 text-center text-xl tracking-[0.35em]" />{pinError && <p className="text-rose-600 text-sm font-semibold flex items-center justify-center gap-1"><AlertCircle className="w-4 h-4" />{pinError}</p>}<button type="submit" className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold">Buka Dashboard</button></form></div></div>}
  </div>;
}
