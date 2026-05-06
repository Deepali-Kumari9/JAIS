@echo off
echo.
echo ============================================
echo   JAIS v2.0 - Starting Project
echo ============================================
echo.

echo [1/2] Starting Backend...
start "JAIS Backend" cmd /k "cd backend && pip install -r requirements.txt && python main.py"

timeout /t 4 /nobreak > nul

echo [2/2] Starting Frontend...
start "JAIS Frontend" cmd /k "cd frontend && npm install && npm start"

echo.
echo Both servers starting in separate windows.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:3000
echo.
pause
