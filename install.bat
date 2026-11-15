@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Node.js 24 LTS is required for source development. Install from https://nodejs.org/ then rerun.
 echo The Aster setup executable requires no Node.js installation.
 pause
 exit /b 1
)
call npm ci
if errorlevel 1 goto :failed
node node_modules\electron\install.js
if errorlevel 1 goto :failed
call npm test
if errorlevel 1 goto :failed
echo Ready. Double-click start.bat to browse or build.bat to create the installer.
pause
exit /b 0
:failed
echo Installation failed. Review the errors above.
pause
exit /b 1
