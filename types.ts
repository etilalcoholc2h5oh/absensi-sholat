export type PrayerType = 'Dhuha' | 'Dzuhur' | 'Sholat Jumat';

export type AttendanceStatus = 'Hadir' | "Halangan Syar'i" | 'Sakit' | 'Izin';

export interface Student {
  id: string;
  nisn?: string;
  name: string;
  class: string;
  gender: 'L' | 'P'; // L: Laki-laki, P: Perempuan
}

export interface AttendanceRecord {
  id: string;
  name: string;
  class: string;
  prayer_type: PrayerType;
  status: AttendanceStatus;
  ai_status: string; // e.g. 'Valid (Person Detected)' | 'Bypass Syar\'i' | 'Bypass Sakit/Izin' | 'Manual'
  ai_confidence?: number;
  gps_status: string; // e.g. 'Valid (Dalam Radius)' | 'Di Luar Radius' | 'Bypass'
  gps_coords?: {
    latitude: number;
    longitude: number;
  };
  gps_distance?: number; // in meters
  snapshot_photo?: string; // base64 data URL
  notes?: string;
  created_at: string; // ISO / Server timestamp
}

export interface GeofenceConfig {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  locationName: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  tableName: string;
  isConnected: boolean;
}

export interface DetectionResult {
  hasPerson: boolean;
  score: number;
  bbox?: [number, number, number, number]; // [x, y, width, height]
  allPredictions: Array<{
    class: string;
    score: number;
    bbox: [number, number, number, number];
  }>;
}
