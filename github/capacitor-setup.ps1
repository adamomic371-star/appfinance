# Capacitor Build Setup for Kazka
# Run this script to initialize Capacitor native platforms

Write-Host "=== Kazka — Capacitor Setup ===" -ForegroundColor Cyan

# 1. Install dependencies
npm install

# 2. Add Android platform
npx cap add android

# 3. Add iOS platform (macOS only)
if ($IsMacOS -or $IsLinux) {
    npx cap add ios
}

# 4. Sync web assets
npx cap copy

# 5. Open IDE
$choice = Read-Host "Open project? (1=Android Studio, 2=Xcode, 3=Skip)"
if ($choice -eq "1") {
    npx cap open android
} elseif ($choice -eq "2" -and ($IsMacOS -or $IsLinux)) {
    npx cap open ios
}

Write-Host "✅ Done! Run 'npx cap copy' after each web build." -ForegroundColor Green
