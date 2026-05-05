@echo off
title Subly - Iniciando...
echo ==============================
echo    SUBLY - Arrancando app
echo ==============================
echo.

echo [1/2] Iniciando backend (Python)...
start "Subly Backend" cmd /k "cd /d d:\UPF\4year\3 trimestre\eng software\MVP && python app.py"

echo [2/2] Iniciando frontend (React)...
start "Subly Frontend" cmd /k "cd /d d:\UPF\4year\3 trimestre\eng software\MVP\frontend && npm run dev"

echo.
echo ==============================
echo  Todo listo! Abre en tu navegador:
echo  http://localhost:5173
echo ==============================
echo.

timeout /t 4 >nul
start http://localhost:5173
