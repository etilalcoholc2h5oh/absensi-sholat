import React from 'react';
import { Bell, Shield } from 'lucide-react';
import { enablePushNotifications, getNotificationPermission } from '../services/notificationService';
import { WeatherDashboard } from './WeatherDashboard';

interface NavbarProps { activeTab: 'student' | 'admin'; setActiveTab: (tab: 'student' | 'admin') => void; onOpenAdminAuth: () => void; isAdminAuthenticated: boolean; isInsideGeofence: boolean; gpsDistance: number; }
export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenAdminAuth, isInsideGeofence, gpsDistance }) => {
  const [permission, setPermission] = React.useState(getNotificationPermission());
  const activateNotifications = async () => setPermission(await enablePushNotifications());
  return <><header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm"><div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4"><div><h1 className="font-extrabold text-lg sm:text-xl">MAN 1 Boyolali</h1><p className="text-sm text-slate-500 flex items-center gap-2"><span className={`status-dot ${isInsideGeofence ? 'bg-emerald-500' : 'bg-rose-500'}`} />{isInsideGeofence ? 'Area Madrasah' : 'Luar Radius'} · {Math.round(gpsDistance)} m</p></div><nav className="flex items-center gap-2 nav-tabs bg-slate-50 p-1 rounded-2xl border border-slate-200"><button onClick={() => setActiveTab('student')} className={`px-4 py-2 rounded-xl text-sm font-bold ${activeTab === 'student' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-white'}`}>Presensi Siswa</button><button onClick={onOpenAdminAuth} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${activeTab === 'admin' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-white'}`}><Shield className="w-4 h-4" />Guru</button><button onClick={activateNotifications} className="p-2 rounded-xl text-slate-600 hover:bg-white" title="Aktifkan notifikasi" aria-label="Aktifkan notifikasi"><Bell className={`w-5 h-5 ${permission === 'granted' ? 'text-emerald-600' : ''}`} /></button></nav></div></header><WeatherDashboard /></>;
};
