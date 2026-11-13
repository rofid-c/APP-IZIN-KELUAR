@echo off
setlocal enabledelayedexpansion
title SETUP E-IZIN - Pengadilan Agama Gunung Sugih

cd /d "%~dp0"

echo ============================================================
echo       SETUP & INSTALASI KOMPONEN APLIKASI E-IZIN
echo            PENGADILAN AGAMA GUNUNG SUGIH
echo ============================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [PERHATIAN] Node.js belum terpasang di laptop ini!
    echo.
    where winget >nul 2>nul
    if %errorlevel% equ 0 (
        set /p installNode="Apakah ingin mengunduh & memasang Node.js otomatis lewat winget? (Y/N): "
        if /i "!installNode!"=="Y" (
            echo Mengunduh dan memasang Node.js LTS...
            winget install OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
            echo.
            echo Selesai. Tutup jendela ini dan buka kembali untuk melanjutkan.
            pause
            exit /b
        )
    )
    echo Silakan unduh Node.js LTS dari: https://nodejs.org/
    start https://nodejs.org/en/download
    pause
    exit /b
)

echo [1/2] Memeriksa versi Node.js & NPM...
node -v
npm -v
echo.

echo [2/2] Memasang pustaka modul aplikasi (npm install)...
call npm install
if %errorlevel% equ 0 (
    echo.
    echo ============================================================
    echo [SUKSES] Seluruh pustaka aplikasi berhasil terpasang!
    echo Anda sekarang dapat menjalankan aplikasi dengan mengklik START.bat
    echo ============================================================
) else (
    echo.
    echo [GAGAL] Terjadi kesalahan saat instalasi. Pastikan koneksi internet aktif.
)
echo.
pause
