# Aegis — Private, Offline Health Copilot

> **Paste a lab report → it's read, explained in plain language, and flagged against its exact reference ranges — entirely on your own device. Your medical data never leaves your hands.** (Photo capture with on-device OCR is on the roadmap.)

---

## Elevator pitch

Aegis turns a confusing lab report into a clear, plain-language explanation — with every out-of-range value flagged against its exact reference range — running entirely on your phone via `@qvac/sdk`, even in airplane mode. When you want a deeper read, you can optionally borrow your *own* laptop's bigger model over a direct, end-to-end-encrypted peer link. No cloud, no account, no data broker: your medical data stays in your hands.

---

## The problem

People get lab results they can't read. The numbers are cryptic, the reference ranges are tiny grey text, and "what does this actually mean for me?" usually requires either waiting days for a clinician or pasting deeply personal medical data into a cloud chatbot — handing your bloodwork to a third party with opaque retention and training practices. Health data is among the most sensitive data a person owns, and the convenient option (cloud AI) is the privacy-hostile one. There is no good answer that is *both* helpful *and* private.

---

## The solution / what it does

Aegis is a mobile health copilot designed so that **all AI inference runs locally** through `@qvac/sdk`. You give it a lab report (paste text today; camera + on-device OCR is on the roadmap), and it:

