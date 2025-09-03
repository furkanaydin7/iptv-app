# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native IPTV streaming application built with Expo SDK 53 and TypeScript. The app provides video streaming with background audio support and cross-platform compatibility (iOS, Android, Web).

## Development Commands

- `expo start` - Start the development server with Metro bundler
- `expo run:android` - Build and launch on Android device/emulator
- `expo run:ios` - Build and launch on iOS simulator
- `expo start --web` - Start web development server
- `npm test` - Run unit tests (Jest)

## Project Architecture

### Entry Points
- `index.ts` - Main entry point that registers the root component
- `App.tsx` - Root React component with navigation logic

### Application Structure
- Simple state-based navigation between 'home' and 'player' screens
- `Channel` type system defined in `types.ts` for IPTV channel management
- Screen components: `HomeScreen` (channel list) and `PlayerScreen` (video player) in `./screens/`
- State management handled in `App.tsx` with React hooks

### Key Features
- IPTV channel selection and streaming
- Video player with background audio (iOS/Android)
- Cross-platform support (iOS, Android, Web)
- App-state aware audio continuation in background

## Dependencies & Libraries

### Core Expo Modules
- `expo` (v53.0.22) - Core Expo SDK
- `expo-video` (v2.2.2) - Video playback with native Picture-in-Picture
- `expo-audio` (v0.4.9) - Audio session management
- `expo-status-bar` - Status bar management

### Storage & State
- `@react-native-async-storage/async-storage` - Persistent local storage

### Development
- `typescript` (v5.8.3) - TypeScript support with strict mode enabled
- `@babel/core` - Babel transpilation

## Platform-Specific Configuration

### iOS Configuration (app.json)
- Background audio mode: `audio`
- Audio session category: `AVAudioSessionCategoryPlayback`
- iPad support enabled

### Android Configuration
- Edge-to-edge UI enabled
- Permissions: `INTERNET`, `WAKE_LOCK`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`
- Adaptive icon configuration

### Web Support
- Web favicon configured
- Full web platform support via Expo

## TypeScript Configuration

- Extends `expo/tsconfig.base`
- Strict mode enabled for enhanced type safety
- No additional compiler options configured

## Important Notes

- React Native New Architecture is enabled (`newArchEnabled: true`)
- Uses expo-video for video streaming with full native Picture-in-Picture support
- Uses expo-audio for background audio session management
- HomeScreen contains sample channels; real data loads from M3U/Xtream
- Jest is configured with a sample unit test for `m3uParser`
- Audio session is automatically configured for background playback on startup
- App-state listeners manage background/foreground transitions
- Native PiP works on both iOS and Android - WebView fallback available for edge cases
- Migrated from deprecated expo-av to modern expo-video/expo-audio