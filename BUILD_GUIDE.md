# Guia para generar APK — Vitalis AI

## Opcion 1: Automatico con GitHub Actions (Recomendado)

El proyecto incluye un workflow de GitHub Actions que genera el APK automaticamente cada vez que subes codigo.

### Configuracion (solo una vez)

1. Crea una cuenta en [expo.dev](https://expo.dev/signup)
2. Ve a [expo.dev/settings/access-tokens](https://expo.dev/accounts/[account]/settings/access-tokens)
3. Crea un nuevo token y copialo
4. En tu repositorio de GitHub ve a **Settings → Secrets and variables → Actions**
5. Crea un nuevo secreto llamado `EXPO_TOKEN` y pega el token de Expo
6. Sube todo el codigo fuente a GitHub (no solo los archivos de la web)

### Como funciona

- Cada vez que hagas `git push` a la rama `main`, GitHub compila el APK automaticamente
- Tambien puedes ejecutarlo manualmente desde GitHub → Actions → Build APK → Run workflow
- El APK estara disponible en tu dashboard de Expo: [expo.dev](https://expo.dev)
- El proceso tarda 10-15 minutos

---

## Opcion 2: Manual desde tu computadora

### Requisitos

1. Una computadora con Node.js instalado ([nodejs.org](https://nodejs.org))
2. Cuenta gratuita en [expo.dev](https://expo.dev)

### Pasos rapidos (solo 4 comandos)

#### 1. Descarga el proyecto de Replit
En Replit → panel de archivos → tres puntos (`···`) → **Download as ZIP** → descomprimelo

#### 2. Abre terminal en la carpeta del proyecto y ejecuta:

```bash
npm install -g eas-cli
eas login
npm install
eas build -p android --profile preview
```

- `eas login` te pide usuario/contraseña de expo.dev
- El build tarda 10-15 minutos en los servidores de Expo
- Al terminar te da un **enlace de descarga** del `.apk`

#### 3. Instala el APK en tu Android
1. Descarga el `.apk` del enlace
2. Envialo a tu celular (cable, email, Drive, etc.)
3. En Android: Ajustes → Seguridad → activa **"Fuentes desconocidas"**
4. Abre el `.apk` para instalar

---

## Opcion 3: Desde Termux (Android)

```bash
pkg update -y && pkg install -y nodejs git unzip
npm install -g eas-cli
git clone https://github.com/TU_USUARIO/TU_REPOSITORIO.git mi-app
cd mi-app
npm install
eas login
eas build:configure
eas build -p android --profile preview
```

Reemplaza `TU_USUARIO` y `TU_REPOSITORIO` con tus datos de GitHub.

---

## Configuracion ya incluida

| Archivo | Descripcion |
|---------|-------------|
| `eas.json` | Perfiles de build (preview=APK, production=AAB) |
| `app.json` | Nombre, iconos, permisos Android/iOS, plugins |
| `.github/workflows/build-apk.yml` | GitHub Actions para build automatico |
| Permisos Android | Camara, ubicacion GPS, almacenamiento, vibracion |
| Permisos iOS | Camara, fotos, ubicacion, acelerometro |

---

## Build para Google Play Store

```bash
eas build -p android --profile production
```

Genera un `.aab` (Android App Bundle) listo para subir a Google Play Console.

---

## Build para iOS (requiere Apple Developer, $99/año)

```bash
eas build -p ios --profile preview
```

---

## Notas

- El APK se genera en los servidores de Expo (EAS), **no en tu computadora**
- El primer build puede tardar mas (15-20 min) por la cache
- Para actualizaciones sin reinstalar: `eas update --branch production`
- Google Sign-In es opcional — la app funciona sin el (modo invitado)
- IMPORTANTE: Sube el codigo fuente completo a GitHub, no solo los archivos exportados de la web
