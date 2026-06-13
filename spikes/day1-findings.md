# Day 1 Spike Findings (the deliverable that feeds Plan 2)

Fill verified facts + real SDK signatures + corrections here as you go.

## Environment (verified 2026-06-13)
- **Laptop:** MacBook Pro `Mac16,1`, Apple **M4**, 10 cores (4P/6E), **16 GB** RAM, macOS **26.1** (build 25B78). Metal GPU available. → General Purpose track main device.
- **Node:** v24.12.0 (via nvm). ≥22.17 OK. ⚠️ Node 24 is newer than docs' floor — watch native-addon prebuild compatibility; `nvm use 22` is the fallback.
- **npm:** 11.6.2 · **git:** 2.50.1.
- **Phone:** _TBD — operator to provide model + iOS/Android version (must be iOS 17+/Android 12+, physical device)._

## B — SDK install + local smoke (laptop) ✅ PASS
- ✅ `@qvac/sdk@0.12.2` installed cleanly on M4 / Node 24.12 (prebuilt native addons worked; no compile).
- ✅ `loadModel` / `completion` / `unloadModel` work; `completion().tokenStream` streams `string` (matches .d.ts).
- ✅ Smoke: loaded `LLAMA_3_2_1B_INST_Q4_0`, streamed a completion, clean unload + worker shutdown.
- **Metrics (M4, 1B Q4_0):** TTFT **521ms**, 7 tokens, **~48.6 tok/s**. Load incl. 773MB download ≈ 6.5 min (one-time).
- **Model cache:** `~/.qvac/models/<hash>_Llama-3.2-1B-Instruct-Q4_0.gguf`, downloaded from `registry:hf:unsloth/Llama-3.2-1B-Instruct-GGUF`.
- **Architecture note:** even LOCAL inference runs via a **Bare worker process + RPC client/server** (`[sdk:server]`/`[sdk:client]`). → local vs delegated is the same RPC with a different transport; good for our P2P plan.

## C — MedPsy local
- ✅ **MedPsy is NOT in the QVAC registry** (801 entries; med/psy matches are all MedGemma). Source = **Hugging Face**.
- ✅ GGUF files confirmed: `qvac/MedPsy-1.7B-GGUF` → `medpsy-1.7b-q4_k_m-imat.gguf` (phone); `qvac/MedPsy-4B-GGUF` → `medpsy-4b-q4_k_m-imat.gguf` (laptop). Also q5_k_m/q8_0/iq3/iq4/bf16. Non-GGUF repos hold safetensors only.
- ✅ `modelSrc` = `string | { src, name?, modelId?, registryPath?, registrySource? }` (`modelSrcInputSchema`) → load local GGUF by absolute path string.
- Plan: `curl` GGUF → `provider/models/`, `loadModel({ modelSrc: "<abs path>", modelType: "llm" })`. (Verify bare-path-string resolves as local file at runtime.)
- ⚠️ MedPsy = Qwen3-**Thinking** base → expect `<think>…</think>` blocks; strip/handle in Plan 2.
- ✅ runtime: MedPsy-1.7B loads from local path (2.2s) + streams. Output FORMAT excellent (plain language, disclaimers, "ask your doctor", structured). modelSrc-as-local-path WORKS.
- 🔴 **MedPsy-1.7B medical ACCURACY unreliable**: called fasting glucose **7.8 mmol/L "fine"** (elevated/diabetic-range, ref 3.9-5.5) and LDL **4.1 "low/good"** (ABOVE target <3.0). Only caught low hemoglobin. → **1.7B is NOT safe as the authoritative medical brain.**
- 🔴 **CONTEXT_OVERFLOW (code 52421)**: thinking model's verbose `<think>`+answer exceeded the default context window mid-generation (prompt was tiny). → must raise context window in loadModel; consider hiding/limiting `<think>`.
- **DESIGN IMPACT:** medical reasoning MUST use **MedPsy-4B** (downloading; verify it flags glucose/LDL correctly). 1.7B → only a basic/offline tier, never the final flagger. The 1.7B-vs-4B accuracy gap (if 4B is correct) is a *strong honest argument for P2P delegation* in health.

