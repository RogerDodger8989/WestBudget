@echo off
setlocal
title WestBudget Launcher

echo ========================================
echo   WestBudget - Startar Systemet
echo ========================================
echo.

REM 1. Kontrollera Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [FEL] Python hittades inte. Installera Python och lagg till i PATH.
    pause
    exit /b
)

REM 2. Backend Setup
echo [1/4] Kontrollerar Backend-miljo...
if not exist "venv" (
    echo       Skapar virtuell miljo...
    python -m venv venv
)

echo       Aktiverar miljo och installerar beroenden...
call venv\Scripts\activate
pip install -r requirements.txt >nul 2>&1
if %errorlevel% neq 0 (
    echo [FEL] Kunde inte installera Python-beroenden.
    pause
    exit /b
)

REM 3. Frontend Setup
echo [2/4] Kontrollerar Frontend-miljo...
cd frontend
if not exist "node_modules" (
    echo       Installerar Node-paket...
    call npm install
)
cd ..

REM 4. Starta Servrar
echo [3/4] Startar servrar...

REM Starta Backend i ett nytt fönster
start "WestBudget Backend" cmd /k "venv\Scripts\activate && python app.py"

REM Starta Frontend i ett nytt fönster
start "WestBudget Frontend" cmd /k "cd frontend && npm run dev"

echo [4/4] Vantar pa uppstart...
timeout /t 5 >nul

echo.
echo ========================================
echo   Systemet ar igang!
echo   Frontend: http://localhost:5100
echo   Backend:  http://localhost:5000
echo ========================================
echo.
echo Oppnar webblasaren...
start http://localhost:5100

echo.
echo Du kan stanga detta fonster nu om du vill (servrarna kors i egna fonster).
pause
