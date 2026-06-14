# Hardware

The two devices used to build and verify Aegis. All inference runs on these — no cloud, no clusters.

## Phone (on-device inference + P2P consumer)

| | |
|---|---|
| Device | iPhone 15 Pro Max (`iPhone16,2`) |
| Chip | Apple A17 Pro (6-core GPU, Metal) |
| OS | iOS 26.5 |
| Role | Runs the Aegis app; on-device MedPsy / LLM via `@qvac/sdk`; P2P delegation consumer |

## Laptop (build host + P2P provider)

| | |
|---|---|
| Model | MacBook Pro |
| Chip | Apple M4 |
| Memory | 16 GB |
| OS | macOS 26.1 (build 25B78) |
| Toolchain | Xcode 26.0 · Node 24.12 · `@qvac/sdk` 0.12.2 |
| Role | Builds the iOS app; runs the Node provider (MedPsy-4B) for delegated inference |

> Specs captured via `system_profiler` / `sysctl` / `sw_vers` / `xcodebuild -version` on the build host.