## D — Provider
- ✅ `startQVACProvider(params?: ProvideParams): Promise<{ type:"provide", success, error?, publicKey? }>` — params optional; returns `publicKey`.
- ✅ `stopQVACProvider(): Promise<{ success, error? }>`.
- [ ] runtime: start provider, capture publicKey; confirm serve semantics (does `ProvideParams` select the model, or serve whatever's loaded?).

### Delegation API (CORRECTED vs earlier research)
- delegate option = `{ providerPublicKey: string, timeout?: number, healthCheckTimeout?: number }` (`schemas/common.d.ts`, `heartbeat.d.ts`).
- ⚠️ **No `fallbackToLocal` / `forceNewConnection`** in the real schema — the research/docs assumption was WRONG. → implement graceful fallback **manually**: catch `DELEGATE_CONNECTION_FAILED` (53701) / `DELEGATE_PROVIDER_ERROR` (53702) → reload the model locally. **Spec §6 `fallbackToLocal` snippet to be corrected in Plan 2.**
- `heartbeat({ delegate })` probes a provider. Error codes: `MODEL_IS_DELEGATED 52004`, `DELEGATE_NO_FINAL_RESPONSE 53700`, `DELEGATE_CONNECTION_FAILED 53701`, `DELEGATE_PROVIDER_ERROR 53702`, `MODEL_FILE_NOT_FOUND 52201`.

## E — CRUX: delegation
### E0 — Node↔Node delegation (laptop, two processes) ✅ PASS
- provider published a 64-hex public key; consumer `loadModel({ delegate:{ providerPublicKey, timeout } })` in **5.2s** → `completion()` streamed "delegated hello" from the provider; provider logged the delegated completion. **Delegation RPC over Hyperswarm DHT works end-to-end on Node.**
- → The delegation MECHANISM is proven. `loadModel` type-accepts `delegate`. `QVAC_HYPERSWARM_SEED` can pin the provider key.
### E1 — phone (Expo/Bare) as consumer  (needs physical device + operator)
- [ ] Expo prebuild + on-device install OK?
- [ ] delegated `loadModel({delegate})` + `completion` streams from laptop INSIDE the Bare/Expo mobile runtime?
- [ ] **BRANCH DECISION:** GREEN (mobile DHT delegation) / LAN-only / FALLBACK (on-device MedPsy-1.7B) → ____

## F — Secondary probes
- [ ] `ocr()` extraction quality on real report: ____  (needs operator sample report; VLM fallback = SmolVLM2+mmproj)
- ✅ **`profiler` PASS** — `enable({ mode:"verbose" })` → `exportJSON({ includeRecentEvents:true })` + `exportTable()`. Yields `completionStream.ttfb` (TTFT), `completionStream.streamDuration`, `completionStream.modelExecutionTime`, `loadModel` breakdown (checksum/init/serverWait), `rpc.connection`. Sample → `evidence/profiler-sample.{json,txt}`. **This is the evidence-bundle source; Plan 2 metrics logger wraps it.** Cached load = 2.71s.
- API: `profiler.enable/disable/isEnabled/exportJSON/exportTable/exportSummary/getAggregates/onRecord/clear`.
- [ ] QR pairing feasible? ____

## Real verified SDK exports (runtime introspection of @qvac/sdk@0.12.2, 2026-06-13)
entry: `dist/index.js` (ESM), types: `dist/index.d.ts`.

Confirmed function exports (exact names):
- **LLM/core:** `loadModel`, `unloadModel`, `completion`, `embed`, `cancel`, `suspend`, `resume`, `state`, `close`, `getLoadedModelInfo`, `getModelInfo`, `getModelBySrc/Name/Path`
- **OCR:** `ocr`
- **RAG (workspace-based):** `ragIngest`, `ragSearch`, `ragChunk`, `ragSaveEmbeddings`, `ragReindex`, `ragListWorkspaces`, `ragCloseWorkspace`, `ragDeleteEmbeddings`, `ragDeleteWorkspace`
- **P2P:** `startQVACProvider`, `stopQVACProvider`, `heartbeat`
- **speech:** `transcribe`, `transcribeStream`, `textToSpeech`, `textToSpeechStream`
- **other:** `finetune`, `translate`, `classify`, `diffusion`, `video`, `upscale`, `vla`, `profiler`, `modelRegistryList/Search/GetModel`, `downloadAsset`, `deleteCache`
- **errors to catch:** `ContextOverflowError`, `InferenceCancelledError`, `RequestRejectedByPolicyError`, `RequestNotFoundError`, `RequestIdConflictError`, `WorkerCrashedError`, `WorkerShutdownError`
- **types/consts:** `ModelType`, `MODEL_TYPES`, `SDK_DEFAULT_PLUGINS`, `VERBOSITY`, `TOOLS_MODE`

### Model constants (built-in; load anything else by GGUF src/path)
- **LLM:** `LLAMA_3_2_1B_INST_Q4_0` (smoke), `QWEN3_1_7B_INST_Q4`, `QWEN3_4B_INST_Q4_K_M`, `LLAMA_TOOL_CALLING_1B_INST_Q4_K`
- **Embeddings (RAG):** `EMBEDDINGGEMMA_300M_Q4_0` / `_Q8_0`  ← use for RAG
- **OCR:** `OCR_0_6B_MULTIMODAL_Q4_K_M` (+`MMPROJ_OCR_0_6B_MULTIMODAL_F16`), or classic `OCR_DETECTOR_DB_RESNET50` + `OCR_LATIN_RECOGNIZER`
- **VLM (report-image fallback):** `QWEN3VL_2B_MULTIMODAL_Q4_K` (+mmproj), `SMOLVLM2_500M_MULTIMODAL_Q8_0`
- **Medical:** ⚠️ **MedPsy is NOT built-in.** `MEDGEMMA_4B_IT_Q4_1` / `_Q8_0` IS built-in. → load MedPsy-4B/1.7B GGUF by local path (HF download) or try `modelRegistrySearch("MedPsy")`; MedGemma as built-in medical backup.
- **TTS:** `TTS_EN_SUPERTONIC_Q4_0` · **STT:** `WHISPER_*` / `PARAKEET_*`

### Type shapes confirmed from .d.ts (2026-06-13)
- ✅ `CompletionRun.tokenStream: AsyncGenerator<string>` (`schemas/completion-event.d.ts:221`) + `events`, `final`, `requestId`.
- ✅ Typed: `LoadModelOptions`, `CompletionParams`, `OCROptions`/`OCRTextBlock`/`OCRClientParams`, `RagSearchResult`, `Attachment`, `ProfilerMode`/`ProfilerRuntimeOptions`/`ProfilerExport`, `FinetuneParams`; `DelegateOptions` + `load-model-delegated`/`completion-stream-delegated` handlers exist (delegation real).
- ✅ Built-in model constants declared in `models/registry/models.d.ts` (e.g. `LLAMA_3_2_1B_INST_Q4_0` @ line 18678).

### ⚠️ SDK typing gap (Plan 2 action item)
Model constants are exported at RUNTIME (confirmed via `Object.keys`) but the package-entry `.d.ts` does NOT surface them → `tsc` TS2305. Spike workaround: split import + `@ts-expect-error`. **Plan 2: build a typed `models.ts` wrapper** (or pass `modelSrc` via string / `getModelByName`) so production code stays clean.

### TypeScript setup (verified working)
`typescript@6.0.3` + `@types/node@25.9.3` + `tsx@4.22.4`. tsconfig needs `"lib":["ES2022"]` + `"types":["node"]` for Node globals under `NodeNext`. → `smoke.ts` is **tsc clean**.

### Still to verify at RUNTIME (smoke run in progress)
- [ ] loadModel downloads + loads LLAMA-1B on M4
- [ ] completion streams tokens; record TTFT / tok-s
- [ ] `startQVACProvider` params + `{publicKey}` return (Phase D)
- [ ] `profiler.enable` / `exportJSON` exact methods (Phase F2)
