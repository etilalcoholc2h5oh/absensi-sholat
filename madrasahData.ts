import { Student, AttendanceRecord, GeofenceConfig } from '../types';

export const MADRASAH_INFO = {
  name: 'MAN 1 Boyolali',
  subtitle: 'Madrasah Aliyah Negeri 1 Boyolali',
  motto: 'Mandiri Berprestasi, Religius & Berakhlakul Karimah',
  address: 'Jl. Karanggede - Gemolong Km. 1, Boyolali, Jawa Tengah',
};

// Lokasi MAN 1 Boyolali / Masjid Madrasah
export const DEFAULT_GEOFENCE: GeofenceConfig = {
  latitude: -7.536065,
  longitude: 110.596245,
  radiusMeters: 200,
  locationName: 'Masjid & Lingkungan MAN 1 Boyolali',
};

export const CLASSES = [
  // Kelas X (X A s.d. X J)
  'X A', 'X B', 'X C', 'X D', 'X E', 'X F', 'X G', 'X H', 'X I', 'X J',
  // Kelas XI (XI A s.d. XI J)
  'XI A', 'XI B', 'XI C', 'XI D', 'XI E', 'XI F', 'XI G', 'XI H', 'XI I', 'XI J',
  // Kelas XII (XII A s.d. XII J)
  'XII A', 'XII B', 'XII C', 'XII D', 'XII E', 'XII F', 'XII G', 'XII H', 'XII I', 'XII J',
];

export const INITIAL_STUDENTS: Student[] = [
  // Contoh demo siswa
  { id: 'S101', nisn: '0071234561', name: 'Ahmad Fauzi Rahman', class: 'X A', gender: 'L' },
  { id: 'S102', nisn: '0071234562', name: 'Aisyah Putri Azzahra', class: 'X A', gender: 'P' },
  { id: 'S103', nisn: '0071234563', name: 'Muhammad Rizky Pratama', class: 'X B', gender: 'L' },
  { id: 'S104', nisn: '0071234564', name: 'Nabila Syifa Wardani', class: 'X B', gender: 'P' },
  { id: 'S201', nisn: '0061234571', name: 'Bagas Surya Nugroho', class: 'XI A', gender: 'L' },
  { id: 'S202', nisn: '0061234572', name: 'Dewi Anjani Kusuma', class: 'XI A', gender: 'P' },
  { id: 'S203', nisn: '0061234573', name: 'Farhan Maulana Hakim', class: 'XI B', gender: 'L' },
  { id: 'S301', nisn: '0051234591', name: 'Daffa Raihan Al-Fatih', class: 'XII A', gender: 'L' },
  { id: 'S302', nisn: '0051234592', name: 'Fitri Handayani', class: 'XII A', gender: 'P' },
  { id: 'S303', nisn: '0051234593', name: 'Lukman Nur Hakim', class: 'XII B', gender: 'L' },
];

