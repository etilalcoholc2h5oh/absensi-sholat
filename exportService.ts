import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AttendanceRecord } from '../types';
import { MADRASAH_INFO } from '../data/madrasahData';

const reportTitle = 'LAPORAN REKAPITULASI PRESENSI SHOLAT SISWA';
const safeDate = (value: string) => new Date(value).toLocaleDateString('id-ID');

export function exportToExcel(records: AttendanceRecord[], filterSummary = 'Semua Data Terarsip'): void {
  const rows = records.map((rec, index) => ({
    No: index + 1,
    Tanggal: safeDate(rec.created_at),
    Jam: new Date(rec.created_at).toLocaleTimeString('id-ID'),
    'Nama Siswa': rec.name,
    Kelas: rec.class,
    'Jenis Sholat': rec.prayer_type,
    'Status Kehadiran': rec.status,
    'Deteksi AI': rec.ai_status || '-',
    'Status Lokasi GPS': rec.gps_status || '-',
    'Jarak GPS': rec.gps_distance ? `${rec.gps_distance} m` : '-',
    Keterangan: rec.notes || '-',
    'ID Sistem': rec.id,
  }));
  const sheet = XLSX.utils.aoa_to_sheet([
    [`${reportTitle} - ${MADRASAH_INFO.name.toUpperCase()}`],
    [`Instansi: ${MADRASAH_INFO.address}`],
    [`Periode / Filter: ${filterSummary} | Total Catatan: ${records.length}`],
    [`Tanggal Ekspor: ${new Date().toLocaleString('id-ID')}`],
    [],
  ]);
  XLSX.utils.sheet_add_json(sheet, rows, { origin: 'A6' });
  sheet['!cols'] = [6, 14, 12, 28, 12, 18, 20, 28, 24, 14, 34, 22].map((wch) => ({ wch }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Rekap Presensi');
  XLSX.writeFile(workbook, `Rekap_Presensi_Sholat_MAN1_Boyolali_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportToPdf(records: AttendanceRecord[], filterSummary = 'Semua Data Terarsip'): void {
  if (!records.length) return;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text(reportTitle, 14, 15);
  doc.setFontSize(11); doc.text(MADRASAH_INFO.name.toUpperCase(), 14, 21);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text(MADRASAH_INFO.address, 14, 26);
  doc.text(`Lokasi presensi: ${'Mushola Sekolah & Lapangan'}`, 14, 30);
  doc.text(`Filter / Periode: ${filterSummary} | Total Data: ${records.length}`, 14, 34);
  doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 38);
  autoTable(doc, {
    startY: 43,
    head: [['No', 'Waktu', 'Nama Siswa', 'Kelas', 'Sholat', 'Status', 'Verifikasi AI', 'Lokasi GPS', 'Keterangan']],
    body: records.map((rec, index) => [index + 1, `${safeDate(rec.created_at)} ${new Date(rec.created_at).toLocaleTimeString('id-ID')}`, rec.name, rec.class, rec.prayer_type, rec.status, rec.ai_status || '-', `${rec.gps_status || '-'}${rec.gps_distance ? ` (${rec.gps_distance}m)` : ''}`, rec.notes || '-']),
    theme: 'grid', headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 }, styles: { fontSize: 8, cellPadding: 2 }, margin: { left: 14, right: 14 },
  });
  doc.save(`Laporan_Presensi_Sholat_MAN1_Boyolali_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function printPdfReport(records: AttendanceRecord[] = [], filterSummary = 'Semua Data Terarsip'): void {
  if (records.length) exportToPdf(records, filterSummary);
}
