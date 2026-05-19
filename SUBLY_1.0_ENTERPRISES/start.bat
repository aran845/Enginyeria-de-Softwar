@echo off
title Subly - Iniciando...
echo ==============================
echo    SUBLY - Arrancando app
echo ==============================
echo.

REM Usar la carpeta donde esta este .bat como raiz del proyecto
set "PROJECT_DIR=%~dp0"

echo [1/2] Iniciando backend (Python)...
start "Subly Backend" cmd /k "cd /d "%PROJECT_DIR%" && python app.py"

echo [2/2] Iniciando frontend (React)...
start "Subly Frontend" cmd /k "cd /d "%PROJECT_DIR%frontend" && npm run dev"

echo.
echo ==============================
echo  Todo listo! Abre en tu navegador:
echo  http://localhost:5173
echo ==============================
echo.

timeout /t 4 >nul
start http://localhost:5173
