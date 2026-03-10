@echo off
echo ====================================
echo    VITALIS AI - Generador de APK
echo ====================================
echo.
echo Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js no esta instalado.
    echo Descargalo de: https://nodejs.org/en/download
    echo Instala la version LTS y reinicia la computadora.
    pause
    exit
)
echo.
echo Instalando EAS CLI...
call npm install -g eas-cli
echo.
echo Iniciando sesion en Expo...
echo (Necesitas cuenta gratuita en https://expo.dev/signup)
call eas login
echo.
echo Instalando dependencias del proyecto...
call npm install
echo.
echo ====================================
echo    Generando APK...
echo    Esto tarda 10-15 minutos
echo ====================================
call eas build -p android --profile preview
echo.
echo ====================================
echo    LISTO! Copia el enlace de arriba
echo    para descargar tu APK
echo ====================================
pause
