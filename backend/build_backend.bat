@echo off
:: ============================================================
:: build_backend.bat — Build backend.exe with PyInstaller
:: Run from the backend\ directory
:: ============================================================

setlocal

echo [Anndevta POS] Building backend.exe...

:: Ensure we are in the backend directory
cd /d "%~dp0"

:: Activate virtual environment
if exist .venv\Scripts\activate.bat (
    call .venv\Scripts\activate.bat
) else if exist venv_win\Scripts\activate.bat (
    call venv_win\Scripts\activate.bat
)

:: Install / upgrade pyinstaller
pip install pyinstaller --quiet

:: ── Install all dependencies (ensures google-generativeai is present) ──
echo [Step 1/3] Installing dependencies from requirements.txt...
pip install -r requirements.txt --quiet
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install dependencies!
    exit /b 1
)

:: Explicitly ensure google-generativeai is installed (critical for bundling)
echo [Step 2/3] Verifying google-generativeai installation...
pip install google-generativeai --quiet
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install google-generativeai!
    exit /b 1
)

:: Clean previous build artifacts
echo [Step 3/3] Cleaning previous build...
if exist dist\backend.exe del /f dist\backend.exe
if exist build rmdir /s /q build

:: Run PyInstaller with the spec file
echo [Build] Running PyInstaller...
pyinstaller backend.spec --clean --noconfirm

if %ERRORLEVEL% neq 0 (
    echo [ERROR] PyInstaller build failed!
    exit /b 1
)

echo.
echo [SUCCESS] Backend built: backend\dist\backend.exe
echo.

endlocal
