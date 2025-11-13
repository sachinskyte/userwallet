# Build APK Script for PandoraVault
# This script automates the process of building your web app and creating an Android APK

Write-Host "🚀 Starting PandoraVault APK Build Process..." -ForegroundColor Cyan

# Step 1: Build the web app
Write-Host "`n📦 Step 1: Building web application..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Web build failed!" -ForegroundColor Red
    exit 1
}

# Step 2: Copy web assets to Android
Write-Host "`n📋 Step 2: Copying web assets to Android..." -ForegroundColor Yellow
npx cap copy android
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Capacitor copy failed!" -ForegroundColor Red
    exit 1
}

# Step 3: Fix Java version in capacitor.build.gradle (auto-generated with Java 21)
Write-Host "`n🔧 Step 3: Fixing Java compatibility..." -ForegroundColor Yellow
$capacitorBuildFile = "android\app\capacitor.build.gradle"
$content = Get-Content $capacitorBuildFile -Raw
$content = $content -replace 'JavaVersion\.VERSION_21', 'JavaVersion.VERSION_17'
Set-Content $capacitorBuildFile -Value $content
Write-Host "✓ Java version fixed to VERSION_17" -ForegroundColor Green

# Step 4: Build Android APK
Write-Host "`n🔨 Step 4: Building Android APK..." -ForegroundColor Yellow
Set-Location android
./gradlew assembleDebug
$buildResult = $LASTEXITCODE
Set-Location ..

if ($buildResult -eq 0) {
    Write-Host "`n✅ APK Build Successful!" -ForegroundColor Green
    Write-Host "📱 APK Location: android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Cyan
    
    # Get APK info
    $apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
    if (Test-Path $apkPath) {
        $apkSize = (Get-Item $apkPath).Length / 1MB
        Write-Host "📊 APK Size: $([math]::Round($apkSize, 2)) MB" -ForegroundColor Cyan
        Write-Host "📍 Full Path: $((Resolve-Path $apkPath).Path)" -ForegroundColor Cyan
    }
} else {
    Write-Host "`n❌ APK Build Failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 Build process completed!" -ForegroundColor Green