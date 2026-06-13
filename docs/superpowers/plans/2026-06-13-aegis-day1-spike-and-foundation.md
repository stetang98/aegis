# Aegis — Day 1: Spike & Foundation (Implementation Plan)

> **For agentic workers:** Use superpowers:executing-plans (inline) to work this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. **This project requires code review after every code change** — run `/code-review` (or a `*-reviewer` agent) on each diff before moving on.

**Goal:** Prove the one architecture-gating unknown (a physical phone delegating MedPsy inference to the laptop over QVAC P2P) and stand up the repo foundation — so Days 2–8 build on verified ground, not assumptions.

**Architecture:** Phone (Expo/React Native, MedPsy-1.7B local + P2P consumer) ↔ laptop (Node provider, MedPsy-4B) over Hyperswarm DHT. Day 1 verifies each layer bottom-up: SDK runs → MedPsy loads → provider exposes a key → phone delegates → secondary probes (OCR, profiler).

**Tech Stack:** `@qvac/sdk` v0.12.2 (Apache-2.0), Node ≥22.17, TypeScript + tsx, Expo ≥54 / React Native, MedPsy-1.7B/4B GGUF.

---

## Planning strategy (read first)

- **This plan = Day 1 only**, fully detailed. Days 2–8 are a milestone roadmap at the end; each becomes its own detailed plan after the spike.
- **Spike phases are "run & observe", not TDD.** Spike code is exploratory and may be thrown away. That is correct for de-risking — you do not write unit tests for "does the DHT connect."
- **Production code (Plan 2 onward) follows TDD + ≥80% coverage + per-change code review** per project rules. Day 1's only durable code is the repo scaffolding.
- **API caveat:** all SDK snippets below are from verified docs but **unrun**. Treat the first run of each as the verification. If a real symbol differs, fix it against `docs.qvac.tether.io/reference/api/` and note the correction.
- **Division:** engineer runs everything on the laptop via the terminal; operator (Ste) does only the phone steps + the non-code D1 checklist (Phase G).

## Repo file structure (locked Day-1 subset)

```
QVAC/                         # repo root = /Users/stetang/Desktop/QVAC
├── LICENSE                   # Apache-2.0
├── README.md                 # skeleton Day 1; filled Day 6
├── remote-apis.json          # [] — zero remote calls (the flex)
├── .gitignore
├── docs/superpowers/{specs,plans}/...
├── provider/                 # laptop Node node
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── smoke.ts          # B: load tiny model + completion locally
│       ├── medpsy.ts         # C: load MedPsy-4B locally
│       └── provider.ts       # D: startQVACProvider, print publicKey
├── app/                      # E: Expo app (created via create-expo-app)
├── evidence/                 # logs, hardware.md, screenshots (Day 6)
└── spikes/                   # throwaway probe outputs/notes
    └── day1-findings.md      # WRITE AS YOU GO — the spike's deliverable
```

---

## Phase A — Repo foundation (engineer, ~20 min)

### Task A1: Initialize repo, license, gitignore, disclosure, README skeleton

**Files:** Create `LICENSE`, `.gitignore`, `remote-apis.json`, `README.md`, `spikes/day1-findings.md`

- [ ] **Step 1: Confirm with operator before any outward-facing git action.** Local `git init` is safe; creating/pushing a **public GitHub repo is outward-facing** and uses the operator's account — get an explicit OK first (spec open-question #4).

- [ ] **Step 2: Initialize git locally**

Run:
```bash
cd /Users/stetang/Desktop/QVAC && git init -b main && git status
```
Expected: empty repo on `main`, `docs/` shown as untracked.

- [ ] **Step 3: Add Apache-2.0 LICENSE**

Fetch the canonical text (one-time, non-AI utility fetch — will be disclosed):
```bash
curl -fsSL https://www.apache.org/licenses/LICENSE-2.0.txt -o /Users/stetang/Desktop/QVAC/LICENSE && wc -l /Users/stetang/Desktop/QVAC/LICENSE
```
Expected: ~202 lines. Then append the copyright line to the boilerplate section as appropriate (year 2026, name to confirm with operator).

- [ ] **Step 4: Write `.gitignore`**

```gitignore
node_modules/
*.log
.DS_Store
.expo/
android/
ios/
dist/
*.gguf
models/
evidence/screenshots/*.png
.env
```
(Models and native build dirs are large/generated — keep out of git; document how to fetch models in README.)

- [ ] **Step 5: Write `remote-apis.json` (required disclosure)**

