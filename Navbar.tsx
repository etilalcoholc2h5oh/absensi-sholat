import React, { useEffect, useState } from 'react';
import { Bell, Code, School, Shield } from 'lucide-react';
import { MADRASAH_INFO } from '../data/madrasahData';
import { getStoredConfig } from '../services/supabaseService';
import { enablePushNotifications, getNotificationPermission } from '../services/notificationService';
import { WeatherDashboard } from './WeatherDashboard';

interface NavbarProps { activeTab: 'student' | 'admin' | 'vanilla-code'; setActiveTab: (tab: 'student' | 'admin' | 'vanilla-code') => void; onOpenAdminAuth: () => void; isAdminAuthenticated: boolean; isInsideGeofence: boolean; gpsDistance: number; }

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAdminAuth, isAdminAuthenticated, isInsideGeofence, gpsDistance }) => {
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission());
  useEffect(() => { const cfg = getStoredConfig(); setSupabaseConnected(Boolean(cfg.url && cfg.anonKey)); }, []);
  const activateNotifications = async () => setNotificationPermission(await enablePushNotifications());
  return <>
    <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm"><div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0"><div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shrink-0"><School className="w-6 h-6" /></div><div className="min-w-0"><div className="flex items-center gap-2 flex-wrap"><span className="font-extrabold text-base sm:text-lg truncate">{MADRASAH_INFO.name}</span><span className="hidden sm:inline text-slate-400">|</span><span className="hidden sm:inline text-sm text-slate-500 font-semibold">Presensi Sholat</span></div><div className="flex items-center gap-2 text-sm text-slate-500"><span className={`status-dot ${isInsideGeofence ? 'bg-emerald-500' : 'bg-rose-500'}`} />{isInsideGeofence ? 'Area Madrasah' : 'Luar Radius'}<span>({Math.round(gpsDistance)} m)</span><span className="hidden sm:inline">{supabaseConnected ? 'Data tersambung' : 'Mode lokal'}</span></div></div></div>
      <div className="flex items-center gap-2 nav-tabs bg-slate-50 p-1 rounded-2xl border border-slate-200"><button onClick={() => setActiveTab('student')} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'student' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-white'}`}>Presensi Siswa</button><button onClick={onOpenAdminAuth} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${activeTab === 'admin' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-white'}`}><Shield className="w-4 h-4" />Guru</button><button onClick={activateNotifications} className="p-2 rounded-xl text-slate-600 hover:bg-white" title="Aktifkan notifikasi" aria-label="Aktifkan notifikasi"><Bell className={`w-5 h-5 ${notificationPermission === 'granted' ? 'text-emerald-600' : ''}`} /></button><button onClick={() => setActiveTab('vanilla-code')} className="p-2 rounded-xl text-slate-600 hover:bg-white" title="Lihat kode"><Code className="w-5 h-5" /></button></div>
    </div></header><WeatherDashboard />
  </>;
};
