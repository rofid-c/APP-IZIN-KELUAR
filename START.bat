@echo off
:: Pastikan bekerja di direktori tempat file bat ini berada
cd /d "%~dp0"

title E-IZIN - Pengadilan Agama Gunung Sugih
color 0A
cls

echo =====================================================================
echo           E-IZIN KELUAR KANTOR - PA GUNUNG SUGIH
echo                  One-Click Starter Script
echo =====================================================================
echo.

:: 1. Cek apakah Node.js sudah terpasang
where node >nul 2>nul
if %errorlevel% neq 0 goto NODE_TIDAK_ADA

echo [1/3] Memeriksa Node.js... OK!
node -v
echo.
goto CEK_MODULES

:NODE_TIDAK_ADA
color 0C
echo [PERINGATAN] Node.js BELUM TERPASANG di komputer / laptop ini!
echo Aplikasi ini membutuhkan Node.js agar dapat berjalan.
echo.
where winget >nul 2>nul
if %errorlevel% neq 0 goto BUKA_WEB_NODE

echo [INFO] Terdeteksi Windows Package Manager (winget).
echo Ingin menginstall Node.js LTS secara otomatis?
set /p PILIH_INSTALL="Install otomatis sekarang? (Y/N): "
if /i "%PILIH_INSTALL%"=="Y" (
    echo.
    echo Sedang mengunduh dan memasang Node.js LTS secara otomatis...
    winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
    echo.
    echo =====================================================================
    echo  Instalasi Node.js selesai!
    echo  Silakan tutup jendela ini, lalu klik dua kali START.bat kembali.
    echo =====================================================================
    pause
    exit /b
)

:BUKA_WEB_NODE
echo.
echo Langkah mudah:
echo 1. Kunjungi website https://nodejs.org
echo 2. Download versi LTS
echo 3. Install file yang diunduh sampai selesai
echo 4. Jalankan kembali file START.bat ini
echo.
echo Tekan tombol apa saja untuk membuka website download Node.js...
pause >nul
start https://nodejs.org/
goto SELESAI

:CEK_MODULES
:: 2. Cek apakah node_modules sudah terinstall
if exist "node_modules\" goto MODULES_SUDAH_ADA

echo [2/3] Dependensi belum terpasang.
echo       Sedang menginstall library aplikasi (npm install)...
echo       Proses ini butuh waktu sebentar, harap tunggu...
echo.
call npm install
if %errorlevel% neq 0 goto GAGAL_INSTALL
goto JALANKAN_APP

:GAGAL_INSTALL
color 0C
echo.
echo [ERROR] Gagal menginstall library! Pastikan laptop terhubung ke internet.
echo.
goto SELESAI

:MODULES_SUDAH_ADA
echo [2/3] Memeriksa dependensi aplikasi... OK!
echo.

:JALANKAN_APP
:: 3. Buka browser otomatis dan jalankan server
echo [3/3] Membuka browser dan menjalankan server E-IZIN...
echo.
echo =====================================================================
echo   Aplikasi aktif di: http://localhost:3000
echo   Biarkan jendela ini tetap terbuka selama menggunakan aplikasi.
echo   Tekan Ctrl + C jika ingin menghentikan aplikasi.
echo =====================================================================
echo.

start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"

node server.js

:SELESAI
echo.
echo [INFO] Aplikasi telah dihentikan.
echo.
pause
exit /b
