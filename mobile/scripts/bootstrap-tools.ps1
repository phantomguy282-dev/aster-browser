$ErrorActionPreference='Stop'
$Root=Split-Path -Parent $PSScriptRoot
$Tools=Join-Path $Root '.tools'
New-Item -ItemType Directory -Force $Tools | Out-Null
function Get-VerifiedZip($Name,$Url,$Algorithm,$Digest) {
 $File=Join-Path $Tools ($Name+'.zip')
 if(!(Test-Path $File)){Invoke-WebRequest -UseBasicParsing -Uri $Url -OutFile $File}
 if((Get-FileHash $File -Algorithm $Algorithm).Hash.ToLowerInvariant() -ne $Digest.ToLowerInvariant()){throw "Checksum failed for $Name; retained for inspection, not extracted"}
 $Destination=Join-Path $Tools $Name
 if(!(Test-Path $Destination)){Expand-Archive -LiteralPath $File -DestinationPath $Destination}
 return $Destination
}
$Jdk=Get-VerifiedZip 'jdk21' 'https://github.com/adoptium/temurin21-binaries/releases/download/jdk-21.0.13%2B9/OpenJDK21U-jdk_x64_windows_hotspot_21.0.13_9.zip' 'SHA256' 'a4dbaa05fca4bd89d84584e58c459bd732efebb1722af80ab13c6516832004f9'
$Gradle=Get-VerifiedZip 'gradle' 'https://services.gradle.org/distributions/gradle-8.11.1-bin.zip' 'SHA256' 'f397b287023acdba1e9f6fc5ea72d22dd63669d59ed4a289a29b1a76eee151c6'
$Cli=Get-VerifiedZip 'android-cli' 'https://dl.google.com/android/repository/commandlinetools-win-16111833_latest.zip' 'SHA1' '57d04f2d75eb8e8fffc5000a987e5de4b5a63e9d'
$JavaHome=(Get-ChildItem $Jdk -Directory | Select-Object -First 1).FullName
$Sdk=Join-Path $Tools 'android-sdk'
New-Item -ItemType Directory -Force $Sdk | Out-Null
[ordered]@{javaHome=$JavaHome;gradle=(Join-Path $Gradle 'gradle-8.11.1/bin/gradle.bat');sdkRoot=$Sdk;sdkManager=(Join-Path $Cli 'cmdline-tools/bin/sdkmanager.bat')} | ConvertTo-Json | Set-Content (Join-Path $Tools 'environment.json') -Encoding utf8
Write-Output 'Verified build tools prepared. No system Java/PATH changed. Android SDK licenses have NOT been accepted.'
Write-Output 'Review SDK terms interactively using install-android.bat; do not pipe automatic yes responses.'
