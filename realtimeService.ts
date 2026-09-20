import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { AttendanceRecord, SupabaseConfig } from '../types';
import { DEMO_ATTENDANCE_RECORDS } from '../data/madrasahData';

// Existing implementation remains below; this helper enables live teacher updates when Supabase is configured.
export function subscribeAttendanceRealtime(onInsert: (record: AttendanceRecord) => void): (() => void) {
  const client = clientInstance || initSupabaseClient();
  if (!client) return () => undefined;
  const channel: RealtimeChannel = client.channel('presensi-sholat-live').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'presensi_sholat' }, (payload) => onInsert(payload.new as AttendanceRecord)).subscribe();
  return () => { void client.removeChannel(channel); };
}
