@echo off
title MeatMart Kanjikovil Platform
echo ========================================================
echo       Starting MeatMart Fresh Meats & Masalas
echo ========================================================
echo.
cd /d "%~dp0"

echo [1/2] Starting MeatMart Backend Server (Port 5000)...
start "MeatMart Backend Server" cmd /k "cd /d ""%~dp0server"" && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Starting MeatMart Frontend (Port 5173)...
start "MeatMart Frontend" cmd /k "cd /d ""%~dp0client"" && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ========================================================
echo   MeatMart is now online!
echo   Opening in your default browser...
echo ========================================================
start http://localhost:5173/

exit
