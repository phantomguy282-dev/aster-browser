@echo off
setlocal
echo iOS applications cannot be built or signed by this Windows script.
echo On a Mac with Xcode and XcodeGen, open mobile\ios and run:
echo   bash build-ios.sh simulator
echo   ASTER_IOS_DESTINATION="platform=iOS Simulator,id=YOUR_UUID" bash build-ios.sh test
echo See mobile\docs\IOS-BUILD.md for owner signing and distribution steps.
echo No IPA was created.
exit /b 1
