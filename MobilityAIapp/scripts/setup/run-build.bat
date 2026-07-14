@echo off
REM OpusAIMobility Android Build Script
REM Runs both Customer and Driver assembleDebug + assembleRelease builds

set "JAVA_HOME=C:\Users\user\AppData\Local\jdk17\PFiles64\Eclipse Adoptium\jdk-17.0.19.10-hotspot"
set "ANDROID_SDK_ROOT=C:\Users\user\android-sdk"
set "ANDROID_HOME=C:\Users\user\android-sdk"
set "GRADLE_USER_HOME=C:\Users\user\.gradle"
set "KEYSTORE_PASSWORD=OpusAI2026@Keystore!"
set "KEY_ALIAS=opusaimobility"
set "KEY_PASSWORD=OpusAI2026@Key!"
set "PATH=%JAVA_HOME%\bin;%ANDROID_SDK_ROOT%\platform-tools;%ANDROID_SDK_ROOT%\build-tools\34.0.0;%PATH%"

echo =========================================================
echo  OpusAIMobility Android Build
echo  Started: %date% %time%
echo =========================================================

REM ── Customer App ─────────────────────────────────────────
echo.
echo [CUSTOMER] Building debug APK...
cd /d "D:\omnisonietest\OpusAIMobility\MobilityAIapp\android\customer"
set "KEYSTORE_FILE=D:/omnisonietest/OpusAIMobility/MobilityAIapp/android/customer/app/opusaimobility-release.jks"
call gradlew.bat assembleDebug --no-daemon
if %ERRORLEVEL% NEQ 0 (
    echo [CUSTOMER] ERROR: Debug build FAILED
    goto :customer_release
)
echo [CUSTOMER] Debug build SUCCESS

:customer_release
echo.
echo [CUSTOMER] Building release APK...
call gradlew.bat assembleRelease --no-daemon
if %ERRORLEVEL% NEQ 0 (
    echo [CUSTOMER] WARNING: Release build returned error
) else (
    echo [CUSTOMER] Release build SUCCESS
)

REM ── Driver App ───────────────────────────────────────────
echo.
echo [DRIVER] Building debug APK...
cd /d "D:\omnisonietest\OpusAIMobility\MobilityAIapp\android\driver"
set "KEYSTORE_FILE=D:/omnisonietest/OpusAIMobility/MobilityAIapp/android/driver/app/opusaimobility-driver.jks"
call gradlew.bat assembleDebug --no-daemon
if %ERRORLEVEL% NEQ 0 (
    echo [DRIVER] ERROR: Debug build FAILED
    goto :driver_release
)
echo [DRIVER] Debug build SUCCESS

:driver_release
echo.
echo [DRIVER] Building release APK...
call gradlew.bat assembleRelease --no-daemon
if %ERRORLEVEL% NEQ 0 (
    echo [DRIVER] WARNING: Release build returned error
) else (
    echo [DRIVER] Release build SUCCESS
)

REM ── Show APK outputs ─────────────────────────────────────
echo.
echo ── APK Outputs ──────────────────────────────────────────
echo Customer:
dir /B "D:\omnisonietest\OpusAIMobility\MobilityAIapp\android\customer\app\build\outputs\apk\debug\*.apk" 2>nul
dir /B "D:\omnisonietest\OpusAIMobility\MobilityAIapp\android\customer\app\build\outputs\apk\release\*.apk" 2>nul
echo Driver:
dir /B "D:\omnisonietest\OpusAIMobility\MobilityAIapp\android\driver\app\build\outputs\apk\debug\*.apk" 2>nul
dir /B "D:\omnisonietest\OpusAIMobility\MobilityAIapp\android\driver\app\build\outputs\apk\release\*.apk" 2>nul

echo.
echo =========================================================
echo  Build Complete: %date% %time%
echo =========================================================
