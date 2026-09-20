import { DetectionResult } from '../types';

declare global {
  interface Window {
    cocoSsd?: any;
    tf?: any;
  }
}

let modelPromise: Promise<any> | null = null;
let loadedModel: any = null;

export async function loadCocoSsdModel(onProgress?: (msg: string) => void): Promise<any> {
  if (loadedModel) return loadedModel;
  if (modelPromise) return modelPromise;

  modelPromise = (async () => {
    try {
      onProgress?.('Memeriksa engine TensorFlow.js...');
      
      // Tunggu hingga script window.cocoSsd siap jika dimuat dari CDN
      let retries = 0;
      while (!window.cocoSsd && retries < 20) {
        await new Promise(r => setTimeout(r, 200));
        retries++;
      }

      if (!window.cocoSsd) {
        // Fallback muat script secara dinamis jika belum ada
        onProgress?.('Memuat model COCO-SSD via CDN...');
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js');
      }

      if (window.cocoSsd) {
        onProgress?.('Menginisialisasi neural network COCO-SSD...');
        loadedModel = await window.cocoSsd.load({ base: 'mobilenet_v2' });
        onProgress?.('Model AI Siap!');
        return loadedModel;
      } else {
        throw new Error('Script COCO-SSD tidak dapat dimuat.');
      }
    } catch (err: any) {
      console.error('Gagal memuat COCO-SSD model:', err);
      throw err;
    }
  })();

  return modelPromise;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(new Error(`Gagal memuat script: ${src}`));
    document.head.appendChild(script);
  });
}

/**
 * Melakukan deteksi objek pada video element
 */
export async function detectObjects(videoEl: HTMLVideoElement): Promise<DetectionResult> {
  if (!loadedModel || videoEl.readyState < 2) {
    return { hasPerson: false, score: 0, allPredictions: [] };
  }

  try {
    const predictions: Array<{ class: string; score: number; bbox: [number, number, number, number] }> = 
      await loadedModel.detect(videoEl);

    // Cari objek kelas 'person' dengan confidence di atas 0.55
    const personPred = predictions.find(p => p.class.toLowerCase() === 'person' && p.score >= 0.55);

    return {
      hasPerson: !!personPred,
      score: personPred ? Math.round(personPred.score * 100) : 0,
      bbox: personPred ? personPred.bbox : undefined,
      allPredictions: predictions,
    };
  } catch (err) {
    console.error('Error saat deteksi frame:', err);
    return { hasPerson: false, score: 0, allPredictions: [] };
  }
}

/**
 * Menggambar Canvas Overlay di atas video dengan Bounding Box Neon Green
 */
export function drawDetectionOverlay(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  detection: DetectionResult
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = video.videoWidth || canvas.width;
  const height = video.videoHeight || canvas.height;

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  ctx.clearRect(0, 0, width, height);

  if (detection.hasPerson && detection.bbox) {
    const [x, y, w, h] = detection.bbox;

    // Bounding Box Neon Hijau
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 12;
    ctx.strokeRect(x, y, w, h);

    // Fill semi-transparan di dalam box
    ctx.fillStyle = 'rgba(0, 255, 102, 0.12)';
    ctx.fillRect(x, y, w, h);

    // Sudut aksen (corner brackets)
    const cornerSize = Math.min(24, w * 0.2, h * 0.2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#22c55e';
    // Kiri-atas
    ctx.beginPath();
    ctx.moveTo(x, y + cornerSize);
    ctx.lineTo(x, y);
    ctx.lineTo(x + cornerSize, y);
    ctx.stroke();
    // Kanan-atas
    ctx.beginPath();
    ctx.moveTo(x + w - cornerSize, y);
    ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + cornerSize);
    ctx.stroke();
    // Kiri-bawah
    ctx.beginPath();
    ctx.moveTo(x, y + h - cornerSize);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + cornerSize, y + h);
    ctx.stroke();
    // Kanan-bawah
    ctx.beginPath();
    ctx.moveTo(x + w - cornerSize, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h - cornerSize);
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Label Badge "Person Detected (XX%)"
    const label = `Person Detected: ${detection.score}%`;
    ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
    const textWidth = ctx.measureText(label).width;

    const badgeX = Math.max(10, x);
    const badgeY = Math.max(28, y - 10);

    ctx.fillStyle = '#052e16'; // Hijau gelap
    ctx.fillRect(badgeX - 6, badgeY - 22, textWidth + 24, 28);

    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 2;
    ctx.strokeRect(badgeX - 6, badgeY - 22, textWidth + 24, 28);

    // Dot hijau berkedip
    ctx.fillStyle = '#00ff66';
    ctx.beginPath();
    ctx.arc(badgeX + 2, badgeY - 8, 5, 0, Math.PI * 2);
    ctx.fill();

    // Text label
    ctx.fillStyle = '#f0fdf4';
    ctx.fillText(label, badgeX + 14, badgeY - 3);

  } else {
    // Jika ada objek lain terdeteksi (bukan orang) atau kosong, beri border merah / peringatan
    if (detection.allPredictions.length > 0) {
      // Ada objek bukan person (misal benda mati)
      const topNonPerson = detection.allPredictions[0];
      const [x, y, w, h] = topNonPerson.bbox;

      ctx.strokeStyle = '#ef4444'; // Merah
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);

      const alertText = `Bukan Siswa (${topNonPerson.class})`;
      ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
      const tw = ctx.measureText(alertText).width;

      ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
      ctx.fillRect(x, Math.max(22, y - 8) - 20, tw + 16, 24);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(alertText, x + 8, Math.max(22, y - 8) - 3);
    }
  }
}

