@echo off
title MediCare Clinic - Setup & Launch
color 0B
echo.
echo  ============================================
echo    MediCare Clinic - QA Hackathon
echo    Application Setup ^& Launch
echo  ============================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo  [ERROR] Node.js is not installed!
    echo  Please install Node.js from https://nodejs.org/
    echo  Recommended: Node.js 18 or higher
    echo.
    pause
    exit /b 1
)

echo  [INFO] Node.js found: 
node --version
echo.

:: Install backend dependencies
echo  [1/4] Installing backend dependencies...
echo  -----------------------------------------------
cd /d "%~dp0backend"
call npm install
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo  [ERROR] Backend installation failed!
    pause
    exit /b 1
)
echo.
echo  [OK] Backend dependencies installed.
echo.

:: Seed database
echo  [2/4] Setting up database (6 team databases)...
echo  -----------------------------------------------
call node src/seed.js
echo  [OK] All 6 team databases seeded with test data.
echo.

:: Install frontend dependencies
echo  [3/4] Installing frontend dependencies...
echo  -----------------------------------------------
cd /d "%~dp0frontend"
call npm install
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo  [ERROR] Frontend installation failed!
    pause
    exit /b 1
)
echo.
echo  [OK] Frontend dependencies installed.
echo.

:: Start both servers
echo  [4/4] Starting application...
echo  -----------------------------------------------
echo.

:: Start backend in background
cd /d "%~dp0backend"
start "MediCare Backend" cmd /k "title MediCare Backend (Port 4000) && node src/index.js"

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend
cd /d "%~dp0frontend"
start "MediCare Frontend" cmd /k "title MediCare Frontend (Port 3000) && npx vite --host"

:: Wait for frontend to start
timeout /t 5 /nobreak >nul

color 0A
echo.
echo  ============================================
echo    APPLICATION STARTED SUCCESSFULLY!
echo  ============================================
echo.
echo    Frontend:  http://localhost:3000
echo    Backend:   http://localhost:4000
echo    Swagger:   http://localhost:4000/api-docs
echo.
echo    Login Credentials (select Team 1-6 on login):
echo      Admin:   admin@test.com   / Test@123
echo      Doctor:  doctor@test.com  / Test@123
echo      Patient: patient@test.com / Test@123
echo.
echo    Two terminal windows have opened:
echo      - MediCare Backend  (keep open)
echo      - MediCare Frontend (keep open)
echo.
echo    Close both terminal windows to stop the app.
echo  ============================================
echo.
pause