```json
{
  "$schema": "https://qvac.tether.io/schemas/remote-apis-disclosure-v1.json",
  "project": "Aegis",
  "ai_inference_remote_calls": [],
  "non_ai_remote_calls": [
    { "name": "Apache LICENSE fetch", "url": "https://www.apache.org/licenses/LICENSE-2.0.txt", "purpose": "one-time build-time license text download", "runtime": false },
    { "name": "Model download (Hugging Face)", "url": "https://huggingface.co/qvac/*", "purpose": "one-time model weights download at setup; not used at inference time", "runtime": false }
  ],
  "notes": "All AI inference (LLM, OCR, embeddings, RAG, optional TTS/STT) runs locally via @qvac/sdk. Zero runtime remote calls. App core runs in airplane mode."
}
```
(Verify the `$schema` URL exists; if not, drop the field. The substance — empty AI remote calls — is the point.)

- [ ] **Step 6: README skeleton**

Create `README.md` with headers only (filled Day 6): Title + one-liner, Tracks, Hardware, Setup (laptop), Setup (phone), Models, Run the demo, Evidence bundle, Reproducibility, License. Add a 2-line project summary now.

- [ ] **Step 7: Create `spikes/day1-findings.md`** with a checklist mirroring Phases B–F (you will fill verified facts/corrections here — this file is the spike's deliverable and feeds Plan 2).

- [ ] **Step 8: Code review + commit**

Run `/code-review` on the diff (scaffolding/config review). Then:
```bash
cd /Users/stetang/Desktop/QVAC && git add -A && git commit -m "chore: repo foundation (license, gitignore, disclosure, readme skeleton)"
```

---

## Phase B — SDK smoke test on laptop (engineer, ~30 min)

> Goal: prove `@qvac/sdk` installs and runs at all on this Mac, before touching MedPsy or P2P.

### Task B1: Provider package + install SDK

- [ ] **Step 1: Check Node version**

Run: `node -v` — Expected: ≥ v22.17. If lower, install via nvm (`nvm install 22 && nvm use 22`) and record the version in `spikes/day1-findings.md`.

- [ ] **Step 2: Init provider package**

```bash
mkdir -p /Users/stetang/Desktop/QVAC/provider/src && cd /Users/stetang/Desktop/QVAC/provider && npm init -y && npm pkg set type=module && npm i @qvac/sdk && npm i -D tsx typescript
```
Expected: `@qvac/sdk@0.12.x` in dependencies; native addons (`@qvac/llm-llamacpp`, etc.) installed. **Record any install errors verbatim** in findings — native builds can fail and that's a real signal.

- [ ] **Step 3: Minimal `tsconfig.json`** (module NodeNext, target ES2022, strict true).

### Task B2: Local load + completion (run & observe)

- [ ] **Step 1: Write `provider/src/smoke.ts`**

```ts
import { loadModel, LLAMA_3_2_1B_INST_Q4_0, completion, unloadModel } from "@qvac/sdk";

const modelId = await loadModel({
  modelSrc: LLAMA_3_2_1B_INST_Q4_0,
  modelType: "llm",
  onProgress: (p) => console.log("load progress:", p),
});
console.log("loaded:", modelId);

const run = completion({
  modelId,
  history: [{ role: "user", content: "Reply with one short sentence: are you running locally?" }],
  stream: true,
});
for await (const tok of run.tokenStream) process.stdout.write(tok);
console.log("\n--- done ---");
await unloadModel({ modelId });
```

- [ ] **Step 2: Run & observe**

Run: `cd /Users/stetang/Desktop/QVAC/provider && npx tsx src/smoke.ts`
Expected: progress logs, a model id, streamed tokens, clean exit.
**If symbols differ** (e.g., no `LLAMA_3_2_1B_INST_Q4_0` export, or `completion` shape differs) → open `docs.qvac.tether.io/reference/api/`, fix, and record the **real** signatures in findings. This is the moment doc-knowledge becomes verified-knowledge.

- [ ] **Step 3: Record** model load time + first-token latency feel + any GPU/Metal logs in findings. Spike code — no commit required (it's under `provider/src` though; commit it as a labeled spike so Plan 2 can reference real signatures).

```bash
git add provider && git commit -m "spike: laptop SDK smoke test (verified load+completion)"
```

---

## Phase C — MedPsy on the laptop (engineer, ~30 min)

### Task C1: Load MedPsy-4B locally and sanity-check quality

- [ ] **Step 1: Determine `modelSrc` for MedPsy-4B-GGUF.** From research, `modelSrc` accepts local path, URL, or Hyperdrive key. Check whether the SDK exposes a MedPsy built-in constant or model-registry entry (`modelRegistrySearch`); otherwise download `MedPsy-4B-GGUF` (Q4_K_M, ~2.72 GB) to `provider/models/` and use the local path. Record the chosen method.

- [ ] **Step 2: Write `provider/src/medpsy.ts`** — same shape as smoke.ts but `modelSrc` = MedPsy-4B, and a real prompt: paste 3–4 lines of a sample lab result as text and ask for a plain-language explanation + flag out-of-range values + "education not diagnosis" framing.

- [ ] **Step 3: Run & observe.** Run: `npx tsx src/medpsy.ts`. Judge: does MedPsy-4B give medically sensible, plainly-worded output? Record quality impression + tok/s in findings. (This validates the product's brain before we wire transport.)

- [ ] **Step 4: Code review + commit** the medpsy spike script.

---

## Phase D — Laptop provider exposes a delegate key (engineer, ~30 min)

### Task D1: startQVACProvider → publicKey

- [ ] **Step 1: Confirm provider semantics from docs** (`docs.qvac.tether.io/p2p-capabilities/delegated-inference/`): does the provider **preload** a model (e.g., MedPsy-4B) and expose it, or does the consumer's `loadModel.modelSrc` drive what the provider serves? Record the answer — it changes the wiring.

- [ ] **Step 2: Write `provider/src/provider.ts`**

```ts
import { startQVACProvider } from "@qvac/sdk";
// If the provider must preload, load MedPsy-4B here first (per Step 1 finding).
const { publicKey, success } = await startQVACProvider({ /* params per docs */ });
console.log("PROVIDER_OK:", success);
console.log("PROVIDER_PUBLIC_KEY:", publicKey);
// keep process alive to serve the consumer
process.stdin.resume();
```

- [ ] **Step 3: Run in background & capture the key**

Run (engineer, background): `npx tsx src/provider.ts` — copy the printed `PROVIDER_PUBLIC_KEY`. This key is what the phone needs in Phase E. Record it (ephemeral) in findings/scratch.

---

## Phase E — CRUX SPIKE: phone delegates to laptop (engineer builds, operator runs phone, ~2–3 h)

> **This is the gate.** If tokens stream from the laptop to the phone, the whole architecture is green.

### Task E1: Create the Expo app and add the SDK (engineer)

- [ ] **Step 1:** `cd /Users/stetang/Desktop/QVAC && npx create-expo-app@latest app && cd app`
- [ ] **Step 2:** `npx expo install @qvac/sdk react-native-bare-kit` (+ any deps the docs' Expo tutorial lists: `expo-file-system`, `expo-device`, `expo-build-properties`).
- [ ] **Step 3:** Add `@qvac/sdk/expo-plugin` to `app.json` `plugins` (per docs). Add `expo-build-properties` for arm64/Metal/Vulkan if required.
- [ ] **Step 4:** Write a minimal one-screen UI: a "Run delegated" button, a "Run local" button, a text area for streamed output, and a field/QR-input for the provider public key.
- [ ] **Step 5:** `npx expo prebuild` — generates native `ios/`/`android/`. Record any errors.

### Task E2: Install the dev build on a physical device (operator + engineer)

- [ ] **Step 1 (operator):** connect the phone via USB (or be on the same Wi-Fi). For iOS: trust the dev cert (Settings → General → VPN & Device Management). For Android: enable USB debugging.
- [ ] **Step 2 (engineer):** `npx expo run:ios --device` (or `run:android --device`). Operator confirms the app opens on the **physical** device (emulators are unsupported).

### Task E3: Delegated completion (the probe)

- [ ] **Step 1:** Pass the laptop's `PROVIDER_PUBLIC_KEY` into the app (paste, or scan a QR the laptop prints). Phone and laptop must reach the same DHT (internet ok; same LAN helps).
- [ ] **Step 2:** On "Run delegated", the app calls:

```ts
const modelId = await loadModel({
  modelSrc: MEDPSY_1_7B,                       // local fallback model src (verify symbol)
  modelType: "llm",
  delegate: { providerPublicKey, timeout: 60_000, fallbackToLocal: true },
});
const run = completion({ modelId, history: [{ role: "user", content: "Say which device answered." }], stream: true });
for await (const tok of run.tokenStream) appendToScreen(tok);
```

- [ ] **Step 3: OBSERVE & DECIDE (record in findings):**
  - ✅ **Tokens stream from the laptop** (kill the provider → it should error or `fallbackToLocal`) → **architecture GREEN**. Proceed to full Plan 2 (phone↔laptop).
  - ⚠️ **Connects only on same LAN, not over DHT/internet** → acceptable; note "LAN delegation" as the demo setup.
  - ❌ **DHT/delegation does not run in the mobile Bare runtime** → **FALLBACK branch**: phone runs MedPsy-1.7B on-device only; reframe P2P demo as laptop↔laptop two-process or drop to Psy+Mobile on-device story. Project still ships.

---

## Phase F — Secondary probes (engineer, ~1 h, can overlap E)

- [ ] **F1 — OCR quality:** once the operator provides a sample report (Phase G), write a tiny `provider/src/ocr-probe.ts` calling `ocr()` (`@qvac/ocr-onnx`) on the image; judge extraction quality on the report's table layout. If poor → note VLM (SmolVLM2 + mmproj via `completion` attachments) as the extraction path. Record.
- [ ] **F2 — Profiler/evidence:** in any spike script, call `profiler.enable()`, run a completion, `profiler.exportJSON()` / `exportTable()`. Confirm it yields TTFT + tokens/sec + load events. This validates the evidence-bundle source. Save a sample export to `evidence/`.
- [ ] **F3 — QR pairing:** confirm a public key can be rendered as a QR on the laptop and scanned by the phone (feasibility note only).

---

## Phase G — Operator parallel checklist (Ste, non-code, Day 1)

Drafts/copy provided by engineer; operator executes:
- [ ] Register on DoraHacks; create the project page (solo).
- [ ] Join the Tether/QVAC Discord; **ask:** (1) exact evidence-bundle format + the 3-stage process, (2) real early-bird date (Jun 14 vs 17).
- [ ] Post **build-in-public tweet #1** from @Stetang3438 with the team #hashtag, tagging @QVAC (engineer drafts it).
- [ ] Provide a **sample lab/checkup report** image (yours or anonymized) → drop into `spikes/` (gitignored if real).
- [ ] Confirm **team #hashtag** + **final product name** (working: Aegis).

---

## Decision Gate → Plan 2

After Phase E/F, the findings file states the architecture branch (GREEN / LAN / FALLBACK) and the **real verified SDK signatures**. Use those to write `docs/superpowers/plans/2026-06-1X-aegis-plan-2-*.md` with full bite-sized TDD detail.

## Milestone roadmap D2–D8 (expanded into detailed plans post-spike)

- **D2 — Vertical slice:** phone text query → delegated MedPsy-4B → streamed answer + metrics logged. *Accept:* on-screen answer + a JSON log row with TTFT/tok-s/device.
- **D3 — Hero intake:** photo → OCR (or VLM) → MedPsy explanation + out-of-range flags + injection-safe prompt assembly. *Accept:* real report → correct plain-language explanation; injection test blocked.
- **D4 — RAG record:** `embed`/`ragIngest`/`ragSearch`, encrypted local store, cross-history follow-up. *Accept:* two reports ingested → trend question answered from history.
- **D5 — Resilience:** phone-local fallback + provider drop/resume; full hero end-to-end. *Accept:* kill provider mid-run → graceful local degrade.
- **D6 — Evidence bundle:** logger, `scripts/standard-demo-run`, `remote-apis.json`, README, reproducibility, hardware capture. *Accept:* one command reproduces a clean log; README runs on a fresh machine.
- **D7 — Polish + video:** metrics panel UX; record ≤5-min demo (operator films phone; engineer scripts/edits screen capture). *Accept:* uploaded unlisted YouTube link.
- **D8 — Submit (buffer):** final QA + DoraHacks submission + closing tweets. *Accept:* submitted before Jun 17 target.

---

## Self-review

- **Spec coverage:** repo/license/disclosure (spec §1,§10) → A1; SDK + MedPsy (spec §8) → B,C; P2P delegation (spec §6) → D,E; OCR (spec §5) → F1; profiler evidence (spec §10) → F2; pairing (spec §6) → F3; operator/legal (spec §16,§17) → G; D2–8 product (spec §5,§7,§11) → roadmap. **No gap for Day 1.**
- **Placeholders:** SDK snippets are marked "verify on first run" (honest unknowns, not lazy TBDs); provider params are an explicit spike question, not a hidden gap.
- **Consistency:** model roles (1.7B phone / 4B laptop) and symbol names match the spec; `fallbackToLocal`, `startQVACProvider`, `loadModel({delegate})`, `profiler` all per verified research.
