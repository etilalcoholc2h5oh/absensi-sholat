export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

export function getNotificationPermission(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

export async function enablePushNotifications(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  const permission = await Notification.requestPermission();
  if (permission === 'granted' && 'serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/sw.js');
    } catch (error) {
      console.warn('Service worker not tersedia:', error);
    }
  }
  return permission;
}

export async function notifyAttendanceUpdate(record: { name: string; status: string; prayer_type: string }) {
  if (getNotificationPermission() !== 'granted') return;
  const title = 'Data presensi diperbarui';
  const body = `${record.name} · ${record.prayer_type} · ${record.status}`;
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) await registration.showNotification(title, { body, tag: `attendance-${record.name}-${record.prayer_type}` });
    else new Notification(title, { body });
  } catch { /* Notifikasi bersifat opsional dan tidak boleh mengganggu presensi. */ }
}
