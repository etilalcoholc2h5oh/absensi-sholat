import { Student, AttendanceRecord, GeofenceConfig } from '../types';

export const MADRASAH_INFO = {
  name: 'MAN 1 Boyolali',
  subtitle: 'Madrasah Aliyah Negeri 1 Boyolali',
  motto: 'Mandiri Berprestasi, Religius & Berakhlakul Karimah',
  address: 'MAN 1 Boyolali, Boyolali, Jawa Tengah',
};

export const DEFAULT_GEOFENCE: GeofenceConfig = {
  latitude: -7.536065,
  longitude: 110.596245,
  radiusMeters: 200,
  locationName: 'Mushola Sekolah & Lapangan',
};

export const CLASSES = [
  'X A', 'X B', 'X C', 'X D', 'X E', 'X F', 'X G', 'X H', 'X I', 'X J',
  'XI A', 'XI B', 'XI C', 'XI D', 'XI E', 'XI F', 'XI G', 'XI H', 'XI I', 'XI J',
  'XII A', 'XII B', 'XII C', 'XII D', 'XII E', 'XII F', 'XII G', 'XII H', 'XII I', 'XII J',
];

export const INITIAL_STUDENTS: Student[] = [];
export const DEMO_ATTENDANCE_RECORDS: AttendanceRecord[] = [];
