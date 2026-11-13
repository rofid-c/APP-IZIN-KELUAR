@echo off
setlocal enabledelayedexpansion
title E-IZIN - Pengadilan Agama Gunung Sugih

:: Pastikan working directory selalu di folder tempat START.bat berada
cd /d "%~dp0"

echo ============================================================
echo        E-IZIN - PENGADILAN AGAMA GUNUNG SUGIH
echo             SISTEM PERIZINAN KELUAR KANTOR
echo ============================================================
echo.

:: 1. Cek apakah Node.js sudah terpasang
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ------------------------------------------------------------
    echo [PERHATIAN] Node.js belum terpasang di laptop ini!
    echo Aplikasi ini membutuhkan Node.js untuk dapat dijalankan.
    echo ------------------------------------------------------------
    echo.
    where winget >nul 2>nul
    if %errorlevel% equ 0 (
        echo Terdeteksi Windows Package Manager (winget).
        set /p installNode="Apakah ingin mengunduh dan memasang Node.js otomatis sekarang? (Y/N): "
        if /i "!installNode!"=="Y" (
            echo.
            echo Mengunduh dan memasang Node.js LTS... Mohon tunggu...
            winget install OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
            echo.
            echo ============================================================
            echo Instalasi Node.js selesai!
            echo Silakan TUTUP jendela ini lalu KLIK GANDA lagi file START.bat
            echo ============================================================
            echo.
            pause
            exit /b
        )
    )
    echo Silakan unduh dan pasang Node.js (pilih versi LTS) dari:
    echo   https://nodejs.org/
    echo.
    echo Membuka link download Node.js di browser Anda...
    start https://nodejs.org/en/download
    echo.
    echo Setelah selesai memasang Node.js, silakan jalankan kembali START.bat.
    echo.
    pause
    exit /b
)

:: 2. Cek apakah dependensi (node_modules) sudah ada
if not exist "%~dp0node_modules" (
    echo [INFO] Komponen pustaka (node_modules) belum terpasang.
    echo Menyiapkan dan mengunduh komponen yang dibutuhkan (npm install)...
    echo Mohon tunggu sebentar (memerlukan koneksi internet pertama kali)...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo [GAGAL] Terjadi kesalahan saat mengunduh komponen aplikasi.
        echo Pastikan laptop terhubung ke internet lalu jalankan kembali.
        echo.
        pause
        exit /b
    )
    echo.
    echo [SUKSES] Komponen berhasil disiapkan!
    echo.
)

:: 3. Cek file server.js
if not exist "%~dp0server.js" (
    echo.
    echo [ERROR] File server.js tidak ditemukan di direktori ini!
    echo Pastikan file START.bat berada di dalam folder proyek aplikasi.
    echo.
    pause
    exit /b
)

:: 4. Buka browser otomatis ke http://localhost:3000 setelah jeda 2 detik
start "" /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

:: 5. Jalankan server aplikasi
echo [INFO] Menjalankan server aplikasi E-IZIN...
echo.
node server.js

:: 6. Jika server berhenti (misal dihentikan user atau terjadi error), jendela tetap terbuka
echo.
echo ============================================================
echo [INFO] Aplikasi E-IZIN telah dihentikan.
echo ============================================================
echo.
pause
