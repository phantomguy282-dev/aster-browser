@echo off
setlocal
cd /d "%~dp0"
if exist "dist\win-unpacked\Aster.exe" (
 start "" "dist\win-unpacked\Aster.exe"
 exit /b 0
)
if not exist "node_modules\electron\dist\electron.exe" (
 echo Run install.bat first, or install Aster using the setup executable.
 pause
 exit /b 1
)
set ELECTRON_RUN_AS_NODE=
start "" "node_modules\electron\dist\electron.exe" "."
