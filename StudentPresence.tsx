import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  RefreshCw,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Send,
  Calendar,
  Lock,
  Sliders,
  X,
  ChevronDown,
  Sun,
  Clock,
  HeartHandshake,
  Stethoscope,
  Users,
  Layers,
  ArrowLeftRight,
  User,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Student, PrayerType, AttendanceStatus, DetectionResult } from '../types';
import { CLASSES, INITIAL_STUDENTS, MADRASAH_INFO } from '../data/madrasahData';
import {
  loadCocoSsdModel,
  detectObjects,
  drawDetectionOverlay,
  captureLiveSnapshot,
  captureFrameToCanvas,
  renderBeRealDualCanvas,
  playCameraShutterSound,
  BeRealRenderOptions,
} from '../services/aiDetector';
import {
  getCurrentPosition,
  checkGeofence,
  getGeofenceConfig,
  isSimulationMode,
  setSimulationMode,
} from '../services/geoService';
import { submitAttendanceRecord } from '../services/supabaseService';
import { BypassModal } from './BypassModal';
import { BeRealPreviewModal } from './BeRealPreviewModal';

interface StudentPresenceProps {
  onRecordSubmitted: () => void;
  onGpsUpdate: (isInside: boolean, distance: number) => void;
}

export const StudentPresence: React.FC<StudentPresenceProps> = ({
  onRecordSubmitted,
  onGpsUpdate,
}) => {
  // 1. Identitas Siswa State (Siswa mengetik nama sendiri & memilih kelas X-XII A-J)
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    return localStorage.getItem('man1_last_class') || 'X A';
  });
  const [studentName, setStudentName] = useState<string>(() => {
    return localStorage.getItem('man1_last_student_name') || '';
  });
  const [studentGender, setStudentGender] = useState<'L' | 'P'>(() => {
    return (localStorage.getItem('man1_last_student_gender') as 'L' | 'P') || 'L';
  });

  // Objek identitas siswa aktif
  const currentStudent: Student = {
    id: 'stu-' + (studentName.trim().toLowerCase().replace(/\s+/g, '-') || 'anon'),
    nisn: '',
    name: studentName.trim(),
    class: selectedClass,
    gender: studentGender,
  };

  // Simpan preferensi siswa di localStorage agar siswa tidak perlu ngetik ulang setiap hari
  useEffect(() => {
    if (selectedClass) localStorage.setItem('man1_last_class', selectedClass);
  }, [selectedClass]);

  useEffect(() => {
    if (studentName) localStorage.setItem('man1_last_student_name', studentName);
  }, [studentName]);

  useEffect(() => {
    if (studentGender) localStorage.setItem('man1_last_student_gender', studentGender);
  }, [studentGender]);

  // 2. Sesi Sholat & Jumat State
  const [isFridayReal, setIsFridayReal] = useState<boolean>(new Date().getDay() === 5);
  const [simulateFriday, setSimulateFriday] = useState<boolean>(false);
  const effectiveIsFriday = isFridayReal || simulateFriday;

  const [prayerType, setPrayerType] = useState<PrayerType>('Dhuha');

  // 3. Kamera & AI State
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(true);
  const [aiStatusMsg, setAiStatusMsg] = useState<string>('Menyiapkan AI COCO-SSD...');
  const [latestDetection, setLatestDetection] = useState<DetectionResult>({
    hasPerson: false,
    score: 0,
    allPredictions: [],
  });

  // 4. GPS & Geofencing State
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsInside, setGpsInside] = useState<boolean>(true);
  const [gpsDistance, setGpsDistance] = useState<number>(35);
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number } | undefined>();
  const [isSimulatedGps, setIsSimulatedGps] = useState<boolean>(isSimulationMode());

  // 5. Modals & Submission State
  const [bypassModalOpen, setBypassModalOpen] = useState<boolean>(false);
  const [bypassType, setBypassType] = useState<'Halangan' | 'SakitIzin'>('Halangan');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  // 6. BeReal Dual Capture State
  const [isBeRealCapturing, setIsBeRealCapturing] = useState<boolean>(false);
  const [beRealStepMsg, setBeRealStepMsg] = useState<string>('');
  const [countdownSec, setCountdownSec] = useState<number | null>(null);
  const [beRealFlash, setBeRealFlash] = useState<boolean>(false);
  const [beRealModalOpen, setBeRealModalOpen] = useState<boolean>(false);
  const [beRealPhotoUrl, setBeRealPhotoUrl] = useState<string>('');
  const frame1CanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame2CanvasRef = useRef<HTMLCanvasElement | null>(null);
  const beRealOptionsRef = useRef<BeRealRenderOptions | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Adjust prayer options when Friday changes
  useEffect(() => {
    if (effectiveIsFriday) {
      if (studentGender === 'L') {
        if (prayerType === 'Dzuhur') {
          setPrayerType('Sholat Jumat');
        }
      } else {
        if (prayerType === 'Sholat Jumat') {
          setPrayerType('Dzuhur');
        }
      }
    } else {
      if (prayerType === 'Sholat Jumat') {
        setPrayerType('Dzuhur');
      }
    }
  }, [effectiveIsFriday, studentGender, prayerType]);

  // Initialize GPS on load
  useEffect(() => {
    checkGps();
  }, []);

  const checkGps = async () => {
    setGpsLoading(true);
    try {
      const pos = await getCurrentPosition();
      const check = checkGeofence({ latitude: pos.latitude, longitude: pos.longitude });
      setGpsInside(check.isInside);
      setGpsDistance(check.distanceMeters);
      setGpsCoords({ latitude: pos.latitude, longitude: pos.longitude });
      onGpsUpdate(check.isInside, check.distanceMeters);
    } catch (err: any) {
      console.warn('GPS check error:', err);
      setGpsInside(false);
      setGpsDistance(999);
      onGpsUpdate(false, 999);
    } finally {
      setGpsLoading(false);
    }
  };

  const toggleGpsSimulation = () => {
    const nextState = !isSimulatedGps;
    setSimulationMode(nextState);
    setIsSimulatedGps(nextState);
    setTimeout(() => {
      checkGps();
    }, 150);
  };

  // Start Camera Stream
  const startCamera = async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setCameraActive(true);
        };
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(
        'Kamera tidak dapat diakses. Pastikan izin kamera telah diizinkan pada browser HP Anda.'
      );
      setCameraActive(false);
    }
  };

  // Switch facing mode
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Initialize AI Model
  useEffect(() => {
    let isMounted = true;
    const initAi = async () => {
      try {
        setAiLoading(true);
        setAiStatusMsg('Memuat model deteksi wujud (COCO-SSD)...');
        await loadCocoSsdModel();
        if (isMounted) {
          setAiLoading(false);
          setAiStatusMsg('AI Aktif & Siap');
        }
      } catch (err: any) {
        console.error('AI loading error:', err);
        if (isMounted) {
          setAiLoading(false);
          setAiStatusMsg('Gagal memuat AI: ' + err.message);
        }
      }
    };
    initAi();
    return () => {
      isMounted = false;
    };
  }, []);

  // Real-time Detection Loop
  useEffect(() => {
    let isRunning = true;
    let isDetecting = false;

    const runLoop = async () => {
      if (!isRunning) return;

      if (
        videoRef.current &&
        canvasRef.current &&
        videoRef.current.readyState >= 2 &&
        !aiLoading
      ) {
        if (!isDetecting) {
          isDetecting = true;
          try {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
              canvas.width = video.videoWidth || 640;
              canvas.height = video.videoHeight || 480;
            }

            const result = await detectObjects(video);
            setLatestDetection(result);
            drawDetectionOverlay(canvas, video, result);
          } catch (err) {
            console.warn('Detection error in frame:', err);
          } finally {
            isDetecting = false;
          }
        }
      }

      animationFrameRef.current = requestAnimationFrame(runLoop);
    };

    animationFrameRef.current = requestAnimationFrame(runLoop);

    return () => {
      isRunning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [aiLoading, cameraActive]);

  // Audio tone feedback
  const playBeepSuccess = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Ignore if audio is restricted
    }
  };

  // Presensi Wajib 2 Sudut BeReal (Kamera Depan + Belakang/Suasana)
  const handleBeRealCapture = async () => {
    if (!currentStudent) {
      alert('Silakan pilih nama siswa terlebih dahulu.');
      return;
    }
    if (!latestDetection.hasPerson) {
      alert('AI belum mendeteksi wujud siswa (Kotak Hijau). Harap posisikan kamera menghadap siswa.');
      return;
    }
    if (!videoRef.current) return;

    setIsBeRealCapturing(true);
    try {
      // 1. Jebret Sudut 1 (Wajah Siswa - Terverifikasi AI)
      setBeRealStepMsg('Sudut 1: Mengambil Foto Wajah Siswa...');
      await new Promise((r) => setTimeout(r, 200));

      playCameraShutterSound();
      setBeRealFlash(true);
      setTimeout(() => setBeRealFlash(false), 180);

      const isCurrentMirrored = facingMode === 'user';
      const frame1 = captureFrameToCanvas(videoRef.current, isCurrentMirrored);
      frame1CanvasRef.current = frame1;

      // 2. Ambil Sudut 2 (Suasana Sholat & Lingkungan)
      // Coba beralih ke lensa kamera kedua (kamera belakang)
      const oppositeMode: 'user' | 'environment' =
        facingMode === 'user' ? 'environment' : 'user';

      let frame2: HTMLCanvasElement | null = null;
      let switchedStream: MediaStream | null = null;
      let switchSuccess = false;

      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        switchedStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: oppositeMode,
            width: { ideal: 800 },
            height: { ideal: 600 },
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = switchedStream;
          await new Promise<void>((resolve) => {
            if (!videoRef.current) return resolve();
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().then(() => resolve()).catch(() => resolve());
            };
          });
        }

        // Jeda waktu sensor kamera menyesuaikan fokus & eksposur
        setBeRealStepMsg('Sudut 2: Mengambil Suasana Sholat (Kamera Belakang)...');
        await new Promise((r) => setTimeout(r, 700));

        playCameraShutterSound();
        setBeRealFlash(true);
        setTimeout(() => setBeRealFlash(false), 180);

        if (videoRef.current) {
          frame2 = captureFrameToCanvas(videoRef.current, oppositeMode === 'user');
          switchSuccess = true;
        }
      } catch (camErr) {
        console.warn('Perangkat tidak memiliki kamera kedua atau switch dibatasi:', camErr);
      } finally {
        if (switchedStream) {
          switchedStream.getTracks().forEach((t) => t.stop());
        }
        await startCamera();
      }

      // Jika perangkat hanya 1 kamera (atau switch gagal):
      // Wajib mengambil sudut kedua dengan hitung mundur agar pengguna memutar kamera ke shaf sholat
      if (!switchSuccess || !frame2) {
        setBeRealStepMsg('Sudut 1 Selesai! Arahkan kamera ke shaf sholat / masjid...');
        setCountdownSec(3);
        await new Promise((r) => setTimeout(r, 1000));
        setCountdownSec(2);
        await new Promise((r) => setTimeout(r, 1000));
        setCountdownSec(1);
        await new Promise((r) => setTimeout(r, 1000));
        setCountdownSec(null);

        setBeRealStepMsg('Sudut 2: Mengambil Suasana Sholat...');
        playCameraShutterSound();
        setBeRealFlash(true);
        setTimeout(() => setBeRealFlash(false), 180);

        if (videoRef.current) {
          frame2 = captureFrameToCanvas(videoRef.current, facingMode === 'user');
        } else {
          frame2 = frame1;
        }
      }

      frame2CanvasRef.current = frame2;

      // 3. Gabungkan menjadi BeReal Dual Canvas (2 Sudut Wajib)
      setBeRealStepMsg('Menyusun Format BeReal 2 Sudut...');
      const renderOpts: BeRealRenderOptions = {
        studentName: currentStudent.name,
        studentClass: currentStudent.class,
        prayerType: prayerType,
        aiConfidence: latestDetection.score,
        gpsText: gpsInside
          ? `GPS Valid Area Madrasah (${gpsDistance}m)`
          : `GPS Luar Radius (${gpsDistance}m)`,
      };
      beRealOptionsRef.current = renderOpts;

      // Jika awal kamera depan: frame2 (suasana) adalah latar utama, frame1 (selfie) adalah inset
      const mainCanvas = facingMode === 'user' ? frame2 : frame1;
      const insetCanvas = facingMode === 'user' ? frame1 : frame2;

      const finalPhoto = renderBeRealDualCanvas(mainCanvas, insetCanvas, renderOpts);
      setBeRealPhotoUrl(finalPhoto);
      setBeRealModalOpen(true);
    } catch (err: any) {
      console.error('BeReal capture error:', err);
      alert('Kendala saat jebret 2 sudut: ' + err.message);
    } finally {
      setIsBeRealCapturing(false);
      setCountdownSec(null);
      setBeRealStepMsg('');
    }
  };

  // Konfirmasi Pengiriman Hasil Foto BeReal
  const handleConfirmBeRealSubmit = async (finalPhoto: string) => {
    if (!currentStudent) return;
    setSubmitting(true);
    try {
      const res = await submitAttendanceRecord({
        name: currentStudent.name,
        class: currentStudent.class,
        prayer_type: prayerType,
        status: 'Hadir',
        ai_status: `Valid (Dual Camera: ${latestDetection.score}%)`,
        ai_confidence: latestDetection.score,
        gps_status: gpsInside ? 'Valid (Dalam Radius)' : 'Di Luar Radius',
        gps_distance: gpsDistance,
        gps_coords: gpsCoords,
        snapshot_photo: finalPhoto,
        notes: `Hadir sholat ${prayerType} berjamaah di madrasah (Foto Dual Camera Depan + Belakang)`,
        created_at: new Date().toISOString(),
      });

      playBeepSuccess();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#059669', '#3b82f6', '#f59e0b'],
      });

      setSubmitSuccessMsg(res.message);
      onRecordSubmitted();
      setBeRealModalOpen(false);

      setTimeout(() => {
        setSubmitSuccessMsg(null);
      }, 5000);
    } catch (err: any) {
      alert('Gagal mengirim data: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Bypass (Haid / Sakit)
  const handleBypassSubmit = async (status: AttendanceStatus, notes: string) => {
    if (!currentStudent) return;

    setSubmitting(true);
    try {
      const res = await submitAttendanceRecord({
        name: currentStudent.name,
        class: currentStudent.class,
        prayer_type: prayerType,
        status: status,
        ai_status: `Bypass (${status})`,
        gps_status: gpsInside ? 'Valid (Dalam Radius)' : 'Di Luar Radius',
        gps_distance: gpsDistance,
        gps_coords: gpsCoords,
        notes: notes,
        created_at: new Date().toISOString(),
      });

      playBeepSuccess();
      setSubmitSuccessMsg(res.message);
      onRecordSubmitted();

      setTimeout(() => {
        setSubmitSuccessMsg(null);
      }, 5000);
    } catch (err: any) {
      alert('Gagal mengirim: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const isPersonValid = latestDetection.hasPerson;
  const isNameValid = studentName.trim().length >= 2;
  const isSubmitDisabled = !isNameValid || !isPersonValid || submitting;

  const todayStr = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Clean, Elegant Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-slate-800/80">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Presensi Sholat Harian
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
            <span>{todayStr}</span>
            <span className="text-slate-600 font-light">|</span>
            <span className="text-emerald-400 font-medium">
              Sesi {prayerType}
            </span>
            {effectiveIsFriday && (
              <span className="text-amber-400 font-medium">
                (Hari Jumat)
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Success Banner */}
      {submitSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm flex items-center gap-3 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="flex-1 font-medium">{submitSuccessMsg}</div>
          <button
            onClick={() => setSubmitSuccessMsg(null)}
            className="text-emerald-400 hover:text-emerald-200 text-xs underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* KOLOM KIRI (5 Cols): Identitas Siswa & Pilihan Sholat */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Identitas Siswa
            </span>
            <div className="space-y-3 mt-2">
              {/* Kelas */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Pilih Kelas:
                </label>
                <select
                  id="select-kelas-siswa"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none transition cursor-pointer"
                >
                  {CLASSES.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nama Siswa (Ketik Sendiri) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nama Lengkap Siswa:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="input-nama-siswa"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Ketik nama lengkap Anda..."
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
                {!isNameValid && (
                  <p className="text-[11px] text-amber-400/90 mt-1">
                    *Ketik nama lengkap untuk melanjutkan presensi
                  </p>
                )}
              </div>

              {/* Jenis Kelamin */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Jenis Kelamin:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    id="btn-gender-laki"
                    onClick={() => setStudentGender('L')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
                      studentGender === 'L'
                        ? 'bg-sky-950 border-sky-500 text-sky-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Laki-laki</span>
                  </button>
                  <button
                    type="button"
                    id="btn-gender-perempuan"
                    onClick={() => setStudentGender('P')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition flex items-center justify-center gap-1.5 ${
                      studentGender === 'P'
                        ? 'bg-rose-950 border-rose-500 text-rose-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span>Perempuan</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sesi Sholat */}
          <div className="pt-3 border-t border-slate-800/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Pilihan Sholat
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-sholat-dhuha"
                onClick={() => setPrayerType('Dhuha')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                  prayerType === 'Dhuha'
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Dhuha</span>
              </button>

              {effectiveIsFriday && (!currentStudent || currentStudent.gender === 'L') ? (
                <button
                  type="button"
                  id="btn-sholat-jumat"
                  onClick={() => setPrayerType('Sholat Jumat')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                    prayerType === 'Sholat Jumat'
                      ? 'bg-amber-600 border-amber-500 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-amber-400 hover:text-amber-300'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-amber-300" />
                  <span>Sholat Jumat</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-sholat-dzuhur"
                  onClick={() => setPrayerType('Dzuhur')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                    prayerType === 'Dzuhur'
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Dzuhur</span>
                </button>
              )}
            </div>
          </div>

          {/* Dispensasi Khusus (Bypass Kamera) */}
          <div className="pt-3 border-t border-slate-800/80">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Izin & Halangan (Bypass)
            </span>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                id="btn-bypass-haid"
                disabled={studentGender === 'L'}
                onClick={() => {
                  if (!isNameValid) {
                    alert('Harap ketik nama lengkap Anda terlebih dahulu.');
                    return;
                  }
                  setBypassType('Halangan');
                  setBypassModalOpen(true);
                }}
                className={`py-2 px-3 rounded-xl font-semibold border transition flex items-center justify-center gap-1.5 ${
                  studentGender === 'L'
                    ? 'bg-slate-950 border-slate-800 text-slate-600 opacity-40 cursor-not-allowed'
                    : 'bg-rose-950/40 hover:bg-rose-900/50 border-rose-800/60 text-rose-300'
                }`}
                title={
                  studentGender === 'L'
                    ? 'Khusus siswi perempuan'
                    : "Formulir Halangan Syar'i (Haid)"
                }
              >
                <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
                <span>Haid</span>
              </button>

              <button
                type="button"
                id="btn-bypass-sakit"
                onClick={() => {
                  if (!isNameValid) {
                    alert('Harap ketik nama lengkap Anda terlebih dahulu.');
                    return;
                  }
                  setBypassType('SakitIzin');
                  setBypassModalOpen(true);
                }}
                className="py-2 px-3 rounded-xl font-semibold bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 text-amber-300 transition flex items-center justify-center gap-1.5"
              >
                <Stethoscope className="w-3.5 h-3.5 text-amber-400" />
                <span>Sakit / Izin</span>
              </button>
            </div>
          </div>

        </div>

        {/* KOLOM KANAN (7 Cols): Kamera Dual Real-Time, AI Overlay, & Submit */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          
          {/* Kamera Viewport Frame */}
          <div className="relative w-full aspect-[4/3] bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-inner flex items-center justify-center">
            
            {/* Video Stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />

            {/* Canvas Overlay Bounding Box */}
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full pointer-events-none ${
                facingMode === 'user' ? 'scale-x-[-1]' : ''
              }`}
            />

            {/* Flash Effect saat Jebret BeReal */}
            {beRealFlash && (
              <div className="absolute inset-0 bg-white z-40 transition-opacity duration-150 pointer-events-none opacity-90" />
            )}

            {/* BeReal Capture In-Progress Overlay */}
            {isBeRealCapturing && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center space-y-3">
                {countdownSec !== null ? (
                  <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 font-extrabold text-4xl shadow-xl animate-bounce">
                    {countdownSec}
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg animate-pulse">
                    <Camera className="w-7 h-7" />
                  </div>
                )}
                <div className="space-y-1 max-w-xs">
                  <p className="text-sm font-bold text-white tracking-wide">{beRealStepMsg}</p>
                  <p className="text-xs text-emerald-400 font-medium">
                    {countdownSec !== null
                      ? 'Putar kamera menghadap shaf sholat'
                      : 'Wajib 2 Sudut (Depan + Belakang)'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
                  <span className="text-[11px] text-slate-400">
                    {countdownSec !== null ? 'Bersiap mengambil sudut ke-2...' : 'Harap tahan posisi kamera...'}
                  </span>
                </div>
              </div>
            )}

            {/* AI Loading State */}
            {aiLoading && (
              <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                <div className="text-xs font-bold text-white">{aiStatusMsg}</div>
              </div>
            )}

            {/* Camera Error State */}
            {cameraError && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-20">
                <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                <div className="text-xs font-bold text-white">Kamera Tidak Aktif</div>
                <p className="text-[11px] text-rose-300 max-w-xs mt-1">{cameraError}</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                >
                  Akses Kamera
                </button>
              </div>
            )}

            {/* Floating Sleek AI Status Pill (Top Left) */}
            {!aiLoading && !cameraError && (
              <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                {isPersonValid ? (
                  <div className="px-3 py-1 rounded-full bg-slate-950/80 border border-emerald-500 text-emerald-300 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md shadow">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Siswa Terdeteksi ({latestDetection.score}%)</span>
                  </div>
                ) : (
                  <div className="px-3 py-1 rounded-full bg-slate-950/80 border border-rose-500/70 text-rose-300 text-xs font-bold flex items-center gap-1.5 backdrop-blur-md shadow">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>Arahkan ke Wajah Siswa</span>
                  </div>
                )}

                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/80 border border-slate-700/80 text-slate-300 text-[11px] font-medium backdrop-blur-md">
                  <Layers className="w-3 h-3 text-emerald-400" />
                  <span>Dual Camera</span>
                </div>
              </div>
            )}

            {/* Switch Camera Button (Top Right, icon-only) */}
            <button
              type="button"
              id="btn-toggle-kamera"
              onClick={toggleCameraFacing}
              className="absolute top-3 right-3 z-10 p-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-700/80 text-slate-200 hover:text-white backdrop-blur-md transition shadow flex items-center justify-center"
              title="Ganti Kamera"
              aria-label="Ganti Kamera"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
            </button>
          </div>

          {/* Slim GPS & Verification Status Strip */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${gpsInside ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              <span className="text-slate-300 font-medium">
                {gpsInside ? 'Area MAN 1 Boyolali' : 'Di Luar Radius Madrasah'}
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                ({gpsDistance}m)
              </span>
            </div>

            <button
              type="button"
              onClick={checkGps}
              disabled={gpsLoading}
              className="text-slate-400 hover:text-emerald-400 text-[11px] flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
              <span>Cek GPS</span>
            </button>
          </div>

          {/* Primary Action Buttons: BeReal Hero Button & Quick Standard */}
          <div className="space-y-2">
            <button
              type="button"
              id="btn-jebret-bereal"
              disabled={isSubmitDisabled || isBeRealCapturing}
              onClick={handleBeRealCapture}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition flex items-center justify-center gap-2 shadow-lg ${
                isSubmitDisabled || isBeRealCapturing
                  ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-60'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25 active:scale-[0.99] cursor-pointer'
              }`}
            >
              {isBeRealCapturing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{beRealStepMsg || 'Memproses Dual Camera...'}</span>
                </>
              ) : !isNameValid ? (
                <>
                  <User className="w-4 h-4 text-amber-400" />
                  <span>Ketik Nama Siswa Terlebih Dahulu</span>
                </>
              ) : isPersonValid ? (
                <>
                  <Camera className="w-4 h-4 text-white" />
                  <span>Jebret Dual Camera: {studentName.trim()}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Menunggu Deteksi AI Siswa (Kotak Hijau)</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 px-3 py-2 text-center text-xs text-slate-300 bg-slate-950 border border-slate-800 rounded-xl">
              <Camera className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Wajib Foto 2 Sudut: Wajah Siswa + Suasana Sholat (Dual Camera)</span>
            </div>
          </div>

        </div>

      </div>

      {/* BeReal Snapshot Preview & Position Swap Modal */}
      <BeRealPreviewModal
        isOpen={beRealModalOpen}
        onClose={() => setBeRealModalOpen(false)}
        initialPhotoUrl={beRealPhotoUrl}
        frame1Canvas={frame1CanvasRef.current}
        frame2Canvas={frame2CanvasRef.current}
        renderOptions={
          beRealOptionsRef.current || {
            studentName: currentStudent?.name || '',
            studentClass: currentStudent?.class || '',
            prayerType: prayerType,
          }
        }
        onRetake={() => {
          setBeRealModalOpen(false);
          handleBeRealCapture();
        }}
        onConfirmSubmit={handleConfirmBeRealSubmit}
        isSubmitting={submitting}
      />

      {/* Bypass Modal (Haid / Sakit) */}
      <BypassModal
        isOpen={bypassModalOpen}
        onClose={() => setBypassModalOpen(false)}
        onSubmit={handleBypassSubmit}
        student={currentStudent}
        prayerType={prayerType}
        type={bypassType}
      />

    </div>
  );
};
