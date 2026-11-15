@echo off
setlocal
cd /d "%~dp0"
call npm test
if errorlevel 1 goto :failed
call npm run build
if errorlevel 1 goto :failed
echo Build complete. Installer is in the dist folder.
explorer "%~dp0dist"
exit /b 0
:failed
echo Build failed. Review the errors above.
pause
exit /b 1
