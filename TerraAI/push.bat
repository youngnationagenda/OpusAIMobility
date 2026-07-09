@echo off
cd /d "%~dp0"

echo.
echo ==========================================
echo   TerraAI  ^|  Local Git Push
echo ==========================================
echo.

:: Check for changes
git status --short > temp_status.txt 2>&1
for %%A in (temp_status.txt) do set SIZE=%%~zA
del temp_status.txt

if "%SIZE%"=="0" (
    echo [INFO] Nothing to commit - working tree clean.
    echo.
    git log --oneline -3
    echo.
    pause
    exit /b 0
)

:: Show what changed
echo [CHANGES DETECTED]
git status --short
echo.

:: Get commit message
set /p MSG="Enter commit message (or press ENTER for auto-message): "
if "%MSG%"=="" (
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set DT=%%I
    set MSG=Auto-commit %DT:~0,4%-%DT:~4,2%-%DT:~6,2% %DT:~8,2%:%DT:~10,2%
)

echo.
echo [STAGING ALL FILES]
git add .

echo [COMMITTING] %MSG%
git commit -m "%MSG%"

echo [PUSHING] to origin/main ...
git push origin main

echo.
if %ERRORLEVEL%==0 (
    echo ==========================================
    echo   SUCCESS - Pushed to GitHub!
    echo   https://github.com/youngnationagenda/TerraAI
    echo ==========================================
) else (
    echo ==========================================
    echo   ERROR - Push failed. Check above.
    echo ==========================================
)
echo.
pause
