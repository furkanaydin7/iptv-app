# Repository Guidelines

## Project Structure & Module Organization
- Root entry: `index.ts` (Expo `registerRootComponent`).
- App/router state: `App.tsx` (`home` | `player` | `settings`).
- Screens: `screens/*Screen.tsx` (e.g., `HomeScreen`, `PlayerScreen`).
- Services: `services/channelStorage.ts` for `AsyncStorage` persistence.
- Utils: `utils/m3uParser.ts`, `utils/xtreamClient.ts`.
- Types: `types.ts`, `types/*.ts` for shared models.
- Assets/config: `assets/`, `app.json`, `tsconfig.json`.
- Tests: colocated `*.test.ts(x)` near sources (see `__tests__/`).

## Build, Test, and Development Commands
- `npm start`: Start Expo dev server (Expo Go or simulator).
- `npm run ios`: Build and open iOS app in Simulator.
- `npm run android`: Build and open Android app on emulator/device.
- `npm run web`: Run web build via Expo.
- `npm test`: Run unit tests (Jest + ts-jest). Optional: add `"test:watch"`.

## Coding Style & Naming Conventions
- TypeScript strict mode; prefer explicit types (`Channel`, Xtream models).
- Formatting: 2-space indent, semicolons, single quotes in TS/TSX.
- Naming: Components PascalCase (e.g., `SettingsScreen`); vars/functions camelCase; constants UPPER_SNAKE_CASE.
- Filenames: `PascalCase.tsx` for screens; `camelCase.ts` for utils/services.
- Styles: keep in `StyleSheet.create(...)`; avoid large inline styles.

## Testing Guidelines
- Framework: Jest with `ts-jest` (see `jest.config.js`).
- Test names: `*.test.ts` / `*.test.tsx`, colocated near sources.
- Mocks: mock `AsyncStorage` and network (`fetch`).
- Focus: `utils/m3uParser.ts` and `utils/xtreamClient.ts` units.
- Run: `npm test` (optionally `npm run test:watch`).

## Commit & Pull Request Guidelines
- Commits: Conventional Commits (e.g., `feat(player): add background playback`).
- PRs: clear scope/description, linked issues, screenshots or short videos for UI changes, and testing notes.
- Keep diffs focused; avoid unrelated refactors or mixed changes.

## Security & Configuration Tips
- Do not commit private playlist URLs or credentials; never hardcode secrets.
- User data persists in `AsyncStorage`. For debugging, use `ChannelStorage.clearAllSources()`.
- Prefer runtime input or untracked local config for sensitive values.

## Architecture Notes
- Navigation is state-based in `App.tsx`. To add a screen: create `screens/MyScreen.tsx`, extend the `currentScreen` union and handlers in `App.tsx`, and keep data logic in `services`/`utils`.
