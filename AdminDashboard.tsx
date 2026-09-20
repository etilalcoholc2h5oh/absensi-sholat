import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  Filter,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Edit2,
  Database,
  Sliders,
  X,
  Clock,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
  Copy,
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, PrayerType } from '../types';
import { CLASSES, MADRASAH_INFO } from '../data/madrasahData';
import { exportToExcel, printPdfReport } from '../services/exportService';
import {
  updateRecordStatus,
  deleteRecord,
  getStoredConfig,
  saveSupabaseConfig,
  SUPABASE_SQL_SCHEMA,
} from '../services/supabaseService';
import { getGeofenceConfig, saveGeofenceConfig } from '../services/geoService';

interface AdminDashboardProps {
  records: AttendanceRecord[];
  isCloudConnected: boolean;
  onRefreshData: () => void;
  adminPin: string;
  onChangePin: (newPin: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  records,
  isCloudConnected,
  onRefreshData,
  adminPin,
  onChangePin,
}) => {
  // Filters State
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedPrayer, setSelectedPrayer] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Active Sub-tab
  const [activeTab, setActiveTab] = useState<'rekap' | 'settings' | 'schema'>('rekap');

  // Snapshot Modal
  const [viewPhotoRecord, setViewPhotoRecord] = useState<AttendanceRecord | null>(null);

  // Edit Status Modal
  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [newStatus, setNewStatus] = useState<AttendanceStatus>('Hadir');
  const [editNotes, setEditNotes] = useState<string>('');

  // Supabase Settings Form
  const [supaUrl, setSupaUrl] = useState<string>(getStoredConfig().url);
  const [supaKey, setSupaKey] = useState<string>(getStoredConfig().anonKey);
  const [supaMsg, setSupaMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [savingSupa, setSavingSupa] = useState<boolean>(false);

  // Geofence Settings Form
  const currentGeofence = getGeofenceConfig();
  const [geoLat, setGeoLat] = useState<number>(currentGeofence.latitude);
  const [geoLng, setGeoLng] = useState<number>(currentGeofence.longitude);
  const [geoRadius, setGeoRadius] = useState<number>(currentGeofence.radiusMeters);
  const [geoSavedMsg, setGeoSavedMsg] = useState<string | null>(null);

  // PIN Form
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [pinChangeMsg, setPinChangeMsg] = useState<string | null>(null);

  // Quick Preset Date Filters (misal: Hari Ini, 7 Hari, 1 Bulan, 6 Bulan Terakhir)
  const applyDatePreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    setDateRangeEnd(end.toISOString().slice(0, 10));
    setDateRangeStart(start.toISOString().slice(0, 10));
  };

  const resetFilters = () => {
    setDateRangeStart('');
    setDateRangeEnd('');
    setSelectedClass('');
    setSelectedPrayer('');
    setSelectedStatus('');
    setSearchQuery('');
  };

  // Filter Data
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      const recDate = new Date(rec.created_at).toISOString().slice(0, 10);
      if (dateRangeStart && recDate < dateRangeStart) return false;
      if (dateRangeEnd && recDate > dateRangeEnd) return false;
      if (selectedClass && rec.class !== selectedClass) return false;
      if (selectedPrayer && rec.prayer_type !== selectedPrayer) return false;
      if (selectedStatus && rec.status !== selectedStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = rec.name.toLowerCase().includes(q);
        const matchClass = rec.class.toLowerCase().includes(q);
        const matchNotes = (rec.notes || '').toLowerCase().includes(q);
        if (!matchName && !matchClass && !matchNotes) return false;
      }
      return true;
    });
  }, [records, dateRangeStart, dateRangeEnd, selectedClass, selectedPrayer, selectedStatus, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const hadir = filteredRecords.filter((r) => r.status === 'Hadir').length;
    const haid = filteredRecords.filter((r) => r.status === "Halangan Syar'i").length;
    const sakit = filteredRecords.filter((r) => r.status === 'Sakit' || r.status === 'Izin').length;
    const rate = total > 0 ? Math.round((hadir / total) * 100) : 0;
    return { total, hadir, haid, sakit, rate };
  }, [filteredRecords]);

  // Handle Excel Export
  const handleExportExcel = () => {
    let summary = 'Semua Periode';
    if (dateRangeStart && dateRangeEnd) {
      summary = `${dateRangeStart} s/d ${dateRangeEnd}`;
    } else if (dateRangeStart) {
      summary = `Mulai ${dateRangeStart}`;
    }
    if (selectedClass) summary += ` | Kelas: ${selectedClass}`;
    if (selectedPrayer) summary += ` | Sholat: ${selectedPrayer}`;

    exportToExcel(filteredRecords, summary);
  };

  // Save manual status edit
  const handleSaveStatusEdit = async () => {
    if (!editRecord) return;
    await updateRecordStatus(editRecord.id, newStatus, editNotes);
    setEditRecord(null);
    onRefreshData();
  };

  // Delete record
  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus catatan presensi untuk "${name}"?`)) {
      await deleteRecord(id);
      onRefreshData();
    }
  };

  // Save Supabase Config
  const handleSaveSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSupa(true);
    setSupaMsg(null);
    try {
      const res = await saveSupabaseConfig(supaUrl, supaKey);
      setSupaMsg({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
      if (res.success) {
        onRefreshData();
      }
    } catch (err: any) {
      setSupaMsg({ type: 'error', text: err.message });
    } finally {
      setSavingSupa(false);
    }
  };

  // Save Geofence Config
  const handleSaveGeofence = (e: React.FormEvent) => {
    e.preventDefault();
    saveGeofenceConfig({
      latitude: Number(geoLat),
      longitude: Number(geoLng),
      radiusMeters: Number(geoRadius),
      locationName: currentGeofence.locationName,
    });
    setGeoSavedMsg('Konfigurasi zonasi GPS madrasah berhasil diperbarui!');
    setTimeout(() => setGeoSavedMsg(null), 4000);
  };

  // Change PIN
  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPinInput || newPinInput.length < 4) {
      setPinChangeMsg('PIN minimal 4 digit.');
      return;
    }
    onChangePin(newPinInput);
    setPinChangeMsg('PIN Guru/Admin berhasil diubah.');
    setNewPinInput('');
    setTimeout(() => setPinChangeMsg(null), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Top Banner & Action Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Dashboard Rekapitulasi Ibadah
            </h2>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${
                isCloudConnected
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {isCloudConnected ? 'Cloud Supabase' : 'Database Lokal'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Audit presensi harian siswa terverifikasi AI Bounding Box & Geofencing GPS
          </p>
        </div>

        {/* Buttons: Export Excel, Print PDF, Refresh */}
        <div className="no-print flex items-center gap-2">
          <button
            type="button"
            onClick={onRefreshData}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs transition"
            title="Muat ulang data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            id="btn-export-excel"
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            id="btn-export-pdf"
            onClick={printPdfReport}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition"
          >
            <Printer className="w-3.5 h-3.5 text-slate-400" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* Sub-tab Navigation */}
      <div className="no-print flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setActiveTab('rekap')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'rekap'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Rekap & Audit</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'settings'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Pengaturan Supabase & GPS</span>
        </button>

        <button
          onClick={() => setActiveTab('schema')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'schema'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>SQL Schema</span>
        </button>
      </div>

      {/* VIEW 1: REKAPITULASI & AUDIT TRAIL */}
      {activeTab === 'rekap' && (
        <div className="space-y-5">
          {/* Printable Header (Only visible during print) */}
          <div className="hidden print-only text-center mb-6 text-black">
            <h1 className="text-xl font-bold uppercase">{MADRASAH_INFO.name}</h1>
            <p className="text-xs">{MADRASAH_INFO.address}</p>
            <div className="border-b-2 border-black my-2"></div>
            <h2 className="text-base font-bold underline">
              LAPORAN AUDIT PRESENSI SHOLAT SISWA
            </h2>
            <p className="text-xs mt-1">
              Dicetak pada: {new Date().toLocaleDateString('id-ID')} | Total Rekaman: {filteredRecords.length}
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
              <span className="text-xs font-medium text-slate-400">Total Absensi Terfilter</span>
              <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
              <span className="text-[11px] text-slate-500">Record tersimpan</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
              <span className="text-xs font-medium text-emerald-400">Hadir Sholat</span>
              <div className="text-2xl font-black text-emerald-400 mt-1">{stats.hadir}</div>
              <span className="text-[11px] text-emerald-500/80">Valid AI & GPS</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
              <span className="text-xs font-medium text-rose-400">Halangan Syar'i</span>
              <div className="text-2xl font-black text-rose-400 mt-1">{stats.haid}</div>
              <span className="text-[11px] text-rose-500/80">Dispensasi Siswi</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow">
              <span className="text-xs font-medium text-amber-400">Sakit / Izin</span>
              <div className="text-2xl font-black text-amber-400 mt-1">{stats.sakit}</div>
              <span className="text-[11px] text-amber-500/80">Dengan Keterangan</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow col-span-2 lg:col-span-1">
              <span className="text-xs font-medium text-sky-400">Tingkat Kehadiran</span>
              <div className="text-2xl font-black text-sky-400 mt-1">{stats.rate}%</div>
              <span className="text-[11px] text-sky-500/80">Rasio disiplin sholat</span>
            </div>
          </div>

          {/* Filter Panel (Rentang Tanggal hingga 6 Bulan, Kelas, Sholat, Status) */}
          <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Filter Audit Trail Presensi
                </h4>
              </div>

              {/* Quick Preset Rentang Waktu (Mendukung 6 Bulan atau lebih) */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-500 text-[11px]">Preset:</span>
                <button
                  type="button"
                  onClick={() => applyDatePreset(0)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={() => applyDatePreset(7)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                >
                  7 Hari
                </button>
                <button
                  type="button"
                  onClick={() => applyDatePreset(30)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium"
                >
                  1 Bulan
                </button>
                <button
                  type="button"
                  onClick={() => applyDatePreset(180)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[11px] font-semibold"
                  title="Filter pencarian rentang tanggal 6 bulan terakhir"
                >
                  6 Bulan (1 Semester)
                </button>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-2.5 py-1 rounded-lg text-emerald-400 hover:underline text-[11px] font-medium ml-2"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
              {/* Tanggal Mulai */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">Dari Tanggal:</label>
                <input
                  type="date"
                  value={dateRangeStart}
                  onChange={(e) => setDateRangeStart(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Tanggal Sampai */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">Sampai Tanggal:</label>
                <input
                  type="date"
                  value={dateRangeEnd}
                  onChange={(e) => setDateRangeEnd(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Filter Kelas */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">Pilih Kelas:</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Semua Kelas</option>
                  {CLASSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Sholat */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">Jenis Sholat:</label>
                <select
                  value={selectedPrayer}
                  onChange={(e) => setSelectedPrayer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Semua Sholat</option>
                  <option value="Dhuha">Dhuha</option>
                  <option value="Dzuhur">Dzuhur</option>
                  <option value="Sholat Jumat">Sholat Jumat</option>
                </select>
              </div>

              {/* Filter Status */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">Status Kehadiran:</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="">Semua Status</option>
                  <option value="Hadir">Hadir</option>
                  <option value="Halangan Syar'i">Halangan Syar'i</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Izin">Izin</option>
                </select>
              </div>

              {/* Pencarian Nama */}
              <div>
                <label className="block text-slate-400 font-medium mb-1">Cari Nama Siswa:</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Ketik nama siswa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tabel Rekapitulasi Audit Trail */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800 text-[11px]">
                  <tr>
                    <th className="py-3 px-3 sm:px-4 font-bold">Waktu (Server)</th>
                    <th className="py-3 px-3 sm:px-4 font-bold">Siswa & Kelas</th>
                    <th className="py-3 px-3 sm:px-4 font-bold">Sholat</th>
                    <th className="py-3 px-3 sm:px-4 font-bold">Status</th>
                    <th className="py-3 px-3 sm:px-4 font-bold">Bukti Foto / AI</th>
                    <th className="py-3 px-3 sm:px-4 font-bold">Lokasi GPS</th>
                    <th className="py-3 px-3 sm:px-4 font-bold">Keterangan</th>
                    <th className="py-3 px-3 sm:px-4 font-bold no-print text-right">Aksi Guru</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        Tidak ada data presensi yang cocok dengan filter yang dipilih.
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((rec) => {
                      const d = new Date(rec.created_at);
                      const timeStr =
                        d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) +
                        ' ' +
                        d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

                      let badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-800';
                      if (rec.status === "Halangan Syar'i") {
                        badgeColor = 'bg-rose-950 text-rose-300 border-rose-800';
                      } else if (rec.status === 'Sakit' || rec.status === 'Izin') {
                        badgeColor = 'bg-amber-950 text-amber-300 border-amber-800';
                      }

                      return (
                        <tr key={rec.id} className="hover:bg-slate-850/50 transition">
                          {/* Waktu Server Timestamp */}
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                            {timeStr}
                          </td>

                          {/* Nama & Kelas */}
                          <td className="py-3 px-3 sm:px-4">
                            <div className="font-bold text-white text-xs sm:text-sm">{rec.name}</div>
                            <div className="text-[11px] text-slate-400">{rec.class}</div>
                          </td>

                          {/* Jenis Sholat */}
                          <td className="py-3 px-3 sm:px-4">
                            <span className="font-semibold text-emerald-400">{rec.prayer_type}</span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 sm:px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badgeColor}`}
                            >
                              {rec.status}
                            </span>
                          </td>

                          {/* Bukti Foto Snapshot / AI */}
                          <td className="py-3 px-3 sm:px-4">
                            {rec.snapshot_photo ? (
                              <button
                                type="button"
                                onClick={() => setViewPhotoRecord(rec)}
                                className="group flex items-center gap-2 text-left hover:opacity-90"
                              >
                                <img
                                  src={rec.snapshot_photo}
                                  alt="Bukti"
                                  className="w-9 h-9 rounded-lg object-cover border border-slate-700 bg-black group-hover:ring-2 group-hover:ring-emerald-500 transition"
                                />
                                <div>
                                  <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 group-hover:underline">
                                    <Eye className="w-3 h-3" /> Lihat Bukti
                                  </div>
                                  <div className="text-[10px] text-slate-400">{rec.ai_status}</div>
                                </div>
                              </button>
                            ) : (
                              <span className="text-slate-500 text-[11px] italic">
                                {rec.ai_status || 'Tanpa Foto'}
                              </span>
                            )}
                          </td>

                          {/* Lokasi GPS */}
                          <td className="py-3 px-3 sm:px-4">
                            <div
                              className={`text-[11px] font-medium ${
                                rec.gps_status.includes('Valid')
                                  ? 'text-emerald-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              {rec.gps_status}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              {rec.gps_distance ? `${rec.gps_distance} meter` : '-'}
                            </div>
                          </td>

                          {/* Keterangan */}
                          <td className="py-3 px-3 sm:px-4 text-slate-400 text-[11px] max-w-xs truncate">
                            {rec.notes || '-'}
                          </td>

                          {/* Aksi Guru (Ubah Status Manual / Hapus) */}
                          <td className="py-3 px-3 sm:px-4 no-print text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditRecord(rec);
                                  setNewStatus(rec.status);
                                  setEditNotes(rec.notes || '');
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                                title="Ubah Status Manual"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(rec.id, rec.name)}
                                className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900 border border-rose-800/60 text-rose-300 transition"
                                title="Hapus Catatan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signature Block for Official Printout / PDF */}
          <div className="hidden print-only mt-12 pt-8 text-black text-xs">
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <p>Mengetahui,</p>
                <p className="font-bold">Kepala Madrasah MAN 1 Boyolali</p>
                <div className="h-16"></div>
                <p className="font-bold underline">Drs. H. Mahsun Alwi, M.Ag.</p>
                <p>NIP. 19680512 199403 1 002</p>
              </div>

              <div>
                <p>Boyolali, {new Date().toLocaleDateString('id-ID')}</p>
                <p className="font-bold">Koordinator Pembina Keagamaan</p>
                <div className="h-16"></div>
                <p className="font-bold underline">Ustadz Muhammad Ilham, S.Pd.I.</p>
                <p>NIP. 19820315 200901 1 008</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* VIEW 2: PENGATURAN SUPABASE & GEOFENCE */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card Konfigurasi Supabase */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <Database className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Koneksi Supabase Backend</h3>
                <p className="text-xs text-slate-400">
                  Hubungkan dengan Supabase Project Anda untuk penyimpanan cloud permanen.
                </p>
              </div>
            </div>

            {supaMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  supaMsg.type === 'success'
                    ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/80 border border-rose-800 text-rose-300'
                }`}
              >
                {supaMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{supaMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveSupabase} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Supabase Project URL:
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supaUrl}
                  onChange={(e) => setSupaUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Supabase Anon Public API Key:
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={supaKey}
                  onChange={(e) => setSupaKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300">Catatan Keamanan & Server Timestamp:</div>
                <p>
                  Setiap pengiriman absensi ke Supabase akan otomatis mengisi kolom <code className="text-emerald-400">created_at</code> menggunakan fungsi server PostgreSQL <code className="text-emerald-400">timezone('utc'::text, now())</code>. Siswa tidak dapat memanipulasi jam HP mereka untuk curang.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSupaUrl('');
                    setSupaKey('');
                    saveSupabaseConfig('', '');
                  }}
                  className="text-slate-400 hover:text-rose-400 text-xs underline"
                >
                  Gunakan Database Lokal Saja
                </button>

                <button
                  type="submit"
                  disabled={savingSupa}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition disabled:opacity-50"
                >
                  {savingSupa ? 'Menyimpan & Uji Koneksi...' : 'Simpan & Hubungkan'}
                </button>
              </div>
            </form>
          </div>

          {/* Card Konfigurasi Geofencing & Koordinat Madrasah */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <Sliders className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Koordinat Geofencing Madrasah</h3>
                <p className="text-xs text-slate-400">
                  Pusat radius masjid/musholla sekolah untuk validasi kehadiran fisik.
                </p>
              </div>
            </div>

            {geoSavedMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>{geoSavedMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveGeofence} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Latitude:</label>
                <input
                  type="number"
                  step="any"
                  value={geoLat}
                  onChange={(e) => setGeoLat(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Longitude:</label>
                <input
                  type="number"
                  step="any"
                  value={geoLng}
                  onChange={(e) => setGeoLng(parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Radius Toleransi (Meter):
                </label>
                <input
                  type="number"
                  value={geoRadius}
                  onChange={(e) => setGeoRadius(parseInt(e.target.value, 10))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Default 200 meter meng-cover area masjid, serambi, dan kelas MAN 1 Boyolali.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setGeoLat(-7.536065);
                    setGeoLng(110.596245);
                    setGeoRadius(200);
                  }}
                  className="text-slate-400 hover:text-white text-xs underline"
                >
                  Reset Default MAN 1 Boyolali
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                >
                  Perbarui Geofence
                </button>
              </div>
            </form>

            {/* Ubah PIN Keamanan Guru */}
            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold text-white mb-2">Ganti PIN Akses Guru:</h4>
              {pinChangeMsg && (
                <div className="p-2 rounded-lg bg-emerald-950 text-emerald-300 text-xs mb-2">
                  {pinChangeMsg}
                </div>
              )}
              <form onSubmit={handleChangePinSubmit} className="flex gap-2">
                <input
                  type="password"
                  placeholder="PIN Baru (min 4 digit)"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white flex-1"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Ubah PIN
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

      {/* VIEW 3: SQL SCHEMA VIEWER */}
      {activeTab === 'schema' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                SQL DDL Schema untuk Supabase Database
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Salin dan jalankan script SQL berikut pada menu <strong>SQL Editor</strong> di dashboard project Supabase Anda.
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                alert('Script SQL berhasil disalin ke clipboard!');
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin Script SQL</span>
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto">
            <pre className="text-[12px] font-mono text-emerald-300 leading-relaxed">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        </div>
      )}

      {/* MODAL VIEW SNAPSHOT PHOTO */}
      {viewPhotoRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in"
          onClick={() => setViewPhotoRecord(null)}
        >
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-4 overflow-hidden shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setViewPhotoRecord(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-bold text-white">
                Bukti Live Snapshot: {viewPhotoRecord.name}
              </h4>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-[4/3] flex items-center justify-center">
              <img
                src={viewPhotoRecord.snapshot_photo}
                alt={viewPhotoRecord.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu Presensi (Server):</span>
                <span className="font-mono text-white">
                  {new Date(viewPhotoRecord.created_at).toLocaleString('id-ID')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kelas & Sholat:</span>
                <span className="font-semibold text-emerald-400">
                  {viewPhotoRecord.class} | {viewPhotoRecord.prayer_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Verifikasi AI Bounding Box:</span>
                <span className="font-medium text-white">{viewPhotoRecord.ai_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Zonasi Geofencing:</span>
                <span className="font-medium text-white">
                  {viewPhotoRecord.gps_status} ({viewPhotoRecord.gps_distance || 0}m)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT STATUS SISWA OLEH GURU */}
      {editRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Koreksi Manual Status Presensi</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {editRecord.name} ({editRecord.class}) | {editRecord.prayer_type}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Status Kehadiran:</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AttendanceStatus)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Hadir">Hadir</option>
                  <option value="Halangan Syar'i">Halangan Syar'i</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Izin">Izin</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Catatan Guru (Opsional):
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Alasan koreksi status oleh guru..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditRecord(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveStatusEdit}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
