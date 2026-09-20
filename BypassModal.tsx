import React, { useState } from 'react';
import { X, HeartHandshake, AlertCircle, Stethoscope, FileText, Check } from 'lucide-react';
import { AttendanceStatus, PrayerType, Student } from '../types';

interface BypassModalProps {
  isOpen: boolean;
  type: 'Halangan' | 'SakitIzin';
  student: Student | null;
  prayerType: PrayerType;
  onClose: () => void;
  onSubmit: (status: AttendanceStatus, notes: string) => Promise<void>;
}

export const BypassModal: React.FC<BypassModalProps> = ({
  isOpen,
  type,
  student,
  prayerType,
  onClose,
  onSubmit,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<AttendanceStatus>(
    type === 'Halangan' ? "Halangan Syar'i" : 'Sakit'
  );
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const finalNotes =
        notes.trim() ||
        (type === 'Halangan'
          ? "Halangan Syar'i bulanan (Haid)"
          : selectedStatus === 'Sakit'
          ? 'Izin sakit / istirahat di UKS'
          : 'Izin kegiatan madrasah');
      await onSubmit(selectedStatus, finalNotes);
      setNotes('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              type === 'Halangan'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
                : 'bg-amber-950/80 text-amber-300 border border-amber-800/80'
            }`}
          >
            {type === 'Halangan' ? (
              <HeartHandshake className="w-5 h-5 text-rose-400" />
            ) : (
              <Stethoscope className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-base text-white">
              {type === 'Halangan' ? "Bypass: Halangan Syar'i (Haid)" : 'Bypass: Sakit / Izin'}
            </h3>
            <p className="text-xs text-slate-400">
              {student.name} | {student.class}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'Halangan' ? (
            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-900/50 text-rose-300 text-xs space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-rose-400" />
                Ketentuan Halangan Syar'i Khusus Siswi
              </div>
              <p className="text-rose-200/80 leading-relaxed text-[11px]">
                Sesuai fiqih ibadah sholat, siswi yang sedang berhalangan (haid/nifas) tidak diwajibkan sholat.
                Data ini dicatat sebagai dispensasi syar'i yang sah dan tidak dihitung alpha.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Pilih Kategori:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStatus('Sakit')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
                    selectedStatus === 'Sakit'
                      ? 'bg-amber-600 border-amber-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Sakit (UKS / Rumah)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStatus('Izin')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
                    selectedStatus === 'Izin'
                      ? 'bg-amber-600 border-amber-500 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Izin Tertulis</span>
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Keterangan Singkat:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={
                type === 'Halangan'
                  ? 'Contoh: Hari ke-2 halangan haid...'
                  : 'Contoh: Istirahat di UKS karena flu / sakit kepala...'
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Sesi Sholat:</span>
            <span className="font-semibold text-emerald-400">{prayerType}</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <span>Simpan Keterangan</span>
                  <Check className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
