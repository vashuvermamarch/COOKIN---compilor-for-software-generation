@echo off
title AI Software Compiler Console
echo ==============================================
echo      AI APPLICATION COMPILER BOOTSTRAP
echo ==============================================
echo.

:: Verify virtual environment exists
if not exist ".venv" (
    echo [ERROR] Virtual environment .venv was not found!
    echo Please run: python -m venv .venv
    echo And install dependencies: .venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)

:: Compile React frontend if dist doesn't exist
if not exist "frontend\dist" (
    echo [INFO] Production build frontend\dist not found.
    echo [INFO] Running npm build to compile React and Framer Motion components...
    cd frontend
    call npm run build
    cd ..
)

:: Open browser automatically after server boots
echo [INFO] Launching Compiler Dashboard...
start "" http://127.0.0.1:8080

:: Start server
echo [INFO] Running FastAPI Backend ^& Serving Frontend on port 8080...
echo.
.venv\Scripts\python -m backend.main
pause
