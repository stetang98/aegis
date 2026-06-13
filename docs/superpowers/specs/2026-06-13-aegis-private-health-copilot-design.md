# Aegis — Private, Offline Health Copilot (Design Spec)

> **Working name:** Aegis (shield = privacy/protection). Alternatives to consider before submission: *Locket*, *Cairn*, *Vela*. Final name TBD with operator.
>
> **One-liner:** A fully offline health copilot. Snap a photo of a lab/checkup report → on-device OCR extracts it → **MedPsy** explains it in plain language and flags out-of-range values → it's saved to a local, encrypted personal health record you can question across time. Your medical data never leaves your own devices.

**Date:** 2026-06-13 · **Author:** Ste Tang (operator) + Claude (engineer) · **Status:** Design — pending operator review

---

## 1. Context

- **Event:** QVAC Hackathon I — Unleash Edge AI (Tether). Build period **Jun 1–21, 2026**. Hard deadline **Jun 21, 23:59 UTC**. Today = **Jun 13** → **8 days**.
- **Early-bird bonus:** rules state two conflicting dates ("before June 17" vs "before June 14"). **Target a complete submission by Jun 17**; treat Jun 18–21 as polish/buffer. Confirm the real date on Discord Day 1.
- **Mandatory constraints:** all inference via **`@qvac/sdk`**; fully on-device, **no cloud AI, no inference clusters/multi-GPU**; **Apache-2.0** open source; public Git repo; ≤5-min demo video (YouTube unlisted); full evidence bundle for a **3-stage verification**; structured file listing all remote API calls; join Discord.
- **Verified SDK facts (Jun 13, 2026):** `@qvac/sdk` `0.12.2`, Apache-2.0. Node ≥22.17 / Bare ≥1.24 / Expo ≥54. Mobile = **Expo + React Native, native bindings, physical device only (no emulator)**, iOS 17+/Android 12+, GPU via `device:"gpu"`. Sources: docs.qvac.tether.io, npm, huggingface.co/qvac.

## 2. Target tracks (one submission, multiple tracks)

A single project may enter multiple tracks (submission form is multi-select; judged per-track **and** for the global podium). This project legitimately spans:

| Track | Fit |
|---|---|
| **Our Psy models** (primary) | MedPsy-1.7B/4B are the medical brain of the whole app. |
| **Mobile** | Native Expo/RN app on a retail phone; "delegation to a laptop via P2P" is an explicit Mobile focus area. |
| **General Purpose** | Laptop (≤32 GB) is the main compute when delegated. |
| **Global podium** | Strongest privacy narrative + real P2P + clean evidence. |
| **Build in Public** | X journey under a team hashtag, tagging @QVAC. |

## 3. Goals / Non-goals

**Goals**
- One **hero flow** polished to "wow": report photo → OCR → MedPsy explanation → encrypted RAG record → cross-history follow-up.
- A **P2P delegation showcase** with **on-screen live metrics** and **graceful offline fallback**.
- An **evidence bundle** that is consistent, reproducible, and sourced from the SDK's own profiler.
- A privacy narrative that lands in <5 minutes: **zero cloud, zero remote calls, data stays on your devices.**

**Non-goals (YAGNI)**
- No fine-tuning / LoRA (QVAC Fabric `finetune()` exists but is out of 8-day solo scope; mention as future work).
- No diffusion/image-gen, no video, no translation features unless free.
- No clinician/diagnostic positioning — strictly **personal education / insight**.
- No browser/PWA client (unsupported by SDK) — locked to native.

## 4. Users & positioning

- **User:** an individual managing **their own** health documents.
- **Positioning (compliance-safe + strongest narrative):** "**education and personal insight, not diagnosis.**" Every medical output carries a short disclaimer and a "questions to ask your doctor" framing. This matches the hackathon's own caveat and avoids regulatory red lines.

## 5. Hero flow (the demo centerpiece, ~90s)

