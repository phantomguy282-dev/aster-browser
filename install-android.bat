@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0mobile\scripts\install-android.ps1"
if errorlevel 1 (
 echo Android setup did not complete. Review the message above.
 pause
 exit /b 1
)
pause
