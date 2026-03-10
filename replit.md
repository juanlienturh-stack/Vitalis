# Vitalis AI

A comprehensive all-in-one health & fitness app built with Expo React Native.

## Overview

Vitalis AI is a complete health companion featuring AI-powered body scanning, facial analysis, nutrition tracking, workout logging, step counting, and much more — all with dark mode UI and Spanish language support.

## Architecture

**Frontend:** Expo Router (React Native) on port 8081
**Backend:** Express.js + PostgreSQL on port 5000 (serves landing page + API)
**Data Storage:** AsyncStorage (local device persistence) + PostgreSQL (cloud sync with Google Auth)
**Auth:** Google OAuth via expo-auth-session, JWT stored in SecureStore

## Key Features

1. **Home Dashboard** - Daily stats rings, quick actions, calorie/step/water tracking (uses settings goals)
2. **Body Scanner** - Camera-based scan with AI body composition estimation (BMI, body fat, muscle mass, measurements)
3. **Facial Analysis** - Face shape detection, symmetry scoring, SVG gauge meter for overall score, recommendations
4. **Nutrition Tracker** - 22+ food database, meal logging by category, SVG donut chart for macros, calorie ring
5. **Workout Builder** - 80+ exercises across 8 muscle groups, predefined templates (Push/Pull/Legs, Full Body, Cardio+Core), custom workout sessions
6. **Step Counter** - Daily step tracking, distance, calories burned
7. **History** - Timeline with vertical connector line, 7-day activity bar chart (SVG), stats summary
8. **1RM Calculator** - One rep max estimator using 4 formulas
9. **Supplement Guide** - Science-based info on 8 key supplements with personalized dosing
10. **Breathing & Meditation** - 4 guided breathing exercises with animated UI
11. **Monthly Challenges** - 3 auto-tracked challenges tied to activity
12. **Hairstyle Finder** - 15 haircuts categorized by face shape and style
13. **Shopping List** - Pre-populated healthy grocery list with check-off system
14. **Multi-Account** - Switch between multiple user profiles
15. **Onboarding** - Full profile setup with goals and activity level
16. **Profile** - Weight history chart (SVG polyline), lifetime stats, progress toward goal weight
17. **Google Login** - OAuth flow via expo-auth-session, data sync to PostgreSQL backend
18. **Settings** - Goals (steps, water, calories), units, data export/delete, account management

## File Structure

```
app/
  _layout.tsx          # Root layout with all providers (AuthProvider fix for guest navigation)
  login.tsx            # Google OAuth + "Continuar sin cuenta" screen
  settings.tsx         # Full settings screen (goals, units, notifications, data)
  (tabs)/
    _layout.tsx        # NativeTabs (iOS 26 liquid glass) / ClassicTabs
    index.tsx          # Home Dashboard (uses settings.stepGoal/waterGoal/calorieGoal)
    scan.tsx           # Body & Facial Scanner + FaceScoreGauge SVG component
    nutrition.tsx      # Nutrition + MacroDonut SVG donut chart component
    workout.tsx        # Exercise Library + WORKOUT_TEMPLATES (5 predefined)
    profile.tsx        # Profile + WeightChart SVG line chart component
  onboarding.tsx       # New user setup
  history.tsx          # Activity history + weekly bar chart SVG + timeline
  calculator.tsx       # 1RM Calculator
  supplements.tsx      # Supplement Guide
  breathing.tsx        # Breathing & Meditation
  challenges.tsx       # Monthly Challenges
  hairstyle.tsx        # Hairstyle Finder
  shopping.tsx         # Shopping List
contexts/
  AppContext.tsx        # Central state management (AsyncStorage, settings, multi-account)
  AuthContext.tsx       # Google OAuth, JWT, authentication state
server/
  index.ts             # Express server entry
  routes.ts            # REST API endpoints for all data types
  auth.ts              # JWT authentication middleware
  db.ts                # PostgreSQL connection pool
constants/
  colors.ts            # Dark theme (#0A0A0F bg, #00FF88 accent, #00D4FF blue)
```

## Important Notes

- **expo-auth-session@7.0.10** — NEVER add to plugins array in app.json (no app.plugin.js)
- **Guest navigation fix**: `guestRef.current = true` prevents login loop; `pendingNav` state navigates after Stack mounts
- **SVG charts**: react-native-svg used for donut chart (nutrition), line chart (profile), bar chart (history), gauge (scan)
- **Workout templates**: WORKOUT_TEMPLATES array defines Push/Pull/Legs/Full Body/Cardio+Core presets
- **EXPO_PUBLIC_GOOGLE_CLIENT_ID** env secret required for Google OAuth; without it, only "Continuar sin cuenta" shown
- **SESSION_SECRET** env secret used for JWT signing
- All screens use `Platform.OS === "web" ? 67 : insets.top` for top padding

## Design

- Dark mode by default (`#0A0A0F` background)
- Electric green accent (`#00FF88`)
- Cyan blue secondary (`#00D4FF`)
- Purple accent (`#7C3AED`)
- Inter font family (400/500/600/700)
- NativeTabs with liquid glass for iOS 26+
- SVG-based progress rings and charts

## APK Build

See `BUILD_GUIDE.md` for full instructions. Key commands:
```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```
Bundle ID: `com.vitalisai.app`
Scheme: `vitalisai`

## Running

```bash
# Backend
npm run server:dev

# Frontend  
npm run expo:dev
```
