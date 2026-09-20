import React, { useState } from 'react';
import { Download, Copy, Check, Code, FileText, Sparkles, ExternalLink, FileCode } from 'lucide-react';
import { SUPABASE_SQL_SCHEMA } from '../services/supabaseService';

export const VanillaCodeViewer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'standalone' | 'modular-html' | 'detector' | 'supabase' | 'schema'>('standalone');
  const [copied, setCopied] = useState<boolean>(false);

  const downloadStandaloneHtml = () => {
    const link = document.createElement('a');
    link.href = '/presensi-sholat-standalone.html';
    link.download = 'presensi-sholat-man1-boyolali.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const modularHtmlCode = `<!-- index.html (Struktur Modular Presensi Sholat MAN 1 Boyolali) -->
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Presensi Sholat Siswa - MAN 1 Boyolali</title>
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- TensorFlow.js & COCO-SSD CDN -->
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js"></script>
  <!-- Supabase Client CDN -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <!-- SheetJS Excel Export CDN -->
  <script src="https://cdn.sheetjs.com/xlsx-0.20.2/package/dist/xlsx.full.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #0f172a; color: #f8fafc; }
  </style>
</head>
<body class="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
  <!-- Header Aplikasi -->
  <header class="bg-slate-900 border-b border-slate-800 p-4">
    <div class="max-w-6xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">M1B</div>
        <div>
          <h1 class="font-bold text-lg text-white">Presensi Sholat Siswa</h1>
          <p class="text-xs text-emerald-400 font-medium">MAN 1 Boyolali</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button id="btnViewStudent" class="px-3 py-1.5 rounded-lg text-xs bg-emerald-600 font-bold">Siswa</button>
        <button id="btnViewAdmin" class="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300">Guru/Admin</button>
      </div>
    </div>
  </header>

  <!-- View Presensi Siswa -->
  <main class="max-w-6xl mx-auto p-4 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
    <!-- Identitas Siswa -->
    <div class="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-4">
      <label class="block text-xs font-semibold text-slate-300">Pilih Kelas:</label>
      <select id="selectClass" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-white"></select>

      <label class="block text-xs font-semibold text-slate-300">Nama Siswa (Tanpa Password):</label>
      <select id="selectStudent" class="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-white"></select>

      <div class="pt-2 border-t border-slate-800">
        <label class="block text-xs font-semibold text-slate-300 mb-1">Jenis Sholat:</label>
        <div id="prayerContainer" class="grid grid-cols-2 gap-2"></div>
      </div>

      <div class="pt-2 border-t border-slate-800">
        <label class="block text-xs font-semibold text-slate-400 mb-2">Bypass Khusus:</label>
        <div class="grid grid-cols-2 gap-2">
          <button id="btnHaid" class="py-2 px-3 bg-rose-950 border border-rose-800 text-rose-300 rounded-xl text-xs font-bold">Halangan Syar'i (Haid)</button>
          <button id="btnSakit" class="py-2 px-3 bg-amber-950 border border-amber-800 text-amber-300 rounded-xl text-xs font-bold">Sakit / Izin</button>
        </div>
      </div>
    </div>

    <!-- Kamera Live & Bounding Box Canvas -->
    <div class="lg:col-span-7 bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
      <div class="flex justify-between items-center">
        <h3 class="text-xs font-bold uppercase text-emerald-400">Kamera Live & AI Verifier</h3>
        <button id="btnToggleCam" class="text-xs px-3 py-1 bg-slate-800 rounded-lg text-slate-300">Ganti Kamera</button>
      </div>
      <div class="relative aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-slate-800">
        <video id="videoLive" autoplay playsinline muted class="w-full h-full object-cover"></video>
        <canvas id="overlayCanvas" class="absolute inset-0 w-full h-full pointer-events-none"></canvas>
      </div>

      <!-- Tombol Kirim: Terkunci hingga AI Person terdeteksi -->
      <button id="btnSubmit" disabled class="w-full py-3.5 rounded-xl font-bold text-sm bg-slate-800 text-slate-500 cursor-not-allowed">
        MENUNGGU DETEKSI AI SISWA
      </button>
    </div>
  </main>

  <script src="supabase.js"></script>
  <script src="detector.js"></script>
  <script src="app.js"></script>
</body>
</html>`;

  const detectorJsCode = `// detector.js - Deteksi Real-time AI Person menggunakan TensorFlow.js COCO-SSD
let cocoModel = null;

async function initAiDetector() {
  console.log('Memuat neural network COCO-SSD...');
  cocoModel = await cocoSsd.load({ base: 'mobilenet_v2' });
  console.log('Model AI Siap.');
}

async function detectPersonFrame(videoEl, canvasEl, onResult) {
  if (!cocoModel || videoEl.readyState < 2) return;

  const ctx = canvasEl.getContext('2d');
  canvasEl.width = videoEl.videoWidth;
  canvasEl.height = videoEl.videoHeight;
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

  const predictions = await cocoModel.detect(videoEl);
  // Cari objek manusia dengan confidence >= 55%
  const person = predictions.find(p => p.class === 'person' && p.score >= 0.55);

  if (person) {
    const [x, y, w, h] = person.bbox;
    const score = Math.round(person.score * 100);

    // Gambar Bounding Box Neon Green
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 12;
    ctx.strokeRect(x, y, w, h);

    // Semi-transparan fill
    ctx.fillStyle = 'rgba(0, 255, 102, 0.12)';
    ctx.fillRect(x, y, w, h);

    // Label neon
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#052e16';
    ctx.fillRect(x, y - 24, 180, 24);
    ctx.strokeStyle = '#00ff66';
    ctx.strokeRect(x, y - 24, 180, 24);

    ctx.fillStyle = '#00ff66';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(\`Person Detected: \${score}%\`, x + 8, y - 7);

    onResult({ hasPerson: true, score });
  } else {
    onResult({ hasPerson: false, score: 0 });
  }
}`;

  const supabaseJsCode = `// supabase.js - Integrasi Backend Supabase & Server Timestamp
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Simpan data presensi dengan Server Timestamp (Bukan Jam HP Siswa)
async function insertPresensiRecord(record) {
  const { data, error } = await supabase
    .from('presensi_sholat')
    .insert([{
      name: record.name,
      class: record.class,
      prayer_type: record.prayer_type,
      status: record.status,
      ai_status: record.ai_status,
      ai_confidence: record.ai_confidence,
      gps_status: record.gps_status,
      gps_distance: record.gps_distance,
      snapshot_photo: record.snapshot_photo,
      notes: record.notes
      // created_at otomatis diisi Server Timestamp oleh PostgreSQL now()
    }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Ambil data untuk audit trail dan filter laporan
async function fetchPresensiRecords(filterDateStart, filterDateEnd, filterClass) {
  let query = supabase.from('presensi_sholat').select('*').order('created_at', { ascending: false });
  if (filterDateStart) query = query.gte('created_at', filterDateStart);
  if (filterDateEnd) query = query.lte('created_at', filterDateEnd + 'T23:59:59Z');
  if (filterClass) query = query.eq('class', filterClass);
  const { data, error } = await query;
  if (error) throw error;
  return data;
}`;

  const currentContent = {
    standalone: 'Silakan unduh file standalone presensi-sholat-standalone.html di tombol atas untuk mendapatkan seluruh kode lengkap (HTML, CSS, JS, AI, Supabase, Geofence, & Excel) dalam 1 file siap pakai.',
    'modular-html': modularHtmlCode,
    detector: detectorJsCode,
    supabase: supabaseJsCode,
    schema: SUPABASE_SQL_SCHEMA,
  }[activeTab];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-xs font-bold">
              Arsitektur Kode Vanilla JS & Supabase
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white">
            Kode Lengkap HTML, Tailwind CSS (CDN), & JavaScript Murni
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Telah disusun dalam struktur modular yang rapi agar mudah di-copy dan dijalankan secara langsung.
          </p>
        </div>

        {/* 1-Click Download Standalone HTML */}
        <button
          type="button"
          onClick={downloadStandaloneHtml}
          className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-lg shadow-emerald-600/30 flex items-center gap-2 active:scale-95"
        >
          <Download className="w-4 h-4" />
          <span>Unduh File HTML Standalone (.html)</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('standalone')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'standalone' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>File HTML Tunggal Siap Pakai</span>
        </button>

        <button
          onClick={() => setActiveTab('modular-html')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'modular-html' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>index.html</span>
        </button>

        <button
          onClick={() => setActiveTab('detector')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'detector' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>detector.js (AI COCO-SSD)</span>
        </button>

        <button
          onClick={() => setActiveTab('supabase')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'supabase' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>supabase.js</span>
        </button>

        <button
          onClick={() => setActiveTab('schema')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
            activeTab === 'schema' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>schema.sql</span>
        </button>
      </div>

      {/* Code Viewer Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>{activeTab === 'standalone' ? 'presensi-sholat-standalone.html' : activeTab}</span>
          </div>

          <button
            type="button"
            onClick={() => copyToClipboard(currentContent)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Kode</span>
              </>
            )}
          </button>
        </div>

        <div className="p-4 overflow-x-auto max-h-[600px] bg-slate-950 font-mono text-xs leading-relaxed text-emerald-300">
          {activeTab === 'standalone' ? (
            <div className="p-6 text-center space-y-4 font-sans">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <FileCode className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">File Standalone Mandiri Telah Siap</h3>
              <p className="text-xs text-slate-400 max-w-lg mx-auto">
                File <code className="text-emerald-400 bg-slate-900 px-2 py-1 rounded">presensi-sholat-standalone.html</code> sudah tersimpan di direktori <code className="text-emerald-400 bg-slate-900 px-2 py-1 rounded">/public/</code>.
                File ini memuat seluruh kode HTML, Tailwind CSS (CDN), TensorFlow.js COCO-SSD, Geofencing GPS, Supabase Client, dan SheetJS Excel Export dalam satu kesatuan yang dapat Anda buka langsung di browser mana pun tanpa perlu instalasi Node.js!
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={downloadStandaloneHtml}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File HTML Sekarang</span>
                </button>
                <a
                  href="/presensi-sholat-standalone.html"
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Buka di Tab Baru</span>
                </a>
              </div>
            </div>
          ) : (
            <pre>{currentContent}</pre>
          )}
        </div>
      </div>
    </div>
  );
};
