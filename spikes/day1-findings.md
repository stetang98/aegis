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
- [ ] MedPsy-4B `modelSrc` method (built-in const / HF download / hyperdrive key): ____
- [ ] explanation quality on a pasted lab result: ____  tok/s: ____

## D — Provider
- [ ] provider model-serving semantics (preload vs consumer-driven): ____
- [ ] `startQVACProvider` real params + return shape: ____  publicKey captured? ____

## E — CRUX: phone delegates to laptop
- [ ] Expo prebuild + on-device install OK? errors: ____
- [ ] delegated `loadModel({delegate})` + `completion` streamed tokens FROM laptop? ____
- [ ] **BRANCH DECISION:** GREEN (DHT) / LAN-only / FALLBACK(local-only) → ____

## F — Secondary probes
- [ ] `ocr()` extraction quality on real report: ____  (VLM fallback needed? ____)
- [ ] `profiler` exports TTFT + tokens/sec + load events? sample saved to evidence/? ____
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
