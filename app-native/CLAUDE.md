# Fitness Deal - React Native / Expo App

## Project Overview
This is a React Native (Expo SDK 54) port of the "Fitness Deal" PWA.
The PWA is live at: https://aviadchai.github.io/fitness-deal/
The app lets users set daily fitness "deals" (push-ups, sit-ups, plank) with a debt system - miss a day and the reps carry over.

## Tech Stack
- Expo SDK 54 with Expo Router 6.x (file-based routing)
- React 19.1.1 + React Native 0.82.1
- react-native-svg for progress rings
- react-native-reanimated + react-native-worklets
- AsyncStorage for local data
- Hebrew + English support (RTL)
- Dark theme UI

## Setup & Run
```powershell
npm install --legacy-peer-deps
npx expo start
```
User has iPhone with Expo Go (SDK 54). Scan QR code to open.

## IMPORTANT: Language & Terminal
- The user speaks Hebrew. Communicate in Hebrew.
- The Windows terminal does NOT support RTL. Hebrew appears reversed.
- Therefore: write all terminal output, logs, and messages in ENGLISH.
- Only use Hebrew when communicating in chat/comments, not in terminal output.

## File Structure
- `app/_layout.js` - Root Stack layout, loads data on mount
- `app/(tabs)/` - Tab screens: Home, Calendar, Stats, Settings
- `app/log.js` - Log workout modal (reps counter + plank timer)
- `app/onboarding.js` - 4-step onboarding flow
- `src/theme.js` - COLORS constant (dark theme)
- `src/utils/storage.js` - AsyncStorage wrapper with sync cache
- `src/utils/debtEngine.js` - Debt calculation engine
- `src/utils/exercises.js` - Exercise definitions
- `src/utils/translations.js` - Hebrew/English translations
- `src/components/ProgressRing.js` - SVG circular progress
- `src/components/DealCard.js` - Deal card with ring + CTA

## Known Issues Fixed
- react must be pinned to 19.1.1 (react-native-renderer requires exact match)
- react-native-worklets must be installed (required by reanimated)
- No linear-gradient in StyleSheet (use solid colors or LinearGradient component)
- Emoji in JSX: use {'💪'} syntax, NOT \\u{1F4AA}
- app.json must NOT reference icon/splash image files that don't exist

## GitHub Repo
- Owner: aviadchai
- Repo: fitness-deal
- App code is in the `app-native/` directory
- PWA code is `index.html` in root

## User Notes
- User speaks Hebrew, communicate in Hebrew
- User has Windows PC, no Mac
- User has no Apple Developer account yet
- User accesses PC remotely from phone sometimes
- Keep terminal commands minimal and tested
- Always test changes locally before asking user to run anything
