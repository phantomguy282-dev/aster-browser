@echo off
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0mobile\scripts\build-android.ps1" %*
exit /b %errorlevel%