1. Phone in **airplane mode** (on-camera proof of zero cloud).
2. User snaps a lab/checkup report.
3. **Local `ocr()`** (`@qvac/ocr-onnx`) extracts the report text/values — runs on the phone when offline, or on the laptop when delegated (location decided in spike). Either way it is local, never cloud. *(Spike: if table-layout extraction is weak, fall back to a small VLM — SmolVLM2 + mmproj — for extraction. MedPsy remains the medical reasoner either way.)*
4. **MedPsy** turns the extracted values into plain-language explanation, flags out-of-range markers, and suggests questions for a doctor — with the education-not-diagnosis disclaimer.
5. Result is saved into a **local, encrypted personal health record** (RAG store via `ragIngest()`).
6. Cross-history follow-up: "How has my cholesterol changed over the last 6 months?" → `ragSearch()` retrieves prior reports → MedPsy answers with the trend.

**Stretch (only if time):** TTS (`textToSpeech()`) reads the explanation aloud; STT (`transcribe()`) lets the user ask by voice. Accessibility angle.

## 6. P2P delegation showcase (technical centerpiece)

Run the **same** explanation request two ways, side-by-side, with a live metrics panel:

- **Phone-local:** MedPsy-1.7B (Q4_K_M, 1.28 GB) on the phone — private even with no laptop, but shallower/slower.
- **Delegated:** phone offloads to the laptop over QVAC P2P → MedPsy-4B (Q4_K_M, 2.72 GB) → lower TTFT, higher tok/s, deeper reasoning.
- **Metrics panel shows:** model name · TTFT · tokens/sec · total tokens · **which device ran it**. This panel *is* the evidence bundle, made visible.
- **Resilience beat:** pull the laptop offline mid-demo → `fallbackToLocal` degrades gracefully to phone-local. One sequence demonstrates **P2P + performance + resilience + verifiability** at once.

**Verified delegation API:**
```js
// Laptop (Node provider)
const { publicKey } = await startQVACProvider({ /* serves MedPsy-4B */ });
// ...later: stopQVACProvider();

// Phone (consumer) — after this, completion() is identical to a local call
const modelId = await loadModel({
  modelSrc: MEDPSY_1_7B,                 // local fallback model
  delegate: { providerPublicKey: publicKey, timeout: 60_000, fallbackToLocal: true },
});
```
Transport = Hyperswarm DHT (`dht.connect(providerPublicKey)`), blind relays for NAT, `heartbeat()` to probe liveness. **Pairing UX:** discovery is by raw public key only (no built-in QR) → we build a QR pairing flow (laptop displays its `publicKey` as a QR; phone scans). Doubles as a clean demo beat.

## 7. Architecture

```
┌─────────────────────────────┐         Hyperswarm DHT          ┌──────────────────────────────┐
│  PHONE (Expo / React Native)│◄───────  dht.connect(pubKey) ──►│  LAPTOP (Node ≥22.17, headless)│
│  • UI + camera capture      │         blind relay (NAT)        │  • startQVACProvider()         │
│  • MedPsy-1.7B (local/fallbk)│                                 │  • MedPsy-4B (delegated infer) │
│  • P2P consumer (delegate)  │                                 │  • ocr() heavy extraction      │
│  • encrypted health record  │                                 │  • profiler → evidence logs    │
│  • RAG (ragIngest/ragSearch)│                                 │                                │
│  • metrics panel + logger   │                                 │                                │
└─────────────────────────────┘                                 └──────────────────────────────┘
        data never leaves device                                 OCR location decided in spike:
                                                                 default heavy OCR on laptop when
                                                                 delegated; phone-local otherwise.
```

- **Phone client:** UI, camera, MedPsy-1.7B local, P2P consumer, encrypted store + embeddings, metrics logger.
- **Laptop provider:** headless Node node running `startQVACProvider()` serving MedPsy-4B; heavy `ocr()`; exports profiler metrics. **Run entirely by the engineer via the terminal.**
- **Transport:** QVAC P2P delegation (Hyperswarm DHT + blind relays).
- **Data layer:** local encrypted health-record store + RAG index on the phone; nothing leaves the device.
- **Evidence layer:** wraps the SDK `profiler` (`enable()` / `exportJSON()` / `exportTable()`) + `loadModel`/`unloadModel` events into the required structured log.

