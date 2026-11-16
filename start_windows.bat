@echo off
echo ========================================================
echo   TRIAD AI - Document Management System (DMS) Runner
echo ========================================================
echo.

:: Ensure MongoDB service is running
echo Checking MongoDB service...
net start MongoDB >nul 2>&1

:: Start Flask Backend in new terminal window
echo Starting Backend Flask API on http://localhost:5000...
start "TRIAD DMS - Backend API" cmd /k "cd /d %~dp0backend && python run.py"

:: Wait 2 seconds
timeout /t 2 /nobreak >nul

:: Start Vite Frontend in new terminal window
echo Starting Frontend UI on http://localhost:3000...
start "TRIAD DMS - Frontend UI" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

echo.
echo Both Backend (port 5000) and Frontend (port 3000) have launched.
echo To run the automated test suite:
echo   python test_api.py
echo.
pause
