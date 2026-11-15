param([ValidateSet('debug','release','bundle','connected','policy')][string]$Mode='debug')
$ErrorActionPreference='Stop'
$Project=Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Config=Join-Path $Project 'mobile/.tools/environment.json'
if(!(Test-Path $Config)){throw 'Run install-android.bat first. No local tool configuration found.'}
$Tools=Get-Content $Config -Raw | ConvertFrom-Json
$env:JAVA_HOME=$Tools.javaHome
$env:ANDROID_HOME=$Tools.sdkRoot
$env:ANDROID_SDK_ROOT=$Tools.sdkRoot
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
if($Mode -eq 'policy'){
 & $Tools.gradle -p (Join-Path $Project 'mobile/policy-tests') test --no-daemon --console=plain
 exit $LASTEXITCODE
}
foreach($Required in @('platforms/android-35/android.jar','build-tools/35.0.0/aapt2.exe')){
 if(!(Test-Path (Join-Path $Tools.sdkRoot $Required))){throw "Missing SDK package file: $Required. Run install-android.bat interactively and review the official license prompts. No APK was built."}
}
if($Mode -in @('release','bundle')){
 foreach($Name in @('ASTER_ANDROID_KEYSTORE','ASTER_ANDROID_STORE_PASSWORD','ASTER_ANDROID_KEY_ALIAS','ASTER_ANDROID_KEY_PASSWORD')){
  if(![Environment]::GetEnvironmentVariable($Name)){throw "Owner signing setting $Name is missing. Do not put credentials in source or chat."}
 }
 if(!(Test-Path $env:ASTER_ANDROID_KEYSTORE -PathType Leaf)){throw 'Owner keystore file does not exist'}
}
$Task=switch($Mode){'debug'{'assembleDebug'}'release'{'assembleRelease'}'bundle'{'bundleRelease'}'connected'{'connectedDebugAndroidTest'}}
& $Tools.gradle -p (Join-Path $Project 'mobile/android') testDebugUnitTest $Task --no-daemon --console=plain
if($LASTEXITCODE -ne 0){exit $LASTEXITCODE}
Write-Host "Android task $Task completed. Outputs: mobile/android/app/build/outputs. Debug uses a development signature, not the owner's release identity."
