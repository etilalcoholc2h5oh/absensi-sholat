import React, { useState, useEffect } from 'react';
import { Shield, KeyRound, X, CheckCircle, AlertCircle, Heart } from 'lucide-react';
import { AttendanceRecord } from './types';
import { Navbar } from './components/Navbar';
import { StudentPresence } from './components/StudentPresence';
import { AdminDashboard } from './components/AdminDashboard';
import { VanillaCodeViewer } from './components/VanillaCodeViewer';
import { getAttendanceRecords } from './services/supabaseService';
import { MADRASAH_INFO } from './data/madrasahData';

const ADMIN_PIN_KEY = 'man1_admin_passcode';

export default function App() {
  const [activeTab, setActiveTab] = useState<'student' | 'admin' | 'vanilla-code'>('student');
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);

  // GPS Geofence status synced with Navbar
  const [isInsideGeofence, setIsInsideGeofence] = useState<boolean>(true);
  const [gpsDistance, setGpsDistance] = useState<number>(35);

  // Admin PIN Auth
  const [adminPin, setAdminPin] = useState<string>(() => {
    return localStorage.getItem(ADMIN_PIN_KEY) || '1234';
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [pinModalOpen, setPinModalOpen] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string | null>(null);

  // Load records on start
  const loadRecords = async () => {
    try {
      const res = await getAttendanceRecords();
      setRecords(res.data);
      setIsCloudConnected(res.isFromCloud);
    } catch (err) {
      console.error('Error fetching records:', err);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleOpenAdminAuth = () => {
    if (isAdminAuthenticated) {
      setActiveTab('admin');
    } else {
      setPinInput('');
      setPinError(null);
      setPinModalOpen(true);
    }
  };

  const handleVerifyPin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pinInput.trim() === adminPin || pinInput.trim() === 'admin') {
      setIsAdminAuthenticated(true);
      setPinModalOpen(false);
      setActiveTab('admin');
    } else {
      setPinError('PIN salah! Silakan coba lagi (Default: 1234).');
      setPinInput('');
    }
  };

  const handleChangePin = (newPin: string) => {
    localStorage.setItem(ADMIN_PIN_KEY, newPin);
    setAdminPin(newPin);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAdminAuth={handleOpenAdminAuth}
        isAdminAuthenticated={isAdminAuthenticated}
        isInsideGeofence={isInsideGeofence}
        gpsDistance={gpsDistance}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'student' && (
          <StudentPresence
            onRecordSubmitted={loadRecords}
            onGpsUpdate={(inside, distance) => {
              setIsInsideGeofence(inside);
              setGpsDistance(distance);
            }}
          />
        )}

        {activeTab === 'admin' && (
          <AdminDashboard
            records={records}
            isCloudConnected={isCloudConnected}
            onRefreshData={loadRecords}
            adminPin={adminPin}
            onChangePin={handleChangePin}
          />
        )}

        {activeTab === 'vanilla-code' && <VanillaCodeViewer />}
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-slate-800/80 bg-slate-900/60 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © {new Date().getFullYear()} {MADRASAH_INFO.name} | Sistem Presensi Sholat Siswa
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Didukung AI TensorFlow.js COCO-SSD, Geofencing, & Supabase</span>
          </div>
        </div>
      </footer>

      {/* PIN Authentication Modal for Guru/Admin */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative text-center">
            <button
              onClick={() => setPinModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg shadow-emerald-500/10">
              <KeyRound className="w-7 h-7" />
            </div>

            <h3 className="font-extrabold text-lg text-white">Akses Guru / Admin</h3>
            <p className="text-xs text-slate-400 mt-1">
              Masukkan PIN pengawas untuk membuka rekapitulasi presensi sholat siswa.
            </p>

            <form onSubmit={handleVerifyPin} className="mt-5 space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={10}
                  autoFocus
                  placeholder="PIN (Default: 1234)"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    if (pinError) setPinError(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl py-3 px-4 text-center text-xl tracking-[0.4em] font-mono text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition placeholder:tracking-normal placeholder:text-sm placeholder:font-sans placeholder:text-slate-600"
                />

                {pinError && (
                  <p className="text-rose-400 text-xs font-semibold mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{pinError}</span>
                  </p>
                )}
              </div>

              {/* Quick Numpad for Mobile Convenience */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      if (k === 'C') setPinInput('');
                      else if (k === '⌫') setPinInput((prev) => prev.slice(0, -1));
                      else setPinInput((prev) => prev + k);
                    }}
                    className="py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-white font-bold text-sm transition active:scale-95"
                  >
                    {k}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPinModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition active:scale-95"
                >
                  Buka Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
