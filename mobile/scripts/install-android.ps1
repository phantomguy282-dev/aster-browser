$ErrorActionPreference='Stop'
$Project=Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Mobile=Join-Path $Project 'mobile'
$EnvironmentFile=Join-Path $Mobile '.tools/environment.json'
if(!(Test-Path $EnvironmentFile)){& (Join-Path $PSScriptRoot 'bootstrap-tools.ps1');if(!$?){throw 'Tool bootstrap failed'}}
$Tools=Get-Content $EnvironmentFile -Raw | ConvertFrom-Json
$env:JAVA_HOME=$Tools.javaHome
$env:ANDROID_HOME=$Tools.sdkRoot
$env:ANDROID_SDK_ROOT=$Tools.sdkRoot
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
$Android=Join-Path $Mobile '.tools/android-cli/cmdline-tools/bin/android.exe'
Write-Host 'Android SDK licenses must be reviewed and accepted by the owner in the official tool prompts.'
Write-Host 'No automatic license acceptance is performed. No system JAVA_HOME or PATH is modified.'
Write-Host 'Terms: https://developer.android.com/studio/terms'
& $Android --no-metrics "--sdk=$($Tools.sdkRoot)" sdk install 'platform-tools' 'platforms;android-35' 'build-tools;35.0.0'
if($LASTEXITCODE -ne 0){throw 'SDK package installation did not complete'}
if(!(Test-Path (Join-Path $Tools.sdkRoot 'platforms/android-35/android.jar')) -or !(Test-Path (Join-Path $Tools.sdkRoot 'build-tools/35.0.0/aapt2.exe'))){throw 'Required platform/build tools are still missing'}
Write-Host 'Android SDK prerequisites verified. Run build-android.bat debug.'
Write-Host 'For emulator tests, install an emulator/system image through Android Studio and start a device before build-android.bat connected.'