**Design for isolation:** each unit (camera/intake · OCR adapter · MedPsy reasoner · RAG store · P2P transport · metrics/evidence · UI) is a small module behind a clear interface, independently testable. OCR and transport are adapters so the spike can swap implementations without touching the rest.

## 8. Models

| Role | Model | Size (Q4_K_M) | Where |
|---|---|---|---|
| Phone local / fallback | **MedPsy-1.7B-GGUF** | 1.28 GB | on phone |
| Delegated deep reasoning | **MedPsy-4B-GGUF** | 2.72 GB | laptop |
| Report extraction | `ocr()` (`@qvac/ocr-onnx`); VLM fallback SmolVLM2+mmproj | — | laptop (default) |
| Embeddings (RAG) | GGUF embedding model via `embed()` | small | phone |

MedPsy = Qwen3-Thinking base, **text-only by design**, Apache-2.0 (research/educational). Both contrast models are MedPsy → consistent medical quality, differing only in depth/speed.

## 9. QVAC stack coverage → judging map

| Judging criterion | How we hit it |
|---|---|
| QVAC usage (full stack) | MedPsy LLM + `embed`/RAG + `ocr` + **P2P delegation** (+ optional TTS/STT) — 4–5 components, all load-bearing |
| Technical execution & perf | TTFT/tok-s on real hardware; delegated vs local contrast; profiler-sourced |
| Innovation & model creativity | OCR→MedPsy pipeline; phone↔laptop medical delegation |
| Originality (incl. prompt-injection resistance) | §11 security; novel P2P health use case |
| Artifact quality & verification | profiler logs ↔ video ↔ hardware all consistent (§10) |
| Impact & market relevance | private health-record intelligence — universal, high-stakes privacy |
| Awareness | build-in-public X journey |
| Early bird | complete by Jun 17 |

## 10. Evidence / verification plan (the under-invested winning lever)

- **`metrics/` logger** wrapping SDK `profiler.exportJSON()` + `exportTable()` and `loadModel`/`unloadModel` events → emits **JSON + CSV** per run: `{ ts, event, model, device, delegated, prompt_hash, tokens_in, tokens_out, ttft_ms, tok_per_s }`.
- **`scripts/standard-demo-run`** → one command produces a clean, reproducible log for the "standard demo run" the rules ask for.
- **`remote-apis.json`** — required disclosure of remote calls = **`[]` (none)**. Zero remote calls is itself a flex.
- **`hardware.md`** + System Profiler screenshots (auto-capture laptop specs via `system_profiler`; phone specs from operator).
- **`README.md`** — out-of-the-box reproduction steps for both devices, Apache-2.0, model download instructions.
- **3-stage alignment:** (1) static = clean repo, license, structure; (2) artifact consistency = logs match video match hardware; (3) live action = trivially runnable.
- **Open:** exact evidence-bundle format unconfirmed (DoraHacks blocks scraping) → **confirm on Discord Day 1**; profiler output is the safe default.

## 11. Security & privacy (originality points)

- **Offline-first:** core flow runs in airplane mode; `remote-apis.json` = none.
- **Encrypted at rest:** health-record store encrypted on device.
- **Prompt-injection resistance (on-theme originality):** OCR'd report text is **untrusted data**. A malicious report image could contain "ignore previous instructions…". Mitigations: strict instruction/data separation (report text is delimited, never concatenated into the system prompt), output constrained to the explanation schema, and an injection-attempt test in the suite. This directly targets the judges' "security (prompt injection resistance)" note.

## 12. Tech stack (locked)

- **Phone:** Expo (≥54) + React Native, `@qvac/sdk` with `@qvac/sdk/expo-plugin` in `app.json`, `npx expo prebuild`, native bindings, **physical device only**, GPU `device:"gpu"`.
- **Laptop:** Node ≥22.17, headless `@qvac/sdk` provider.
- **No** browser/PWA/Tauri (unsupported).
- Language: TypeScript throughout.

