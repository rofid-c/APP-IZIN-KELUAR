@echo off
setlocal EnableExtensions
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
echo  DATA LAMA ANDA [Surat Izin, Akun Pegawai, Kategori] AKAN TETAP AMAN.
echo.
echo =====================================================================
echo.

:: 1. Deteksi Metode Pembaruan: Git atau Unduh Langsung via Windows
set METODE=DIRECT
where git >nul 2>nul
if %errorlevel% neq 0 goto METODE_DETEKSI_DONE
if not exist ".git" goto METODE_DETEKSI_DONE
set METODE=GIT

:METODE_DETEKSI_DONE
if "%METODE%"=="GIT" goto CETAK_METODE_GIT
echo [1/5] Mode: Pembaruan Mandiri Windows [Tanpa Perlu Git]... OK!
goto CETAK_METODE_DONE

:CETAK_METODE_GIT
echo [1/5] Mode: Terdeteksi Git dan repositori lokal... OK!

:CETAK_METODE_DONE
echo.

:: 2. Amankan & Backup data pengguna saat ini
echo [2/5] Mengamankan dan mem-backup data aplikasi saat ini...
if not exist "data_backup" mkdir "data_backup"
if not exist "data" goto DATA_BELUM_ADA
xcopy /E /I /Y /Q "data" "data_backup\backup_terbaru" >nul
xcopy /E /I /Y /Q "data" "_temp_data_safe" >nul
echo       - Backup data berhasil disimpan di folder 'data_backup\backup_terbaru'
goto DATA_SELESAI

:DATA_BELUM_ADA
echo       - Folder data belum ada, akan dibuat otomatis oleh sistem.

:DATA_SELESAI
echo.

:: 3. Sinkronisasi dengan GitHub
echo [3/5] Mengunduh pembaruan terbaru dari GitHub...

if "%METODE%"=="GIT" goto UPDATE_VIA_GIT
goto UPDATE_VIA_DIRECT

:UPDATE_VIA_GIT
git fetch origin main >nul 2>nul
if %errorlevel% neq 0 goto GIT_GAGAL
git reset --hard origin/main >nul 2>nul
if %errorlevel% neq 0 goto GIT_GAGAL
echo       - Kode aplikasi berhasil diperbarui via Git!
goto PULIHKAN_DATA

:GIT_GAGAL
echo       - Git tidak merespon, beralih ke mode unduh langsung bawaan Windows...
goto UPDATE_VIA_DIRECT

:UPDATE_VIA_DIRECT
where curl >nul 2>nul
if %errorlevel% neq 0 goto NO_CURL

where tar >nul 2>nul
if %errorlevel% neq 0 goto NO_TAR

echo       - Mengunduh paket pembaruan dari GitHub...
curl -sL "https://github.com/rofid-c/APP-IZIN-KELUAR/archive/refs/heads/main.zip" -o "_update.zip"
if not exist "_update.zip" goto DOWNLOAD_GAGAL

echo       - Mengekstrak paket pembaruan...
tar -xf "_update.zip"
if not exist "APP-IZIN-KELUAR-main" goto EKSTRAK_GAGAL

echo       - Memperbarui berkas kode aplikasi...
:: Hapus UPDATE.bat di folder ekstraksi agar skrip yang sedang berjalan tidak ditimpa/crash
if exist "APP-IZIN-KELUAR-main\UPDATE.bat" del /f /q "APP-IZIN-KELUAR-main\UPDATE.bat" >nul 2>nul
xcopy /E /I /Y /Q "APP-IZIN-KELUAR-main\*" "." >nul
rd /s /q "APP-IZIN-KELUAR-main" >nul 2>nul
del /f /q "_update.zip" >nul 2>nul
echo       - Kode aplikasi berhasil diperbarui ke versi terbaru!
goto PULIHKAN_DATA

:PULIHKAN_DATA
echo.
:: 4. Kembalikan data pengguna 100% utuh
echo [4/5] Memulihkan seluruh data pengguna [surat izin, akun, kategori]...
if not exist "_temp_data_safe" goto RESTORE_SELESAI
xcopy /E /I /Y /Q "_temp_data_safe" "data" >nul
rd /s /q "_temp_data_safe" >nul 2>nul
echo       - Seluruh data lama Anda berhasil dipulihkan tanpa ada yang hilang!

:RESTORE_SELESAI
echo.

:: 5. Periksa dependensi pustaka npm
echo [5/5] Memeriksa dependensi library aplikasi [npm install]...
where node >nul 2>nul
if %errorlevel% neq 0 goto NODE_LEWATI
call npm install --no-audit --no-fund
goto NODE_SELESAI

:NODE_LEWATI
echo       - Node.js belum terpasang di komputer ini, lewati npm install.

:NODE_SELESAI
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

set JALANKAN=N
set /p JALANKAN="Ingin langsung menjalankan aplikasi sekarang? (Y/N, default N): "
if /i "%JALANKAN%"=="Y" goto JALANKAN_SEKARANG
echo.
echo =====================================================================
echo Selesai. Tekan tombol apa saja untuk menutup jendela ini...
echo =====================================================================
pause >nul
exit /b 0

:JALANKAN_SEKARANG
echo.
echo Menjalankan aplikasi...
start "" "START.bat"
exit /b 0

:NO_CURL
color 0C
echo.
echo [ERROR] Layanan curl tidak tersedia di Windows ini.
goto BERSIHKAN_GAGAL

:NO_TAR
color 0C
echo.
echo [ERROR] Layanan tar tidak tersedia di Windows ini.
goto BERSIHKAN_GAGAL

:DOWNLOAD_GAGAL
color 0C
echo.
echo [ERROR] Gagal mengunduh berkas dari GitHub. Pastikan ada koneksi internet.
goto BERSIHKAN_GAGAL

:EKSTRAK_GAGAL
color 0C
echo.
echo [ERROR] Gagal mengekstrak berkas pembaruan.
goto BERSIHKAN_GAGAL

:BERSIHKAN_GAGAL
if exist "_temp_data_safe" (
    xcopy /E /I /Y /Q "_temp_data_safe" "data" >nul
    rd /s /q "_temp_data_safe" >nul 2>nul
)
if exist "APP-IZIN-KELUAR-main" rd /s /q "APP-IZIN-KELUAR-main" >nul 2>nul
if exist "_update.zip" del /f /q "_update.zip" >nul 2>nul
echo.
echo =====================================================================
echo Tekan tombol apa saja untuk menutup jendela ini...
echo =====================================================================
pause >nul
exit /b 1
