import { AttendanceRecord, SupabaseConfig } from '../types';
const KEY = 'man1_local_attendance_records';
export function getStoredConfig(): SupabaseConfig { return { url: '', anonKey: '', tableName: 'presensi_sholat', isConnected: false }; }
export async function getAttendanceRecords(): Promise<{ data: AttendanceRecord[]; isFromCloud: boolean }> { try { return { data: JSON.parse(localStorage.getItem(KEY) || '[]'), isFromCloud: false }; } catch { return { data: [], isFromCloud: false }; } }
