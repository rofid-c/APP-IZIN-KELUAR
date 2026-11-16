@echo off
setlocal
cd /d "%~dp0"
title UPDATE E-IZIN - Pengadilan Agama Gunung Sugih
color 0A
cls

echo =====================================================================
echo           UPDATE APLIKASI E-IZIN - PA GUNUNG SUGIH
echo                  Pembaruan Otomatis dari GitHub
echo =====================================================================
echo.
echo  Pembaruan ini akan mengambil versi terbaru dari GitHub secara aman.
echo  DATA LAMA ANDA (Surat Izin, Akun Pegawai, Kategori) AKAN TETAP AMAN.
echo.
echo =====================================================================
echo.

:: 1. Cek koneksi & ketersediaan Git
where git >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Git tidak ditemukan di komputer ini!
    echo Pastikan Git sudah terpasang agar dapat memperbarui aplikasi.
    echo Unduh Git di: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo [1/5] Memeriksa instalasi Git... OK!
echo.

:: 2. Amankan & Backup data pengguna saat ini
echo [2/5] Mengamankan dan mem-backup data aplikasi saat ini...
if not exist "data_backup" mkdir "data_backup"
if exist "data" (
    xcopy /E /I /Y /Q "data" "data_backup\backup_terbaru" >nul
    xcopy /E /I /Y /Q "data" "_temp_data_safe" >nul
    echo       - Backup data berhasil disimpan di folder 'data_backup\backup_terbaru'
) else (
    echo       - Folder data belum ada, akan dibuat otomatis oleh sistem.
)
echo.

:: 3. Sinkronisasi dengan GitHub
echo [3/5] Mengunduh pembaruan terbaru dari GitHub...
git fetch origin main
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Gagal terhubung ke GitHub!
    echo Pastikan komputer terhubung ke internet dan coba kembali.
    if exist "_temp_data_safe" rd /s /q "_temp_data_safe" >nul 2>nul
    echo.
    pause
    exit /b 1
)

:: Reset file kode ke HEAD origin/main untuk memastikan pembaruan tidak bentrok
git reset --hard origin/main
if %errorlevel% neq 0 (
    color 0C
    echo.
    echo [ERROR] Terjadi kendala saat menerapkan pembaruan.
    echo Memulihkan data pengguna...
    if exist "_temp_data_safe" (
        xcopy /E /I /Y /Q "_temp_data_safe" "data" >nul
        rd /s /q "_temp_data_safe" >nul 2>nul
    )
    echo.
    pause
    exit /b 1
)
echo       - Kode aplikasi berhasil diperbarui ke versi terbaru!
echo.

:: 4. Kembalikan data pengguna 100% utuh
echo [4/5] Memulihkan seluruh data pengguna (surat izin, akun, kategori)...
if exist "_temp_data_safe" (
    xcopy /E /I /Y /Q "_temp_data_safe" "data" >nul
    rd /s /q "_temp_data_safe" >nul 2>nul
    echo       - Seluruh data lama Anda berhasil dipulihkan 100%% tanpa ada yang hilang!
)
echo.

:: 5. Periksa dependensi pustaka npm
echo [5/5] Memeriksa dan memperbarui library aplikasi (npm install)...
where node >nul 2>nul
if %errorlevel% equ 0 (
    call npm install --no-audit --no-fund
) else (
    echo       - Node.js belum terdeteksi di PATH, lewati npm install.
)
echo.

echo =====================================================================
echo  [SUKSES] APLIKASI E-IZIN BERHASIL DIPERBARUI!
echo =====================================================================
echo.
echo  - Versi aplikasi sudah paling baru sesuai GitHub.
echo  - Seluruh data akun, izin, dan kategori tetap utuh dan aman.
echo.
echo  Silakan jalankan START.bat untuk mulai menggunakan aplikasi.
echo =====================================================================
echo.

set /p JALANKAN="Ingin langsung menjalankan aplikasi sekarang? (Y/N): "
if /i "%JALANKAN%"=="Y" (
    echo.
    echo Menjalankan aplikasi...
    start "" "START.bat"
    exit /b 0
)

pause
exit /b 0
