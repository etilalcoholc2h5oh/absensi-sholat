import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AttendanceRecord } from '../types';
import { MADRASAH_INFO } from '../data/madrasahData';

export function exportToExcel(records: AttendanceRecord[], filterSummary?: string): void {
  // Format data untuk SheetJS
  const dataRows = records.map((rec, idx) => {
    const d = new Date(rec.created_at);
    const dateFormatted = d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeFormatted = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return {
      No: idx + 1,
      Tanggal: dateFormatted,
      Jam: timeFormatted,
      'Nama Siswa': rec.name,
      Kelas: rec.class,
      'Jenis Sholat': rec.prayer_type,
      'Status Kehadiran': rec.status,
      'Deteksi AI': rec.ai_status + (rec.ai_confidence ? ` (${rec.ai_confidence}%)` : ''),
      'Status Lokasi GPS': rec.gps_status,
      'Jarak ke Musholla/Lapangan (m)': rec.gps_distance ? `${rec.gps_distance} m` : '-',
      Keterangan: rec.notes || '-',
      'ID Sistem': rec.id,
    };
  });

  // Buat worksheet dengan Header Laporan Resmi terlebih dahulu
  const ws = XLSX.utils.aoa_to_sheet([
    [`LAPORAN REKAPITULASI PRESENSI SHOLAT SISWA - ${MADRASAH_INFO.name.toUpperCase()}`],
    [`Alamat: ${MADRASAH_INFO.address}`],
    [`Periode / Filter: ${filterSummary || 'Semua Data Terarsip'} | Total Catatan: ${records.length}`],
    [`Tanggal Ekspor: ${new Date().toLocaleString('id-ID')} | Dicetak oleh Sistem Audit Presensi Sholat`],
    [], // Baris kosong sebelum header tabel
  ]);

  // Tambahkan data tabel mulai dari baris A6
  XLSX.utils.sheet_add_json(ws, dataRows, { origin: 'A6' });

  // Atur lebar kolom agar rapi saat dibuka di Microsoft Excel
  ws['!cols'] = [
    { wch: 6 },  // No
    { wch: 14 }, // Tanggal
    { wch: 12 }, // Jam
    { wch: 28 }, // Nama Siswa
    { wch: 16 }, // Kelas
    { wch: 16 }, // Jenis Sholat
    { wch: 18 }, // Status Kehadiran
    { wch: 26 }, // Deteksi AI
    { wch: 24 }, // Status Lokasi
    { wch: 20 }, // Jarak GPS
    { wch: 30 }, // Keterangan
    { wch: 20 }, // ID Sistem
  ];

  // Buat workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Rekap Presensi');

  // Unduh file .xlsx
  const filename = `Rekap_Presensi_Sholat_MAN1_Boyolali_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export function exportToPdf(records: AttendanceRecord[], filterSummary?: string): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`LAPORAN REKAPITULASI PRESENSI SHOLAT SISWA`, 14, 15);
  doc.setFontSize(11);
  doc.text(MADRASAH_INFO.name.toUpperCase(), 14, 21);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`${MADRASAH_INFO.address}`, 14, 26);
  doc.text(`Area Sholat: Mushola & Lapangan Madrasah`, 14, 30);
  doc.text(`Filter / Periode: ${filterSummary || 'Semua Data Terarsip'} | Total Data: ${records.length} Siswa`, 14, 34);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')} | Sistem Presensi MAN 1 Boyolali`, 14, 38);

  // Garis pemisah
  doc.setLineWidth(0.5);
  doc.line(14, 40, 283, 40);

  // Data baris tabel
  const tableData = records.map((rec, idx) => {
    const d = new Date(rec.created_at);
    const dateStr = d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return [
      idx + 1,
      `${dateStr} ${timeStr}`,
      rec.name,
      rec.class,
      rec.prayer_type,
      rec.status,
      rec.ai_status + (rec.ai_confidence ? ` (${rec.ai_confidence}%)` : ''),
      rec.gps_status + (rec.gps_distance ? ` (${rec.gps_distance}m)` : ''),
      rec.notes || '-'
    ];
  });

  autoTable(doc, {
    startY: 43,
    head: [['No', 'Waktu', 'Nama Siswa', 'Kelas', 'Sholat', 'Status', 'Verifikasi AI', 'Lokasi GPS', 'Keterangan']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 26 },
      2: { cellWidth: 48 },
      3: { cellWidth: 18 },
      4: { cellWidth: 20 },
      5: { cellWidth: 24 },
      6: { cellWidth: 36 },
      7: { cellWidth: 36 },
      8: { cellWidth: 'auto' },
    },
    margin: { left: 14, right: 14 },
    foot: [
      ['', '', `Total Presensi: ${records.length}`, '', '', '', '', '', '']
    ],
    footStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59], fontStyle: 'bold' }
  });

  const filename = `Laporan_Presensi_Sholat_MAN1_Boyolali_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

export function printPdfReport(records?: AttendanceRecord[], filterSummary?: string): void {
  if (records && records.length > 0) {
    exportToPdf(records, filterSummary);
    return;
  }
  // Fallback ke window.print jika tanpa data
  try {
    window.print();
  } catch {
    // Ignore iframe print error
  }
}
