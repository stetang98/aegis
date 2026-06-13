# Aegis — Plan 3: iOS Spike App + Mobile Delegation

> Device: iPhone 15 Pro Max (A17 Pro, 8GB RAM, Metal 3), iOS 26.5. Mac (M4) builds it. Reuses the
> `shared/` product core (prompt, think, service, client, metrics, store) already built & tested in Plan 2.

**Goal:** Prove and then ship the phone half: an Expo/React Native app that runs MedPsy on-device and/or
delegates to the laptop over QVAC P2P — unlocking the Mobile track + the signature delegation demo.

## Hard iOS facts (verified)
- **Physical device only** — QVAC does NOT run on the iOS Simulator (llama.cpp limitation) and the
  hackathon requires real-hardware proof anyway. Use the real iPhone 15 Pro Max via USB.
- **No Expo Go** — QVAC needs native bindings (`react-native-bare-kit`); requires a custom dev build
  (`expo prebuild` + Xcode), not the Expo Go sandbox.
- **Xcode** (latest, free, ~10GB+) required on the Mac to build/sign/deploy. Long pole — install first.
- **Free Apple ID signing** is enough to run on your own device (7-day expiry; re-run to refresh). The
  $99/yr program is only for TestFlight/App Store — not needed.
- iPhone: enable **Developer Mode** (Settings → Privacy & Security), trust the Mac on USB, trust the dev cert.
- 8GB RAM → **MedPsy-1.7B (1.28GB) runs locally comfortably**; keep MedPsy-4B on the laptop (delegated)
  to avoid iOS per-app memory limits. This is exactly the "phone-local vs delegated" contrast.

## Build order

### Operator setup (parallel, gated on Xcode)
- [ ] Install latest **Xcode** from App Store; open once to install components; `sudo xcodebuild -license accept` if prompted.
- [ ] iPhone: Developer Mode ON (reboot); connect USB; "Trust This Computer".
- [ ] In Xcode: sign in with a free Apple ID (Settings → Accounts) for signing.

### Spike app (engineer — minimal, de-risk the crux FIRST)
- [ ] `create-expo-app app` (blank-typescript) — done in background.
- [ ] `npx expo install @qvac/sdk react-native-bare-kit expo-file-system expo-device expo-build-properties`
- [ ] `app.json`: add `@qvac/sdk/expo-plugin`; iOS deployment target + arm64; GPU via `device:"gpu"`.
- [ ] One screen `App.tsx`: buttons "Load + run (local)" and "Run (delegated)" + a provider-pubkey input
      (paste/scan), streaming output area, and a "which device answered" indicator. Import the shared
      reasoning where it is RN-safe (prompt/think are pure; client uses @qvac/sdk on-device).
- [ ] `npx expo prebuild -p ios` (needs Xcode/CLT).

### Crux spike on the real device (engineer + operator)
- [ ] `npx expo run:ios --device` → installs on the iPhone (operator trusts cert, taps open).
- [ ] **TEST 1 (local):** load MedPsy-1.7B on the phone, run a completion → confirms on-device inference + Metal.
- [ ] **TEST 2 (the crux):** laptop runs `provider.ts` serving MedPsy-4B → phone `loadModel({delegate:{providerPublicKey}})` + completion streams from the laptop INSIDE the Bare/Expo runtime.
- [ ] **DECISION:** ✅ delegation works on iOS → build full hero. ⚠️ LAN-only → note it. ❌ doesn't run in mobile runtime → fall back to on-device-1.7B-only (still a valid Mobile-track entry) and reframe the contrast.

### Full hero (after spike green)
- [ ] Report intake (photo → OCR on laptop-delegate or on-device) → explainReport via shared core.
- [ ] On-screen metrics panel (TTFT/tok-s/device) = the evidence made visible.
- [ ] "Phone-local vs delegated" side-by-side + airplane-mode resilience beat.
- [ ] Encrypted record store on device + cross-history follow-up (reuse shared store/service).
- [ ] QR pairing (laptop shows provider pubkey QR → phone scans).

## Monorepo note
`shared/` is consumed by the Expo app via Metro. May need `metro.config.js` `watchFolders` + the shared
path, or a workspace. The pure modules (prompt/think/metrics/store/service) are platform-agnostic; the
client uses `@qvac/sdk` which the app also depends on. Wire this when adding the deps.

## Fallback ladder (project never dies)
delegation-on-iOS ✅ → full hero. If ❌: on-device MedPsy-1.7B only (Mobile track, no delegation) → if
that's tight: LAN transport → if all else fails: laptop Web/Electron demo (Plan 2 core, drops Mobile track).