1. **Parses** the report deterministically — extracting each value, its unit, and its reference range with regex, never a model guess.
2. **Flags** every high/low value against its exact range, with a visual range bar and a *curated, offline* explanation pulled from a built-in knowledge base (so flag explanations can't hallucinate).
3. **Explains** the whole picture in plain language with an on-device Psy-model summary. (On-device execution is proven on a Llama-1B proxy; MedPsy correctness on real reports is still being verified — the delegate path is the planned route for accuracy.)
4. **Stores** records in an AES-256-GCM encrypted store (verified in `shared/`) so you can revisit them and ask cross-report questions ("Any trends?"). On-device persistence on the phone (MMKV/FileSystem) is wired but not yet verified on a device.
5. **Optionally delegates** a heavier analysis to *your own* paired laptop over an encrypted P2P link — never to a server. (Delegation RPC is proven laptop-to-laptop on Node; phone-to-laptop over Expo is the planned, not-yet-verified step.)

The entire core flow (home → intake → result → history → ask) is designed to run on-device, offline, and runs end-to-end today in the browser demo.

---

## Key features

- **On-device LLM reasoning** via `@qvac/sdk` — proven running GPU-backed on a physical iPhone using a `LLAMA-3.2-1B` proxy (see Evidence). MedPsy on-device correctness is roadmap.
- **Deterministic lab-value parser** — exact values, units, and reference ranges via regex; values are never model-invented.
- **Curated offline knowledge base** — 16 common markers (hemoglobin, glucose, cholesterol, TSH, etc.) with per-flag education that is authored, not generated, so flag explanations don't hallucinate.
- **Provenance on every answer** — the Result screen shows the engine, time-to-first-token, backend (gpu/cpu), and "0 network calls" (or "encrypted peer link · 0 network calls" when delegated).
- **Prompt-injection defenses** — report text is treated as untrusted: delimited with `[[PATIENT_REPORT]]` markers, control characters stripped, doubled brackets collapsed; covered by tests.
- **Optional "borrow a bigger brain" P2P delegation** — pair your own laptop running `aegis-provider` (MedPsy-4B) over an end-to-end-encrypted Hyperswarm DHT link, with graceful fallback to on-device if the provider goes offline. *Verified laptop-to-laptop on Node; phone-to-laptop on Expo is not yet verified.*
- **Encryption at rest** — health records sealed with AES-256-GCM (Node `node:crypto`), verified in `shared/` (`crypto.test.ts`). On-device persistence on the phone is roadmap.
- **Cross-history Q&A** — ask questions answered across your saved reports. Runs as a templated preview on web today; on-device MedPsy + RAG is the planned path (RAG core verified in `shared/`).
- **Runs in airplane mode** — the core flow needs no network after first-run setup.

---

## How it works (data flow — designed to run via `@qvac/sdk`, on-device)

```
                 ┌──────────────────────── YOUR PHONE (offline-capable) ────────────────────────┐
                 │                                                                               │
  Lab report ───►│  Intake (paste text live; camera→OCR roadmap)                                 │
                 │        │                                                                       │
                 │        ▼                                                                       │
                 │  Deterministic parser  ──►  values + units + reference ranges (regex)          │
                 │        │                                                                       │
                 │        ▼                                                                       │
                 │  Flagging engine  ──►  high/low vs exact range + curated KB explanation        │
                 │        │                                                                       │
                 │        ▼                                                                       │
                 │  @qvac/sdk  ──►  Psy-model summary (on-device; GPU/Metal proven on Llama-1B     │
                 │        │            proxy, MedPsy on-device = roadmap)                          │
                 │        │            injection-safe prompt: [[PATIENT_REPORT]] … delimiters      │
                 │        ▼                                                                       │
                 │  Result screen  ──►  summary + flags + provenance (engine·TTFT·backend·0 calls) │
                 │        │                                                                       │
                 │        ▼                                                                       │
                 │  AES-256-GCM store (verified in shared/; on-device phone persist = roadmap)     │
                 │        │            ◄──►  History / cross-report Ask (RAG core verified shared/) │
                 │        │                                                                       │
                 └────────┼───────────────────────────────────────────────────────────────────┘
                          │  (optional, user-initiated only)
                          ▼  end-to-end encrypted Hyperswarm DHT link
                 ┌──────────────────────── YOUR OWN LAPTOP ─────────────────────────────────────┐
                 │  aegis-provider (Node) loads MedPsy-4B, streams a deeper analysis back.        │
                 │  Blind relays carry only encrypted bytes; fallback to phone if provider drops. │
                 │  (Proven laptop↔laptop on Node; phone↔laptop over Expo not yet verified.)      │
                 └──────────────────────────────────────────────────────────────────────────────┘
```

Every AI step — LLM reasoning, OCR, embeddings, RAG — is invoked through `@qvac/sdk`. Nothing in the core flow calls a remote AI endpoint. Delegation, when chosen, only ever connects two of *your own* devices.

---

## Tech stack

| Layer | Choice |
|---|---|
| Language | TypeScript 6.0.3 |
| Mobile | React Native 0.85.3 + Expo SDK 56.0.11 (iOS 17+, physical device), React 19.2.3, `@qvac/sdk/expo-plugin` |
| AI inference | `@qvac/sdk` 0.12.2 (Apache-2.0) — all AI inference (LLM, OCR, embeddings, RAG) is designed to route through this SDK |
| Provider | Node.js ≥ 22.17 (laptop), MedPsy-4B |
| P2P transport | Hyperswarm DHT |
| Encryption | AES-256-GCM (at rest, Node `node:crypto` — verified in `shared/`) |
| Testing | Vitest — 42 app tests + 73 shared tests = 115 total |
| Design | Fraunces + Inter |

Metro selects `qvac.native.ts` (on-device) or `qvac.ts` (web preview) per platform, so the same injection-safe reasoning core serves both the native app and the browser demo.

---

## Privacy & the "no cloud" claim (precise and defensible)

**Claim:** All AI inference is designed to run locally via `@qvac/sdk` with **zero runtime cloud AI calls**. The core flow (home → intake → result → history → ask) is designed to execute entirely on-device, even in airplane mode, and runs end-to-end today in the browser demo.

This is **disclosed and auditable**, not asserted. `remote-apis.json` (in the repo root) lists every network call the project makes. The `ai_inference_remote_calls` array is **empty (`[]`)**. The only remote calls are **build/setup-time** downloads, never runtime AI:

- npm registry — one-time dependency install (`@qvac/sdk` + native addons)
- Hugging Face (`huggingface.co/qvac/*`) — one-time model-weight download at setup; **not** called at inference time
- Apache license text — one-time build-time fetch
- Maven Central — one-time iOS build-time download of RN 0.85 prebuilt artifacts during `pod install`
- CocoaPods CDN / Homebrew — one-time build-**host** toolchain setup; never part of the app or runtime

**P2P delegation** is optional and user-initiated. When used, data flows only between the user's own phone and laptop over a Hyperswarm DHT link. Per `remote-apis.json`, blind relays are end-to-end-encrypted passthrough by design and cannot read prompts or responses — but the **exact relay-encryption specifics are still flagged for final confirmation** before submission, so this is documented as a caveat rather than a settled guarantee. Records are stored locally in AES-256-GCM encrypted storage; **no data leaves the device without an explicit user action to pair.**

---

## Track fit

- **Psy Models (primary)** — the medical reasoning layer is built around MedPsy-1.7B/4B for report summaries and cross-history Q&A, with delegation to MedPsy-4B for deeper reads. (On-device MedPsy correctness is still being verified; see roadmap.)
- **Mobile** — ships as an Expo / React Native iOS app targeting a physical iPhone (iOS 17+), with on-device GPU inference (proven on a Llama-1B proxy) and a mobile-first P2P delegation feature.
- **General Purpose** — the headless laptop provider runs on commodity hardware (verified on an M4 MacBook Pro with 16 GB RAM; targets ≤ 32 GB), making the "bigger brain" usable on a normal personal machine.
- **Build-in-Public** — a launch thread plus standalone posts are drafted in `docs/build-in-public.md`, shared publicly via [@Stetang3438](https://x.com/Stetang3438).

---

## What's verified now vs roadmap

I'm drawing a hard line between what is proven and what is in progress. Judges punish overclaiming, so this section is deliberately conservative.

### Verified now

- **On-device GPU inference (the central edge-AI risk).** `LLAMA-3.2-1B` (Q4_0, as a stand-in proxy for MedPsy to keep the spike small and auto-downloadable) ran on an **iPhone 15 Pro Max (A17 Pro GPU via Metal)**: **TTFT 432 ms, 44.6 tok/s, backend `gpu`, 0 network calls** (`evidence/on-device-inference.md`).
- **Full web demo UX** runs end-to-end in the browser: home → intake → result → history → ask → pair (`npx expo start --web`).
- **115 unit tests** total — 42 in `app/` (parsing, injection resistance, knowledge base, services) and 73 in `shared/` (core reasoning, crypto store, metrics, delegation RPC). Both suites pass.
- **Deterministic lab-value parser** — exact values/units/ranges via regex, never hallucinated; 11 test cases in `labparse.test.ts` (20+ parser/value assertions across the suite).
- **Curated knowledge base** — 16 markers with offline, authored per-flag education.
- **Prompt-injection defenses** — `[[PATIENT_REPORT]]` delimiting, control-char stripping, bracket collapsing; covered by tests.
- **Zero runtime cloud AI calls** — disclosed in `remote-apis.json` (`ai_inference_remote_calls: []`); core flow runs in airplane mode.
- **Laptop-to-laptop delegation RPC** — Hyperswarm DHT P2P verified on Node; streams inference from MedPsy-4B.
- **Encryption at rest** — AES-256-GCM seal/open verified in `crypto.test.ts` (in `shared/`), implemented with Node `node:crypto`.
- **Apache-2.0 license** confirmed in `/LICENSE`.

### Roadmap / in progress (not yet proven)

- **Phone-side camera → OCR.** Text-paste intake is live; the camera path and on-device `ocr()` / VLM fallback (SmolVLM2) are **wired but not yet run on a physical device.**
- **MedPsy on-device accuracy.** A spike found MedPsy-1.7B unreliable (misflags glucose/LDL), so the design uses it only as a fallback; **MedPsy-4B correctness on real reports is unverified** — the delegate path is the planned route for accuracy.
- **Phone ↔ laptop P2P delegation on Expo.** Delegation RPC is proven on Node; **iOS SDK integration with Hyperswarm DHT is not yet verified on a physical iPhone** running the Expo app.
- **On-device encrypted store on phone.** AES-256-GCM and RAG ingest are verified in `shared/`; **on-device MMKV/FileSystem persistence on the phone is not yet verified.**
- **MedPsy-1.7B on-device download & load latency** — not yet measured on a phone.
- **Graceful fallback (delegate-timeout → local retry).** Logic (catching codes 53701/53702) is tested in `shared/`; **end-to-end behavior on the phone is untested.**

---

## Evidence

- **On-device inference proof:** `evidence/on-device-inference.md` — read directly off the iPhone 15 Pro Max: **`✅ LOCAL — TTFT 432 ms · 44.6 tok/s · backend: gpu`**, 0 network calls, model `LLAMA_3_2_1B_INST_Q4_0` via Metal on the A17 Pro GPU (proxy for MedPsy).
- **Laptop smoke (M4 MacBook Pro, 16 GB):** TTFT 521 ms, 48.6 tok/s, backend `cpu (M4)`, model load 773 ms (one-time; first run also includes a ~773 MB download, ≈ 6.5 min, cached thereafter) — `spikes/day1-findings.md`.
- **Hardware specs & profiler samples:** `evidence/hardware.md`, `evidence/profiler-sample.json`, `evidence/profiler-sample.txt`.
- **Network disclosure:** `remote-apis.json` — `ai_inference_remote_calls: []`; only build/setup-time calls listed.
- **Day-1 findings:** `spikes/day1-findings.md` — SDK integration, delegation RPC, MedPsy accuracy gaps, model-registry introspection.

**Reproduce:**

```bash
# Browser demo (no device needed)
cd app && npm install && npx expo start --web

# On a physical iPhone 15 Pro Max, iOS 17+
cd app && npx expo run:ios --device

# Laptop Node provider (prints public key for pairing)
cd provider && npm install && npx tsx src/provider.ts

# Tests
cd app && npx vitest run     # 42 app tests
cd shared && npm test        # 73 core tests
```

---

## Links

- **GitHub repo:** https://github.com/stetang98/aegis
- **Demo video:** `<DEMO_VIDEO_URL>`
- **Build-in-public thread (X):** [@Stetang3438](https://x.com/Stetang3438) — `<X_THREAD_URL>`

---

## License

Apache-2.0 (see `/LICENSE`).

---

## Team

Solo — **Ste Tang** ([@Stetang3438](https://x.com/Stetang3438) · GitHub [stetang98](https://github.com/stetang98)).
