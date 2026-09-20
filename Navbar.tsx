import React, { useState, useEffect } from 'react';
import { Shield, Code, CheckCircle, MapPin, Database, School } from 'lucide-react';
import { MADRASAH_INFO } from '../data/madrasahData';
import { getStoredConfig } from '../services/supabaseService';

interface NavbarProps {
  activeTab: 'student' | 'admin' | 'vanilla-code';
  setActiveTab: (tab: 'student' | 'admin' | 'vanilla-code') => void;
  onOpenAdminAuth: () => void;
  isAdminAuthenticated: boolean;
  isInsideGeofence: boolean;
  gpsDistance: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAdminAuth,
  isAdminAuthenticated,
  isInsideGeofence,
  gpsDistance,
}) => {
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(false);

  useEffect(() => {
    const cfg = getStoredConfig();
    setSupabaseConnected(!!(cfg.url && cfg.anonKey));
  }, []);

  const handleAdminTabClick = () => {
    if (!isAdminAuthenticated) {
      onOpenAdminAuth();
    } else {
      setActiveTab('admin');
    }
  };

  return (
    <header className="no-print bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 font-bold shrink-0">
            <School className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base text-white tracking-tight">
                {MADRASAH_INFO.name}
              </span>
              <span className="hidden sm:inline-block text-slate-600 text-xs font-light">|</span>
              <span className="hidden sm:inline-block text-xs text-slate-400 font-medium">
                Presensi Sholat Siswa
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isInsideGeofence ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                <span>{isInsideGeofence ? 'Area Madrasah' : 'Luar Radius'}</span>
              </span>
              <span className="text-slate-600 font-light">|</span>
              <span className="text-slate-400">
                {supabaseConnected ? 'Supabase Cloud' : 'Mode Lokal'}
              </span>
            </div>
          </div>
        </div>

        {/* Clean Segment Navigation Control */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            id="tab-presensi-siswa"
            onClick={() => setActiveTab('student')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'student'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Siswa
          </button>

          <button
            id="tab-akses-guru"
            onClick={handleAdminTabClick}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3 h-3 text-amber-400" />
            <span>Guru/Admin</span>
          </button>

          <button
            id="tab-kode-vanillajs"
            onClick={() => setActiveTab('vanilla-code')}
            className={`p-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'vanilla-code'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Lihat Kode Vanilla JS & Standalone HTML"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
