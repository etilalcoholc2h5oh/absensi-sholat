import { GeofenceConfig } from '../types';
import { DEFAULT_GEOFENCE } from '../data/madrasahData';

const GEOFENCE_STORAGE_KEY = 'man1_geofence_config';
const SIMULATE_GPS_KEY = 'man1_simulate_gps';

/**
 * Menghitung jarak antara 2 titik koordinat bumi dalam meter (Haversine Formula)
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Radius bumi dalam meter
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Meter
}

export function getGeofenceConfig(): GeofenceConfig {
  try {
    const raw = localStorage.getItem(GEOFENCE_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn(e);
  }
  return DEFAULT_GEOFENCE;
}

export function saveGeofenceConfig(config: GeofenceConfig): void {
  localStorage.setItem(GEOFENCE_STORAGE_KEY, JSON.stringify(config));
}

export function isSimulationMode(): boolean {
  return localStorage.getItem(SIMULATE_GPS_KEY) === 'true';
}

export function setSimulationMode(enabled: boolean): void {
  localStorage.setItem(SIMULATE_GPS_KEY, enabled ? 'true' : 'false');
}

/**
 * Mengambil koordinat GPS siswa saat ini
 */
export function getCurrentPosition(): Promise<{ latitude: number; longitude: number; accuracy: number }> {
  return new Promise((resolve, reject) => {
    // Jika mode simulasi aktif (berguna saat siswa/guru menguji dari luar sekolah)
    if (isSimulationMode()) {
      const cfg = getGeofenceConfig();
      // Berikan koordinat di dalam masjid madrasah (jarak ~15m)
      resolve({
        latitude: cfg.latitude + (Math.random() - 0.5) * 0.0001,
        longitude: cfg.longitude + (Math.random() - 0.5) * 0.0001,
        accuracy: 10,
      });
      return;
    }

    if (!navigator.geolocation) {
      reject(new Error('Geolocation tidak didukung oleh browser ini.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        let msg = 'Gagal mengambil koordinat GPS.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Izin lokasi (GPS) ditolak. Harap izinkan akses lokasi di browser.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Informasi lokasi GPS tidak tersedia.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Waktu permintaan lokasi habis (timeout).';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 15000,
      }
    );
  });
}

/**
 * Validasi apakah koordinat berada di dalam radius geofencing sekolah
 */
export function checkGeofence(
  coords: { latitude: number; longitude: number },
  geofence: GeofenceConfig = getGeofenceConfig()
): { isInside: boolean; distanceMeters: number } {
  const distanceMeters = calculateDistance(
    coords.latitude,
    coords.longitude,
    geofence.latitude,
    geofence.longitude
  );

  return {
    isInside: distanceMeters <= geofence.radiusMeters,
    distanceMeters: Math.round(distanceMeters),
  };
}