## 13. Risks & mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| **Mobile P2P consumer unproven** — no official example of delegated `loadModel` over Hyperswarm DHT inside the Bare/Expo runtime | **High (crux)** | **Day-1 spike** tests exactly this. Fallback: on-device MedPsy-1.7B only (fully supported) or LAN transport. Project survives regardless. |
| OCR weak on table layouts | Medium | Spike tests `ocr()` on a real report; VLM (SmolVLM2+mmproj) fallback for extraction |
| Pairing UX (raw pubkey only) | Low | Build QR pairing (laptop QR → phone scan) |
| Evidence-bundle format unknown | Low | Discord Day 1; profiler default |
| Expo native build friction (signing, prebuild) | Medium | Day-1 spike includes prebuild + on-device install; operator does device trust step |
| 8-day solo scope creep | Medium | One hero flow; TTS/STT/Fabric are explicitly stretch-only |

## 14. Day-1 spike (gates everything)

> **Goal:** prove the crux. Laptop runs `startQVACProvider()` serving MedPsy-1.7B; a **physical phone** (Expo prebuild) calls `loadModel({ delegate: { providerPublicKey } })` + `completion()` and **streams tokens from the laptop**.

Also in the same spike: install/env (Node 22.17, Expo 54), `ocr()` quality on a real report, QR pairing, profiler export. **Outcomes:** ✅ → full architecture green. ❌ → switch to on-device-only or LAN fallback before investing further.

## 15. Eight-day timeline (Jun 13 → Jun 21; target complete by Jun 17)

- **D1 (today):** SDK research ✓ → **real-device spike**; register DoraHacks; join Discord (ask evidence-format Q); first build-in-public tweet; operator provides a sample report.
- **D2:** Vertical slice — phone → text query → delegated MedPsy-4B → streamed response + metrics logged (the P2P contrast skeleton).
- **D3:** Hero intake — photo → `ocr()` → MedPsy explanation (or text-RAG fallback if spike says so).
- **D4:** RAG health record — `embed`/`ragIngest`/`ragSearch`, encrypted store, cross-history follow-up.
- **D5:** Phone-local fallback + graceful P2P drop/resume; full hero end-to-end.
- **D6:** Evidence bundle hardening — logger, standard-demo-run, `remote-apis.json`, README, reproducibility, hardware capture. Draft complete submission.
- **D7:** UX polish + metrics panel; record 5-min demo video (operator films phone; engineer writes script/storyboard, edits screen capture).
- **D8 (buffer, Jun 18–21):** final QA + DoraHacks submission + closing tweets + contingency.

## 16. Division of labor

**Engineer (Claude):** 100% of code; runs the **entire laptop side via the terminal** (install, build, provider, MedPsy, OCR, RAG, logs, auto-capture laptop hardware specs); README; disclosure files; demo-video script + storyboard + screen-capture/edit; tweet drafts; submission copy.

**Operator (Ste):** physically-yours-only — (1) the **phone** (install dev build, grant camera, point at report — a few short sessions); (2) **account/legal actions**: DoraHacks register+submit (you accept Terms; prize is in your name), Discord question, X posts from @Stetang3438 — drafts provided, you paste+click; (3) a **sample report file**; (4) **film the phone** during the demo. macOS may prompt once to grant Screen Recording permission for laptop capture.

## 17. Open questions / Day-1 asks

1. Final product **name** (working = Aegis).
2. A **sample lab/checkup report** (yours or anonymized) to build and demo on.
3. Confirm **X handle** for build-in-public (@Stetang3438) + pick a **team hashtag**.
4. OK to **`git init`** here + add Apache-2.0 LICENSE and push to a public GitHub repo (required by rules)?
5. Discord: confirm exact **evidence-bundle format** + the real **early-bird date**.

## 18. Success criteria

A genuinely working, fully-offline MedPsy health copilot demonstrating real phone↔laptop P2P delegation with on-screen, profiler-sourced metrics and graceful fallback; a squeaky-clean, reproducible evidence bundle; a privacy narrative that lands in <5 min; Apache-2.0 and runnable out-of-the-box; an authentic build-in-public trail. Targets: **Psy track** (primary), **Mobile track**, **global podium** contention, **Build-in-Public** prize.
