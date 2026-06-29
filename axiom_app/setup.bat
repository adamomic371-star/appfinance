@echo off
echo === Setup Axiom Flutter App ===
echo.

cd /d "%~dp0"

echo 1. Generate piattaforme (Android, iOS, Web)...
flutter create --project-name axiom_app --platforms android,ios,web .
if %errorlevel% neq 0 (
    echo ERRORE: flutter create fallito.
    echo Assicurati che Flutter sia installato: https://flutter.dev
    pause
    exit /b 1
)

echo.
echo 2. Installa dipendenze...
flutter pub get
if %errorlevel% neq 0 (
    echo ERRORE: flutter pub get fallito.
    pause
    exit /b 1
)

echo.
echo 3. Configura Firebase (richiede flutterfire CLI)...
echo    Se non hai flutterfire_CLI, installalo con:
echo      dart pub global activate flutterfire_cli
echo.
echo    Poi esegui manualmente:
echo      flutterfire configure --project=financeapp-556ae
echo.

echo === Setup completato! ===
echo.
echo Per avviare l'app:
echo   flutter run           (Android/iOS/Web)
echo   flutter run -d chrome (Web)
echo   flutter run -d android (Android)
echo.

pause
