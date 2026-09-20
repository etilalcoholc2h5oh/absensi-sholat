import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AttendanceRecord, SupabaseConfig } from '../types';
import { DEMO_ATTENDANCE_RECORDS } from '../data/madrasahData';

const CONFIG_STORAGE_KEY = 'man1_supabase_config';
const LOCAL_RECORDS_KEY = 'man1_local_attendance_records';

export const SUPABASE_SQL_SCHEMA = `-- SQL SCHEMA UNTUK SUPABASE DATABASE
-- Jalankan kode berikut di Supabase Dashboard -> SQL Editor

-- 1. Buat Tabel presensi_sholat
CREATE TABLE IF NOT EXISTS presensi_sholat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    prayer_type TEXT NOT NULL, -- 'Dhuha', 'Dzuhur', 'Sholat Jumat'
    status TEXT NOT NULL,      -- 'Hadir', 'Halangan Syar''i', 'Sakit', 'Izin'
    ai_status TEXT,            -- 'Valid (Person Detected)', 'Bypass Syar''i', dll
    ai_confidence NUMERIC,     -- Skor AI (misal 95%)
    gps_status TEXT,           -- 'Valid (Dalam Radius)', 'Di Luar Radius', 'Bypass'
    gps_distance NUMERIC,      -- Jarak dalam meter
    gps_coords JSONB,          -- {"latitude": -7.5360, "longitude": 110.5962}
    snapshot_photo TEXT,       -- Data URI Base64 atau URL Storage
    notes TEXT,                -- Keterangan / Alasan
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL -- SERVER TIMESTAMP (Kunci anti manipulasi jam HP)
);

-- 2. Buat Index untuk pencarian cepat & filter laporan rentang tanggal 6+ bulan
CREATE INDEX IF NOT EXISTS idx_presensi_created_at ON presensi_sholat(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_presensi_class ON presensi_sholat(class);
CREATE INDEX IF NOT EXISTS idx_presensi_prayer ON presensi_sholat(prayer_type);

-- 3. Aktifkan Row Level Security (RLS)
ALTER TABLE presensi_sholat ENABLE ROW LEVEL SECURITY;

-- 4. Kebijakan Akses Publik / Anonim (Bisa baca dan tulis presensi)
CREATE POLICY "Izinkan Siswa Melakukan Input Presensi" 
ON presensi_sholat 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Izinkan Baca Data Presensi" 
ON presensi_sholat 
FOR SELECT 
USING (true);

CREATE POLICY "Izinkan Guru Update Status Presensi" 
ON presensi_sholat 
FOR UPDATE 
USING (true);

CREATE POLICY "Izinkan Guru Hapus Data Presensi" 
ON presensi_sholat 
FOR DELETE 
USING (true);
`;

let clientInstance: SupabaseClient | null = null;

export function getStoredConfig(): SupabaseConfig {
  try {
    const saved = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        url: parsed.url || '',
        anonKey: parsed.anonKey || '',
        tableName: parsed.tableName || 'presensi_sholat',
        isConnected: false,
      };
    }
  } catch (e) {
    console.warn('Gagal membaca konfigurasi Supabase dari storage', e);
  }
  return {
    url: '',
    anonKey: '',
    tableName: 'presensi_sholat',
    isConnected: false,
  };
}

export function initSupabaseClient(url?: string, anonKey?: string): SupabaseClient | null {
  const currentConfig = getStoredConfig();
  const finalUrl = url ?? currentConfig.url;
  const finalKey = anonKey ?? currentConfig.anonKey;

  if (!finalUrl || !finalKey) {
    clientInstance = null;
    return null;
  }

  try {
    clientInstance = createClient(finalUrl.trim(), finalKey.trim());
    return clientInstance;
  } catch (err) {
    console.error('Error inisialisasi Supabase client:', err);
    clientInstance = null;
    return null;
  }
}

export async function saveSupabaseConfig(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const trimmedUrl = url.trim();
    const trimmedKey = anonKey.trim();

    if (!trimmedUrl && !trimmedKey) {
      localStorage.removeItem(CONFIG_STORAGE_KEY);
      clientInstance = null;
      return { success: true, message: 'Konfigurasi Supabase dihapus. Menggunakan database lokal browser.' };
    }

    // Uji inisialisasi client
    const testClient = createClient(trimmedUrl, trimmedKey);
    // Uji koneksi query ke tabel presensi_sholat
    const { error } = await testClient.from('presensi_sholat').select('id').limit(1);

    if (error) {
      // Masih kita simpan tapi peringatkan jika tabel belum dibuat di Supabase
      localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ url: trimmedUrl, anonKey: trimmedKey, tableName: 'presensi_sholat' }));
      clientInstance = testClient;
      return { 
        success: true, 
        message: `Kredensial disimpan! Catatan: Tabel 'presensi_sholat' mungkin belum dibuat di database Supabase (${error.message}). Silakan jalankan SQL Schema yang tersedia.` 
      };
    }

    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({ url: trimmedUrl, anonKey: trimmedKey, tableName: 'presensi_sholat' }));
    clientInstance = testClient;
    return { success: true, message: 'Berhasil terhubung ke Supabase Backend!' };
  } catch (err: any) {
    return { success: false, message: 'Gagal menghubungkan: ' + (err.message || 'URL/Key tidak valid') };
  }
}

