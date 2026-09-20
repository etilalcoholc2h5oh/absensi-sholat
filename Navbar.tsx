import React from 'react';
import { Bell, School, Shield } from 'lucide-react';
import { MADRASAH_INFO } from '../data/madrasahData';
import { enablePushNotifications, getNotificationPermission } from '../services/notificationService';
import { WeatherDashboard } from './WeatherDashboard';

interface NavbarProps {
  activeTab: 'student' | 'admin';
  setActiveTab: (tab: 'student' | 'admin') => void;
  onOpenAdminAuth: () => void;
  isAdminAuthenticated: boolean;
  isInsideGeofence: boolean;
  gpsDistance: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAdminAuth,
  isInsideGeofence,
  gpsDistance,
}) => {
  const [notificationPermission, setNotificationPermission] = React.useState(getNotificationPermission());

  const activateNotifications = async () => {
    setNotificationPermission(await enablePushNotifications());
  };

  return (
    <>
      <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Logo dan identitas selalu berada di kiri atas. */}
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm"
              aria-label="Logo MAN 1 Boyolali"
            >
              <School className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-extrabold text-slate-900 sm:text-xl">
                {MADRASAH_INFO.name}
              </h1>
              <p className="flex items-center gap-2 text-sm text-slate-500">
                <span className={`status-dot ${isInsideGeofence ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span>{isInsideGeofence ? 'Area Madrasah' : 'Luar Radius'}</span>
                <span aria-hidden="true">·</span>
                <span>{Math.round(gpsDistance)} m</span>
              </p>
            </div>
          </div>

          {/* Navigasi berada di sisi kanan dan tetap dapat digeser pada layar kecil. */}
          <nav className="nav-tabs flex shrink-0 items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('student')}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-bold transition ${
                activeTab === 'student' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
              }`}
            >
              Presensi Siswa
            </button>
            <button
              type="button"
              onClick={onOpenAdminAuth}
              className={`flex whitespace-nowrap items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                activeTab === 'admin' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white'
              }`}
            >
              <Shield className="h-4 w-4" aria-hidden="true" />
              Guru
            </button>
            <button
              type="button"
              onClick={activateNotifications}
              className="rounded-xl p-2 text-slate-600 transition hover:bg-white"
              title="Aktifkan notifikasi"
              aria-label="Aktifkan notifikasi"
            >
              <Bell className={`h-5 w-5 ${notificationPermission === 'granted' ? 'text-emerald-600' : ''}`} />
            </button>
          </nav>
        </div>
      </header>
      <WeatherDashboard />
    </>
  );
};
