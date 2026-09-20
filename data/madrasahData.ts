import { AttendanceRecord, GeofenceConfig, Student } from '../types';
export const MADRASAH_INFO = { name: 'MAN 1 Boyolali', subtitle: 'Madrasah Aliyah Negeri 1 Boyolali', motto: 'Mandiri Berprestasi, Religius & Berakhlakul Karimah', address: 'MAN 1 Boyolali, Boyolali, Jawa Tengah' };
export const DEFAULT_GEOFENCE: GeofenceConfig = { latitude: -7.536065, longitude: 110.596245, radiusMeters: 200, locationName: 'Mushola Sekolah & Lapangan' };
export const CLASSES = ['X A', 'X B', 'XI A', 'XI B', 'XII A', 'XII B'];
export const INITIAL_STUDENTS: Student[] = [];
export const DEMO_ATTENDANCE_RECORDS: AttendanceRecord[] = [];
