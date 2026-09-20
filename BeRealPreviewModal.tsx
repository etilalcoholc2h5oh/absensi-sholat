import React, { useState, useEffect } from 'react';
import { X, Check, RotateCcw, ArrowLeftRight, Send, Camera } from 'lucide-react';
import { BeRealRenderOptions, renderBeRealDualCanvas } from '../services/aiDetector';

interface BeRealPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhotoUrl: string;
  frame1Canvas: HTMLCanvasElement | null;
  frame2Canvas: HTMLCanvasElement | null;
  renderOptions: BeRealRenderOptions;
  onRetake: () => void;
  onConfirmSubmit: (photoUrl: string) => Promise<void>;
  isSubmitting: boolean;
}

export const BeRealPreviewModal: React.FC<BeRealPreviewModalProps> = ({
  isOpen,
  onClose,
  initialPhotoUrl,
  frame1Canvas,
  frame2Canvas,
  renderOptions,
  onRetake,
  onConfirmSubmit,
  isSubmitting,
}) => {
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string>(initialPhotoUrl);
  const [isSwapped, setIsSwapped] = useState<boolean>(false);

  useEffect(() => {
    setCurrentPhotoUrl(initialPhotoUrl);
    setIsSwapped(false);
  }, [initialPhotoUrl, isOpen]);

  if (!isOpen) return null;

  const handleSwap = () => {
    if (!frame1Canvas || !frame2Canvas) return;
    const nextSwapped = !isSwapped;
    setIsSwapped(nextSwapped);

    // Swap main and inset canvases
    const newMain = nextSwapped ? frame1Canvas : frame2Canvas;
    const newInset = nextSwapped ? frame2Canvas : frame1Canvas;

    const newUrl = renderBeRealDualCanvas(newMain, newInset, renderOptions);
    setCurrentPhotoUrl(newUrl);
  };

  const handleConfirm = async () => {
    await onConfirmSubmit(currentPhotoUrl);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-4 sm:p-5 shadow-2xl space-y-4">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Preview Dual Camera</h3>
              <p className="text-[11px] text-emerald-400 font-medium">Depan + Belakang Terverifikasi</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dual Camera Photo Frame */}
        <div className="relative aspect-[3/4] w-full max-w-[340px] mx-auto bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
          <img
            src={currentPhotoUrl}
            alt="Snapshot Presensi Dual Camera"
            className="w-full h-full object-cover"
          />

          {/* Swap Pill Overlay */}
          {frame1Canvas && frame2Canvas && (
            <button
              type="button"
              onClick={handleSwap}
              className="absolute bottom-16 right-3 px-3 py-1.5 rounded-full bg-slate-950/85 hover:bg-slate-900 border border-slate-700/80 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg backdrop-blur-md transition active:scale-95"
              title="Tukar foto utama dan foto kecil"
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tukar Sudut</span>
            </button>
          )}
        </div>

        {/* Info & Action Controls */}
        <div className="space-y-2 pt-1">
          <p className="text-[11px] text-slate-400 text-center">
            Foto menggabungkan suasana sholat & wajah siswa dengan koordinat GPS dan skor deteksi AI.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onRetake}
              disabled={isSubmitting}
              className="py-2.5 px-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Jebret Ulang</span>
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Presensi</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
