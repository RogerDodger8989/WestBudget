@echo off
echo ========================================
echo   WestBudget Development Startup
echo ========================================
echo.

echo Starting Flask Backend...
start cmd /k "cd /d %~dp0 && venv\Scripts\activate && python app.py"

timeout /t 3 /nobreak > nul

echo Starting React Frontend...
start cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo   Both servers are starting...
echo   Backend: http://localhost:5000
echo   Frontend: http://localhost:3000
echo ========================================
echo.
echo Press any key to exit...
pause > nul