/**
 * Mengambil tangkapan snapshot live beserta watermark informasi
 */
export function captureLiveSnapshot(
  video: HTMLVideoElement,
  studentName: string,
  prayerType: string,
  aiConfidence?: number
): string {
  const canvas = document.createElement('canvas');
  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;

  // Ukuran standar 4:3 atau resolusi asli kamera
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Gambar frame video live kamera
  ctx.drawImage(video, 0, 0, width, height);

  // 2. Tambahkan watermark semi-transparan di bawah untuk audit trail bukti kehadiran
  const barHeight = Math.max(48, Math.round(height * 0.12));
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(0, height - barHeight, width, barHeight);

  // Garis aksen hijau
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(0, height - barHeight, width, 3);

  // Timestamp format Indonesia
  const now = new Date();
  const timeStr = now.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(barHeight * 0.32)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText(`${studentName} | ${prayerType}`, 16, height - barHeight + barHeight * 0.42);

  ctx.fillStyle = '#94a3b8';
  ctx.font = `${Math.round(barHeight * 0.26)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText(`Waktu: ${timeStr} | AI: ${aiConfidence ? aiConfidence + '%' : 'Valid'} | MAN 1 Boyolali`, 16, height - barHeight + barHeight * 0.82);

  return canvas.toDataURL('image/jpeg', 0.82);
}

/**
 * Memainkan efek suara shutter mekanik kamera
 */
export function playCameraShutterSound(): void {
  try {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtxClass) return;
    const ctx = new AudioCtxClass();

    // Klik shutter 1
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.07);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);

    // Klik shutter 2 (latch mekanik kedua)
    setTimeout(() => {
      try {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(240, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.05);

        gain2.gain.setValueAtTime(0.28, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.05);
      } catch {
        // audio context closed
      }
    }, 75);
  } catch {
    // browser auto-play audio policy
  }
}

/**
 * Menyalin satu frame video ke dalam canvas terpisah
 */
export function captureFrameToCanvas(
  video: HTMLVideoElement,
  isMirrored = false
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const w = video.videoWidth || 640;
  const h = video.videoHeight || 480;
  canvas.width = w;
  canvas.height = h;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    if (isMirrored) {
      ctx.save();
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, w, h);
      ctx.restore();
    } else {
      ctx.drawImage(video, 0, 0, w, h);
    }
  }

  return canvas;
}

export interface BeRealRenderOptions {
  studentName: string;
  studentClass?: string;
  prayerType: string;
  aiConfidence?: number;
  gpsText?: string;
  timestampText?: string;
}

/**
 * Menggabungkan 2 frame (Kamera Depan + Kamera Belakang) menjadi 1 foto BeReal elegan
 */
export function renderBeRealDualCanvas(
  mainCanvas: HTMLCanvasElement,
  insetCanvas: HTMLCanvasElement,
  options: BeRealRenderOptions
): string {
  const canvas = document.createElement('canvas');
  // Format potret ala BeReal (720 x 960, ratio 3:4)
  const targetW = 720;
  const targetH = 960;
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // 1. Gambar latar belakang hitam slate
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, targetW, targetH);

  // 2. Gambar Foto Utama (Menutup seluruh kanvas / cover fit)
  const drawCover = (src: HTMLCanvasElement, dx: number, dy: number, dw: number, dh: number) => {
    const srcRatio = src.width / src.height;
    const destRatio = dw / dh;
    let sx = 0,
      sy = 0,
      sw = src.width,
      sh = src.height;

    if (srcRatio > destRatio) {
      sw = src.height * destRatio;
      sx = (src.width - sw) / 2;
    } else {
      sh = src.width / destRatio;
      sy = (src.height - sh) / 2;
    }

    ctx.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh);
  };

  drawCover(mainCanvas, 0, 0, targetW, targetH);

  // 3. Gambar Foto Inset (Floating Card ala BeReal di sudut kiri atas)
  const insetW = 210;
  const insetH = 280;
  const insetX = 24;
  const insetY = 28;
  const insetRadius = 18;

  // Bayangan inset
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 6;

  // Helper rounded rect
  const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  // Border & clipping inset
  drawRoundedRect(insetX, insetY, insetW, insetH, insetRadius);
  ctx.fillStyle = '#0f172a';
  ctx.fill();
  ctx.restore();

  // Draw inset picture clipped
  ctx.save();
  drawRoundedRect(insetX, insetY, insetW, insetH, insetRadius);
  ctx.clip();
  drawCover(insetCanvas, insetX, insetY, insetW, insetH);
  ctx.restore();

  // Inset outer border
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  drawRoundedRect(insetX, insetY, insetW, insetH, insetRadius);
  ctx.stroke();
  ctx.restore();

  // 4. Header Badge Dual Camera (Kanan atas)
  ctx.save();
  const headerText = 'DUAL CAMERA | MAN 1 BOYOLALI';
  ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
  const headerTw = ctx.measureText(headerText).width;
  const headerX = targetW - headerTw - 44;
  const headerY = 28;

  // Pill background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  const hRadius = 12;
  const hPadX = 14;
  const hPadY = 7;
  const hBoxW = headerTw + hPadX * 2;
  const hBoxH = 28;
  drawRoundedRect(headerX, headerY, hBoxW, hBoxH, hRadius);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.fillText(headerText, headerX + hPadX, headerY + 18);
  ctx.restore();

  // 5. Watermark Footer Card di bawah
  const footerH = 92;
  const footerY = targetH - footerH;

  // Gradient background
  const grad = ctx.createLinearGradient(0, footerY - 30, 0, targetH);
  grad.addColorStop(0, 'rgba(15, 23, 42, 0)');
  grad.addColorStop(0.3, 'rgba(15, 23, 42, 0.88)');
  grad.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, footerY - 30, targetW, footerH + 30);

  // Garis aksen hijau
  ctx.fillStyle = '#10b981';
  ctx.fillRect(0, footerY - 1, targetW, 2);

  // Teks Identitas Siswa & Sesi Sholat
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px "Plus Jakarta Sans", sans-serif';
  const nameDisplay = `${options.studentName} (${options.studentClass || 'Siswa'}) | ${options.prayerType}`;
  ctx.fillText(nameDisplay, 24, footerY + 28);

  // Teks Metadata (Waktu, GPS, AI)
  const nowStr =
    options.timestampText ||
    new Date().toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px "Plus Jakarta Sans", sans-serif';
  const metaText = `Waktu: ${nowStr} | AI Verifikasi: ${
    options.aiConfidence ? options.aiConfidence + '%' : 'Terverifikasi'
  } | ${options.gpsText || 'GPS Valid Area Madrasah'}`;
  ctx.fillText(metaText, 24, footerY + 56);

  return canvas.toDataURL('image/jpeg', 0.88);
}