// Local storage management
function getLocalRecords(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_RECORDS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error(e);
  }
  // Initialize with demo records
  localStorage.setItem(LOCAL_RECORDS_KEY, JSON.stringify(DEMO_ATTENDANCE_RECORDS));
  return DEMO_ATTENDANCE_RECORDS;
}

function saveLocalRecords(records: AttendanceRecord[]) {
  try {
    localStorage.setItem(LOCAL_RECORDS_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Storage full or error saving local records', e);
  }
}

// Get all attendance records (with fallback to local)
export async function getAttendanceRecords(): Promise<{ data: AttendanceRecord[]; isFromCloud: boolean }> {
  const client = clientInstance || initSupabaseClient();
  
  if (client) {
    try {
      const { data, error } = await client
        .from('presensi_sholat')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Merge or sync locally so offline viewing works
        saveLocalRecords(data);
        return { data, isFromCloud: true };
      } else {
        console.warn('Gagal memuat dari Supabase, fallback ke database lokal:', error?.message);
      }
    } catch (err) {
      console.warn('Supabase fetch error, fallback ke local:', err);
    }
  }

  return { data: getLocalRecords(), isFromCloud: false };
}

// Insert attendance record
export async function submitAttendanceRecord(record: Omit<AttendanceRecord, 'id'>): Promise<{ success: boolean; record: AttendanceRecord; isCloud: boolean; message: string }> {
  const client = clientInstance || initSupabaseClient();
  
  if (client) {
    try {
      // Note: Di Supabase, created_at akan terisi secara otomatis menggunakan server timestamp: timezone('utc'::text, now())
      // Sehingga tidak dapat dimanipulasi oleh perubahan jam pada HP siswa!
      const payload = {
        name: record.name,
        class: record.class,
        prayer_type: record.prayer_type,
        status: record.status,
        ai_status: record.ai_status,
        ai_confidence: record.ai_confidence || null,
        gps_status: record.gps_status,
        gps_distance: record.gps_distance ? Math.round(record.gps_distance) : null,
        gps_coords: record.gps_coords || null,
        snapshot_photo: record.snapshot_photo || null,
        notes: record.notes || null,
        // Supabase mengisi server timestamp default saat insert
      };

      const { data, error } = await client
        .from('presensi_sholat')
        .insert([payload])
        .select()
        .single();

      if (!error && data) {
        // Sync local cache
        const local = getLocalRecords();
        saveLocalRecords([data, ...local]);
        return { success: true, record: data, isCloud: true, message: 'Presensi berhasil disimpan ke Supabase Cloud dengan Server Timestamp!' };
      } else {
        console.warn('Supabase insert failed, menyimpan ke lokal:', error?.message);
      }
    } catch (err: any) {
      console.warn('Supabase insert exception:', err);
    }
  }

  // Fallback to local
  const newRecord: AttendanceRecord = {
    ...record,
    id: 'local-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    created_at: new Date().toISOString(),
  };

  const localList = getLocalRecords();
  const updated = [newRecord, ...localList];
  saveLocalRecords(updated);

  return { 
    success: true, 
    record: newRecord, 
    isCloud: false, 
    message: 'Presensi berhasil disimpan di Database Lokal Browser (Belum tersambung Supabase).' 
  };
}

// Update status by teacher / admin
export async function updateRecordStatus(id: string, newStatus: AttendanceRecord['status'], notes?: string): Promise<boolean> {
  const client = clientInstance || initSupabaseClient();
  let cloudSuccess = false;

  if (client) {
    try {
      const updateData: any = { status: newStatus };
      if (notes !== undefined) updateData.notes = notes;
      
      const { error } = await client
        .from('presensi_sholat')
        .update(updateData)
        .eq('id', id);

      if (!error) cloudSuccess = true;
    } catch (err) {
      console.error(err);
    }
  }

  // Selalu perbarui cache lokal
  const current = getLocalRecords();
  const updated = current.map(item => {
    if (item.id === id) {
      return { ...item, status: newStatus, notes: notes !== undefined ? notes : item.notes };
    }
    return item;
  });
  saveLocalRecords(updated);

  return true;
}

// Delete record by teacher / admin
export async function deleteRecord(id: string): Promise<boolean> {
  const client = clientInstance || initSupabaseClient();
  if (client) {
    try {
      await client.from('presensi_sholat').delete().eq('id', id);
    } catch (err) {
      console.error(err);
    }
  }

  const current = getLocalRecords();
  const filtered = current.filter(item => item.id !== id);
  saveLocalRecords(filtered);
  return true;
}
