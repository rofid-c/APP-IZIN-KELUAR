@echo off
setlocal
title E-IZIN - Pengadilan Agama Gunung Sugih

rem Pindah ke direktori tempat START.bat berada
cd /d "%~dp0"

echo ============================================================
echo        E-IZIN - PENGADILAN AGAMA GUNUNG SUGIH
echo             SISTEM PERIZINAN KELUAR KANTOR
echo ============================================================
echo.

rem 1. Cek apakah Node.js sudah terpasang
where node >nul 2>nul
if %errorlevel% neq 0 goto :NO_NODE

rem 2. Cek apakah modul dependensi sudah ada
if not exist "%~dp0node_modules" goto :INSTALL_DEPS

:CHECK_SERVER
rem 3. Cek keberadaan file server.js
if not exist "%~dp0server.js" (
    echo [ERROR] File server.js tidak ditemukan di direktori ini!
    echo Pastikan file START.bat berada di dalam folder proyek aplikasi.
    echo.
    pause
    exit /b 1
)

rem 4. Buka halaman aplikasi di browser default
start http://localhost:3000

rem 5. Jalankan server aplikasi
echo [INFO] Menjalankan server aplikasi E-IZIN...
echo.
echo Alamat Lokal : http://localhost:3000
echo.
echo ============================================================
echo   Aplikasi aktif. Biarkan jendela ini tetap terbuka.
echo   Tekan Ctrl + C jika ingin menghentikan aplikasi.
echo ============================================================
echo.
node server.js

echo.
echo ============================================================
echo [INFO] Aplikasi E-IZIN telah dihentikan.
echo ============================================================
echo.
pause
exit /b 0

:INSTALL_DEPS
echo [INFO] Komponen pustaka [node_modules] belum terpasang.
echo Sedang mengunduh komponen aplikasi [npm install]...
echo Mohon tunggu sebentar (memerlukan koneksi internet pertama kali)...
echo.
call npm install
if %errorlevel% neq 0 (
    echo.
    echo [GAGAL] Terjadi kesalahan saat mengunduh komponen aplikasi.
    echo Pastikan laptop terhubung ke internet lalu coba jalankan kembali.
    echo.
    pause
    exit /b 1
)
echo.
echo [SUKSES] Komponen berhasil dipasang!
echo.
goto :CHECK_SERVER

:NO_NODE
echo ------------------------------------------------------------
echo [PERHATIAN] Node.js belum terpasang di laptop ini!
echo Aplikasi ini membutuhkan Node.js untuk dapat dijalankan.
echo ------------------------------------------------------------
echo.
where winget >nul 2>nul
if %errorlevel% equ 0 (
    echo Terdeteksi Windows Package Manager [winget].
    set /p installNode="Apakah ingin mengunduh dan memasang Node.js otomatis sekarang? [Y/N]: "
    if /i "%installNode%"=="Y" (
        echo.
        echo Mengunduh dan memasang Node.js LTS via winget...
        winget install OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
        echo.
        echo ============================================================
        echo Selesai! Silakan TUTUP jendela ini lalu buka kembali START.bat
        echo ============================================================
        echo.
        pause
        exit /b 0
    )
)
echo Silakan unduh dan pasang Node.js [versi LTS] dari:
echo   https://nodejs.org/
echo.
echo Membuka link download Node.js di browser Anda...
start https://nodejs.org/en/download
echo.
echo Setelah selesai memasang Node.js, silakan jalankan kembali START.bat.
echo.
pause
exit /b 1
