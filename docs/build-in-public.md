# Build-in-Public — ready-to-post drafts

For X / @Stetang3438. Tag the hackathon + QVAC/Tether. Suggested hashtags: `#EdgeAI #ondevice #QVAC`.
Attach the screenshots in `docs/screenshots/` (and a short screen-recording for the launch post).

---

## Launch thread

**1/**
Lab reports are scary walls of numbers. The "easy" fix — paste them into a cloud chatbot — means handing your most private data to someone else's servers.

So I built **Aegis**: a health copilot that explains your labs in plain language, 100% on your own device. 🧵 #QVAC #EdgeAI

**2/**
Snap/paste a lab report → Aegis reads it, explains it like a human, and flags what's out of range — with the exact reference ranges.

Numbers + ranges are parsed deterministically (never hallucinated). The on-device model only writes the plain-English summary. Accuracy by construction.

**3/**
Everything runs locally via @qvac/sdk. **Zero runtime cloud calls** — the core flow works in airplane mode. Your medical data never leaves your hands.

Verified on a physical iPhone: on-device GPU inference at **432 ms to first token · 44.6 tok/s** (Metal). 🔥

**4/**
The signature trick: **borrow a bigger brain.** Your phone runs a small MedPsy model offline. Pair a nearby laptop and Aegis delegates the heavy reasoning to the larger MedPsy-4B over a direct, encrypted peer-to-peer link — still no cloud.

**5/**
Design matters for trust in health. Aegis is "calm clinical · light luxury" — Fraunces + Inter, a warm palette, real data-viz for every flagged value.

Open-source (Apache-2.0). Built for QVAC Hackathon I — Unleash Edge AI. More soon. 🛡️

---

## Standalone posts

**On-device proof**
> "Does the model actually run on the phone?" Yes. Aegis runs a streamed LLM completion entirely on an iPhone GPU via @qvac/sdk — 432 ms TTFT, 44.6 tok/s, 0 network calls. Edge AI is here. #ondevice #QVAC

**Privacy angle**
> Your lab results are some of the most sensitive data you have. Aegis explains them in plain language without a single one ever leaving your device. Private by architecture, not by promise. #EdgeAI

**Delegation**
> Phones are small. Laptops are bigger. Aegis lets your phone *borrow* the bigger MedPsy model on your own laptop over an encrypted peer link — on-device when alone, more powerful when paired. No cloud either way. #QVAC

---

_Disclaimer to keep in replies/profile: Aegis is health education, not medical diagnosis._
