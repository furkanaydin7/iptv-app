# IPTV App

Eine plattformübergreifende IPTV-App für iOS und Android, die M3U-Playlists und Xtream Codes API unterstützt. Die App bietet Videowiedergabe, Hintergrund-Audiowiedergabe und umfassende Kanalverwaltung.

## Features

- ✅ **M3U Playlist Unterstützung**: Lade Kanäle aus M3U-URLs
- ✅ **Xtream Codes API**: Unterstützung für Login-basierte IPTV-Services  
- ✅ **Video Player**: Vollständiger Video-Player mit Bedienungselementen
- ✅ **Hintergrund-Audio**: Audio läuft im Hintergrund weiter
- ✅ **Kanal-Browser**: Durchsuchen und filtern von Kanälen
- ✅ **Favoriten**: Markiere deine Lieblings-Kanäle
- ✅ **Zuletzt angesehen**: Verfolge kürzlich angeschaute Kanäle
- ✅ **Gruppierung**: Kanäle nach Kategorien gruppiert
- ✅ **Suche**: Durchsuche Kanäle nach Namen oder Gruppe
- ✅ **Persistent Storage**: Einstellungen und Daten werden lokal gespeichert

## Installation & Entwicklung

### Voraussetzungen

- Node.js 18+
- Expo CLI
- iOS Simulator oder Android Emulator (für Tests)

### Setup

```bash
cd IPTVApp
npm install
```

### App starten

```bash
# Entwicklungsserver starten
npm start

# iOS Simulator
npm run ios

# Android Emulator  
npm run android
```

## Projektstruktur

```
IPTVApp/
├── components/           # React Components
│   ├── VideoPlayer.tsx   # Video-Wiedergabe-Komponente
│   ├── PlayerControls.tsx # Player-Bedienelemente
│   ├── ChannelList.tsx   # Kanal-Liste mit Suche
│   └── AddPlaylistModal.tsx # Modal zum Hinzufügen von Playlists
├── screens/             # App-Bildschirme
│   ├── HomeScreen.tsx   # Hauptbildschirm
│   └── PlayerScreen.tsx # Player-Bildschirm
├── services/            # Business Logic
│   ├── M3UParser.ts     # M3U-Playlist Parser
│   ├── AuthService.ts   # Xtream Codes Authentifizierung
│   ├── StorageService.ts # Lokale Datenspeicherung
│   └── BackgroundAudioService.ts # Hintergrund-Audio
├── types/               # TypeScript Typen
│   └── index.ts
└── App.tsx             # Hauptkomponente
```

## Verwendung

### M3U Playlist hinzufügen

1. Tippe auf "Add Playlist" 
2. Wähle "M3U URL"
3. Gib die URL zu deiner M3U-Playlist ein
4. Tippe auf "Add"

### Xtream Codes Anmeldedaten

1. Tippe auf "Add Playlist"
2. Wähle "Login Credentials" 
3. Gib Server-URL, Benutzername und Passwort ein
4. Tippe auf "Add"

### Video wiedergeben

1. Wähle einen Kanal aus der Liste
2. Der Video-Player startet automatisch
3. Tippe auf den Bildschirm für Bedienelemente

### Audio-Modus

1. Im Player auf das Kopfhörer-Symbol tippen
2. Audio läuft im Hintergrund weiter
3. Mit dem Video-Symbol zurück zum Video-Modus

### Favoriten verwalten

- Herz-Symbol neben Kanälen antippen
- Im "Favorites" Tab alle markierten Kanäle sehen

## Technische Details

### Abhängigkeiten

- **expo-av**: Video/Audio Wiedergabe
- **@react-native-async-storage/async-storage**: Lokale Datenspeicherung
- **expo-keep-awake**: Bildschirm aktiv halten
- **@expo/vector-icons**: Icons

### Unterstützte Formate

- **M3U/M3U8**: Standard-Playlist-Format
- **HTTP/HTTPS Streams**: Live-Video-Streams
- **Xtream Codes API**: JSON-basierte API für IPTV-Services

### Hintergrund-Wiedergabe

iOS und Android Konfiguration für Hintergrund-Audio:
- iOS: `UIBackgroundModes` in app.json konfiguriert
- Android: `FOREGROUND_SERVICE` Permission

## Build für Produktion

### iOS

```bash
npx expo build:ios
```

### Android

```bash
npx expo build:android
```

## Lizenz

Dieses Projekt dient Bildungszwecken. Stelle sicher, dass du berechtigt bist, die IPTV-Inhalte zu verwenden, die du über diese App zugreifst.