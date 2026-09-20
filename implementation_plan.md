# Rencana Perombakan UI/UX dan Fitur Presensi Sholat

## Koreksi wajib

- Gunakan nama lokasi **MAN 1 Boyolali** saja pada seluruh tampilan, cuaca, GPS, Excel, dan PDF.
- Jangan tampilkan nama Jalan Kates, Karanggede, atau alamat lama yang tidak terverifikasi.
- Alamat laporan resmi: **MAN 1 Boyolali, Boyolali, Jawa Tengah**.
- Pertahankan logo sekolah di kiri atas navbar, di sebelah nama MAN 1 Boyolali.
- Jangan tampilkan logo atau ikon dekoratif tambahan di pojok kanan atas; sisi kanan hanya untuk navigasi dan notifikasi.
- Semua emoji dihapus dari antarmuka.

## Perubahan UI/UX

- Terapkan tema light dengan latar putih dan abu-abu sangat muda.
- Gunakan teks yang lebih besar, kontras jelas, serta target sentuh minimal 44px.
- Buat navbar responsif dan intuitif untuk siswa dan guru.
- Susun logo dan identitas madrasah di kiri, lalu navigasi di kanan.
- Pertahankan ikon Lucide yang fungsional, tanpa logo dekoratif tambahan.
- Susun form identitas dan kamera satu kolom di mobile, dua kolom di desktop.
- Sederhanakan dashboard guru menjadi rekap, filter, statistik, bukti foto, Excel, dan PDF.
- Hilangkan tab Vanilla Code.
- Hilangkan teks instruksi dual camera yang berlebihan, tetapi pertahankan fitur dual camera.

## Keamanan dan akses guru

- PIN awal guru: `3103`.
- Jangan menampilkan PIN default pada placeholder atau pesan error.
- Hapus backdoor PIN `admin`.
- Pesan gagal login: `PIN salah! Silakan hubungi admin.`
- PIN tetap dapat diganti dari area pengaturan internal guru.

## Lokasi dan data

- Nama geofence: `Mushola Sekolah & Lapangan`.
- Status GPS siswa: `Area Madrasah` atau `Luar Radius`.
- Simpan timestamp server, koordinat GPS, akurasi GPS, dan snapshot presensi.
- Guru hanya dapat melihat snapshot yang dikirim ketika presensi, bukan CCTV atau kamera perangkat secara terus-menerus.

## Ekspor

- Excel dan PDF harus memakai identitas `MAN 1 Boyolali`.
- Jangan gunakan alamat `Jl. Karanggede - Gemolong Km. 1`.
- Tombol PDF harus memanggil generator PDF dengan `filteredRecords` dan ringkasan filter.
- Jika data kosong, tampilkan pesan yang jelas dan jangan mengunduh laporan kosong.

## Verifikasi

- Jalankan `npm run lint` dan `npm run build`.
- Uji tampilan mobile, tablet, dan desktop.
- Uji login PIN `3103` dan pastikan `admin` ditolak.
- Pastikan nama Jalan Kates dan Karanggede tidak muncul pada UI, Excel, PDF, atau data madrasah.
- Pastikan logo sekolah tampil di kiri atas dan tidak ada logo tambahan di kanan atas.
- Pastikan fitur dual camera dan snapshot tetap berfungsi.
