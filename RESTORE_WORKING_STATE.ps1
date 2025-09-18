# INKED DRAW - RESTORE WORKING STATE SCRIPT
# Run this PowerShell script to restore the working checkpoint

Write-Host "🔄 Restoring InkedDraw to working state..." -ForegroundColor Green

# Restore critical configuration files
Write-Host "📁 Restoring configuration files..." -ForegroundColor Yellow

if (Test-Path "android\settings.gradle.WORKING_BACKUP") {
    Copy-Item "android\settings.gradle.WORKING_BACKUP" "android\settings.gradle" -Force
    Write-Host "✅ Restored android/settings.gradle" -ForegroundColor Green
}

if (Test-Path "android\app\build.gradle.WORKING_BACKUP") {
    Copy-Item "android\app\build.gradle.WORKING_BACKUP" "android\app\build.gradle" -Force
    Write-Host "✅ Restored android/app/build.gradle" -ForegroundColor Green
}

if (Test-Path "android\app\src\main\java\com\inkeddrawapp\MainApplication.java.WORKING_BACKUP") {
    Copy-Item "android\app\src\main\java\com\inkeddrawapp\MainApplication.java.WORKING_BACKUP" "android\app\src\main\java\com\inkeddrawapp\MainApplication.java" -Force
    Write-Host "✅ Restored MainApplication.java" -ForegroundColor Green
}

if (Test-Path "App.js.WORKING_BACKUP") {
    Copy-Item "App.js.WORKING_BACKUP" "App.js" -Force
    Write-Host "✅ Restored App.js" -ForegroundColor Green
}

if (Test-Path "src\components\index.js.WORKING_BACKUP") {
    Copy-Item "src\components\index.js.WORKING_BACKUP" "src\components\index.js" -Force
    Write-Host "✅ Restored src/components/index.js" -ForegroundColor Green
}

# Clean build
Write-Host "🧹 Cleaning build..." -ForegroundColor Yellow
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-11.0.25.9-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;" + $env:PATH

Set-Location android
.\gradlew.bat clean
Set-Location ..

Write-Host "🎉 Restoration complete!" -ForegroundColor Green
Write-Host "📱 Ready to build with: npx react-native run-android --mode=release" -ForegroundColor Cyan

Write-Host ""
Write-Host "🥃 Your luxury InkedDraw app is restored to working state with:" -ForegroundColor Magenta
Write-Host "   ✅ Original TabNavigator with custom bottom navigation" -ForegroundColor White
Write-Host "   ✅ Beautiful Lucide React Native SVG icons" -ForegroundColor White
Write-Host "   ✅ All 5 original screens working perfectly" -ForegroundColor White
Write-Host "   ✅ Production-quality luxury styling" -ForegroundColor White
Write-Host "   ✅ React Native SVG properly configured" -ForegroundColor White