// Contoh data demo awal untuk memvisualisasikan rekap audit & laporan
export const DEMO_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  {
    id: 'rec-001',
    name: 'Ahmad Fauzi Rahman',
    class: 'X A',
    prayer_type: 'Dhuha',
    status: 'Hadir',
    ai_status: 'Valid (Person Detected)',
    ai_confidence: 94,
    gps_status: 'Valid (Dalam Radius)',
    gps_distance: 38,
    gps_coords: { latitude: -7.53608, longitude: 110.59626 },
    snapshot_photo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240"><rect width="320" height="240" fill="%230f172a"/><circle cx="160" cy="90" r="40" fill="%2322c55e" opacity="0.3"/><rect x="110" y="140" width="100" height="80" rx="20" fill="%2322c55e" opacity="0.3"/><rect x="80" y="30" width="160" height="180" fill="none" stroke="%2300ff66" stroke-width="3"/><text x="85" y="55" fill="%2300ff66" font-size="14" font-family="sans-serif">Person: 94%</text><text x="160" y="230" fill="%2394a3b8" font-size="12" font-family="sans-serif" text-anchor="middle">Ahmad Fauzi - Dhuha</text></svg>',
    notes: 'Presensi Sholat Dhuha Berjamaah',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'rec-002',
    name: 'Aisyah Putri Azzahra',
    class: 'X A',
    prayer_type: 'Dhuha',
    status: "Halangan Syar'i",
    ai_status: "Bypass Syar'i",
    gps_status: 'Valid (Dalam Radius)',
    gps_distance: 45,
    gps_coords: { latitude: -7.53609, longitude: 110.59625 },
    notes: 'Halangan bulanan (Haid) hari ke-2',
    created_at: new Date(Date.now() - 3600000 * 3.8).toISOString(),
  },
  {
    id: 'rec-003',
    name: 'Bagas Surya Nugroho',
    class: 'XI A',
    prayer_type: 'Dzuhur',
    status: 'Hadir',
    ai_status: 'Valid (Person Detected)',
    ai_confidence: 91,
    gps_status: 'Valid (Dalam Radius)',
    gps_distance: 52,
    gps_coords: { latitude: -7.53604, longitude: 110.59628 },
    snapshot_photo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240"><rect width="320" height="240" fill="%230f172a"/><circle cx="160" cy="90" r="40" fill="%2338bdf8" opacity="0.3"/><rect x="110" y="140" width="100" height="80" rx="20" fill="%2338bdf8" opacity="0.3"/><rect x="80" y="30" width="160" height="180" fill="none" stroke="%2300ff66" stroke-width="3"/><text x="85" y="55" fill="%2300ff66" font-size="14" font-family="sans-serif">Person: 91%</text><text x="160" y="230" fill="%2394a3b8" font-size="12" font-family="sans-serif" text-anchor="middle">Bagas Surya - Dzuhur</text></svg>',
    notes: 'Presensi Dzuhur',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'rec-004',
    name: 'Dewi Anjani Kusuma',
    class: 'XI A',
    prayer_type: 'Dzuhur',
    status: 'Sakit',
    ai_status: 'Bypass Sakit/Izin',
    gps_status: 'Di Luar Radius',
    gps_distance: 2400,
    notes: 'Izin di UKS istirahat karena demam',
    created_at: new Date(Date.now() - 3600000 * 1.5).toISOString(),
  },
  {
    id: 'rec-005',
    name: 'Daffa Raihan Al-Fatih',
    class: 'XII A',
    prayer_type: 'Sholat Jumat',
    status: 'Hadir',
    ai_status: 'Valid (Person Detected)',
    ai_confidence: 96,
    gps_status: 'Valid (Dalam Radius)',
    gps_distance: 22,
    gps_coords: { latitude: -7.53606, longitude: 110.59624 },
    snapshot_photo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240"><rect width="320" height="240" fill="%230f172a"/><circle cx="160" cy="90" r="40" fill="%23a855f7" opacity="0.3"/><rect x="110" y="140" width="100" height="80" rx="20" fill="%23a855f7" opacity="0.3"/><rect x="80" y="30" width="160" height="180" fill="none" stroke="%2300ff66" stroke-width="3"/><text x="85" y="55" fill="%2300ff66" font-size="14" font-family="sans-serif">Person: 96%</text><text x="160" y="230" fill="%2394a3b8" font-size="12" font-family="sans-serif" text-anchor="middle">Daffa Raihan - Sholat Jumat</text></svg>',
    notes: 'Sholat Jumat di Masjid MAN 1 Boyolali',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(), // Record 1 minggu lalu
  },
  {
    id: 'rec-006',
    name: 'Abdullah Azzam Musyaffa',
    class: 'XI B',
    prayer_type: 'Dhuha',
    status: 'Hadir',
    ai_status: 'Valid (Person Detected)',
    ai_confidence: 93,
    gps_status: 'Valid (Dalam Radius)',
    gps_distance: 60,
    gps_coords: { latitude: -7.53605, longitude: 110.59625 },
    snapshot_photo: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240"><rect width="320" height="240" fill="%230f172a"/><circle cx="160" cy="90" r="40" fill="%2322c55e" opacity="0.3"/><rect x="110" y="140" width="100" height="80" rx="20" fill="%2322c55e" opacity="0.3"/><rect x="80" y="30" width="160" height="180" fill="none" stroke="%2300ff66" stroke-width="3"/><text x="85" y="55" fill="%2300ff66" font-size="14" font-family="sans-serif">Person: 93%</text><text x="160" y="230" fill="%2394a3b8" font-size="12" font-family="sans-serif" text-anchor="middle">Abdullah - Dhuha</text></svg>',
    notes: 'Hadir tepat waktu',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(), // 1 bulan lalu
  },
];
