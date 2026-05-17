@echo off
title MediCare QA Hackathon - Evaluation Runner
color 0B
echo.
echo  ============================================
echo    MediCare Clinic QA Hackathon
echo    Automated Evaluation Runner
echo  ============================================
echo.

:: Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo  [ERROR] Python is not installed!
    echo  Please install Python 3.8+ from https://python.org/
    pause
    exit /b 1
)

echo  [INFO] Python found:
python --version
echo.

:: Navigate to evaluation folder
cd /d "%~dp0evaluation"

echo  ============================================
echo  [1/4] Evaluating Bug Reports...
echo  ============================================
python evaluate-bugs.py --all
echo.

echo  ============================================
echo  [2/4] Evaluating Test Cases...
echo  ============================================
python evaluate-testcases.py --all
echo.

echo  ============================================
echo  [3/4] Evaluating Automation Scripts...
echo  ============================================
python evaluate-automation.py --all
echo.

echo  ============================================
echo  [4/4] Generating Final Scoreboard...
echo  ============================================
echo.
echo  NOTE: If judge manual scores (team-N-manual.json) are
echo  not yet in the judging/ folder, Demo ^& AI scores will
echo  show as 0. Re-run this after adding manual scores.
echo.
python generate-scoreboard.py
echo.

color 0A
echo  ============================================
echo    EVALUATION COMPLETE!
echo  ============================================
echo.
echo    Results saved in: judging\
echo    Open judging\scoreboard.html for display
echo.
echo    Individual team results:
echo      judging\team-N-bugs.json
echo      judging\team-N-testcases.json
echo      judging\team-N-automation.json
echo.
pause
