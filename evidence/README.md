# Evidence bundle

Material for the QVAC 3-stage verification. Everything here supports the claim that Aegis
runs AI fully on-device via `@qvac/sdk`, with zero runtime cloud calls.

| File | What it proves |
|---|---|
| [`on-device-inference.md`](on-device-inference.md) | A streamed completion ran on the physical iPhone GPU (TTFT 432 ms · 44.6 tok/s · Metal). |
| [`hardware.md`](hardware.md) | The exact phone + laptop the app was built and verified on. |
| [`profiler-sample.json`](profiler-sample.json) / [`.txt`](profiler-sample.txt) | `@qvac/sdk` profiler output (load/TTFT/tok-s) from the laptop product core. |
| [`audit-log.json`](audit-log.json) / [`.txt`](audit-log.txt) | Structured audit log of a demo run: model load/unload + inference perf (TTFT, tokens, tok/s, backend), from the SDK's request-lifecycle + CompletionStats. |
| [`../remote-apis.json`](../remote-apis.json) | Disclosure of every network call — all build/setup-time; zero runtime AI calls. |
| [`../docs/screenshots/`](../docs/screenshots/) | The shipped UI (Home, Explanation, P2P pairing). |

## The demo, in five steps

1. **Open** Aegis — Home shows recent reports and the "on-device" badge.
2. **Paste / sample** a lab report on the Intake screen and tap *Explain this report*.
3. **Read** the Result screen: a plain-language summary + each out-of-range value with its exact
   reference range and an accurate, offline explanation — and a provenance line proving where it ran.
4. **Ask** a follow-up across your history.
5. **Pair** a laptop and tap *Go deeper* to delegate to MedPsy-4B over an encrypted peer link.

## Reproduce

- Browser demo: `cd app && npm install && npx expo start --web`
- On device: `cd app && npx expo run:ios --device`
- Provider: `cd provider && npx tsx src/provider.ts`
- Tests: `cd app && npx vitest run` (48) · `cd shared && npm test` (73)
