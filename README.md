# Aegis — Private, Offline Health Copilot

> Snap a photo of a lab/checkup report → on-device OCR extracts it → **MedPsy** explains it in plain language and flags out-of-range values → it's saved to a local, encrypted health record you can question across time. **Your medical data never leaves your own devices.** Built on `@qvac/sdk` for the QVAC Hackathon I — Unleash Edge AI.

> ⚠️ Education and personal insight only — not medical diagnosis.

<!-- Sections below are filled during Day 6 (evidence/reproducibility). Skeleton only for now. -->

## Tracks
Psy Models (primary) · Mobile · General Purpose · Build in Public

## Hardware
_TBD — system profiler specs for laptop + phone (see `evidence/hardware.md`)._

## Architecture
Phone (Expo/React Native, MedPsy-1.7B local + P2P consumer) ↔ Laptop (Node provider, MedPsy-4B) over QVAC P2P (Hyperswarm DHT). See `docs/superpowers/specs/`.

## Setup — Laptop (provider)
_TBD._

## Setup — Phone (Expo, physical device only)
_TBD._

## Models
MedPsy-1.7B-GGUF (phone) · MedPsy-4B-GGUF (laptop) · OCR · embeddings. _Download instructions TBD._

## Run the demo
_TBD — `scripts/standard-demo-run`._

## Evidence bundle
Profiler-sourced logs (TTFT / tokens-per-sec / model load-unload), demo video, hardware proof. _See `evidence/`._

## Reproducibility
_TBD — out-of-the-box steps for both devices._

## Remote API disclosure
See [`remote-apis.json`](./remote-apis.json) — zero runtime remote calls.

## License
[Apache-2.0](./LICENSE).
