# Evidence — on-device inference verified on the physical iPhone

The single most important risk for an edge-AI app is "does the model actually run on the phone?"
It does. A minimal spike (`app/` git history) loaded a model through `@qvac/sdk` and ran a streamed
completion entirely on the iPhone 15 Pro Max — no network, GPU-backed.

## Result (read off the device)

```
✅ LOCAL — TTFT 432 ms · tokens 16 · 44.6 tok/s · backend: gpu
```

| Metric | Value | Meaning |
|---|---|---|
| Model | `LLAMA_3_2_1B_INST_Q4_0` (registry) | proven loadable + runnable on device |
| Time to first token | **432 ms** | snappy on-device latency |
| Throughput | **44.6 tok/s** | usable interactive speed |
| Backend | **gpu** | running on the A17 Pro GPU via Metal, not CPU |
| Network | none | model fetched once at first run; inference is fully local |

The product uses **MedPsy** for medical accuracy (and delegates to laptop **MedPsy-4B** for deeper
reads); this spike isolates and proves the on-device execution path itself. Llama-1B was used because
it is in the SDK registry and downloads automatically — keeping the spike small.

## How it was produced

1. `npx expo run:ios --device <iPhone>` built and installed a two-button spike.
2. Tapping **Run LOCAL** called `loadModel({ modelSrc, modelType:"llm", modelConfig:{ device:"gpu", ctx_size } })`
   then streamed `completion({ modelId, history, stream:true })`, reporting `final.stats`
   (`timeToFirstToken`, `tokensPerSecond`, `backendDevice`).
3. The on-screen result above was read directly from the device.

> Reproduce: build the app on a physical iPhone and run a local explanation; the Result screen's
> provenance line surfaces the same `@qvac/sdk` stats (`Explained by … · <ttft> ms · gpu · 0 network calls`).
