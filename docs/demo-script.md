# Aegis — Demo Video Shot List (FINAL · ≤ 5:00)

**Title:** Aegis — Private, Offline Health Copilot
**Audience:** QVAC hackathon judges
**Hard cap:** 5:00 — this script budgets to **~4:45**.
**This is the verified-reality cut.** Everything below was confirmed on the physical iPhone 15 Pro Max (Release build) on 2026-06-14:
- On-device inference works and the explanation is **accurate** (flag directions match the cards).
- Airplane-mode (fully offline) explanation works.
- "Go deeper" P2P delegation **attempts a real encrypted peer link and gracefully falls back to on-device** when the mobile return-path is unstable. The laptop provider **does** receive and run the delegated request (proven in its terminal) — so the architecture is real; we show that proof and never fake a phone-side round-trip.

> **Honesty rules baked in:**
> - The on-device model is **Llama-3.2-1B** via `@qvac/sdk`. Say **"the on-device engine,"** not "MedPsy on the phone." (MedPsy-4B is the laptop/bigger-brain model.)
> - **Accuracy comes from construction:** values, units and reference ranges are parsed **deterministically** (never hallucinated) and flag explanations come from a **curated offline knowledge base**; the model writes the plain-language summary *from those authoritative findings*. Say exactly that.
> - Use the **"0 network calls"** badge ONLY over local / airplane-mode shots — never over a delegated/peer shot (P2P does cross the network to your own laptop).
> - Never show a phone-side delegated completion that didn't happen. The bigger-brain proof is the **laptop provider terminal** + the **graceful fallback** on the phone.

---

## Pre-production checklist

**Hardware / state**
- [ ] iPhone 15 Pro Max, **Auto-Lock = Never** (Settings → Display & Brightness → Auto-Lock → Never).
- [ ] Phone **Focus/DND on**; clear notification banners.
- [ ] Aegis on the phone is the **Release build** (accurate + graceful-fallback version) — already installed.
- [ ] Laptop (**MacBook Pro M4, 16 GB**) provider running and framed legibly:
      `cd provider && npx tsx src/provider.ts` → confirm it prints `PROVIDER_PUBLIC_KEY=…` and `Provider is listening`.
- [ ] **For the "MedPsy-4B bigger brain" shot to be literally true:** run the provider against the local MedPsy-4B weights (`provider/models/medpsy-4b-q4_k_m-imat.gguf`) and demonstrate a **laptop↔laptop delegated completion** (the verified Node path) in a second terminal — this is the truthful "bigger brain on the wire" proof. If you keep the provider on Llama-1B, narrate "the bigger model on my laptop" generically and don't claim MedPsy-4B numbers.
- [ ] Sample report ready via the app's **"load sample"** button (synthetic, non-PHI).
- [ ] Airplane-mode gesture rehearsed (Control Center → airplane icon → Wi-Fi + cellular dark).

**Capture**
- **Phone:** iOS Screen Recording (Control Center), 1080p/60.
- **Laptop:** `Shift+Cmd+5` for the provider terminal.
- **Voiceover:** record narration separately and lay over the captures — tighter, hits the time budget.

**Overlays to prepare**
- "0 network calls" badge — local/airplane shots only.
- "On-device · iPhone 15 Pro Max GPU" lower-third (let the app's own provenance line show the live ms).
- "Apache-2.0 · all AI via @qvac/sdk" end card.
- "Synthetic sample — not a real patient" persistent corner tag whenever a report is on screen.

---

## Shot-by-shot timed table

| Timestamp | On-screen | Spoken narration (verbatim) |
|---|---|---|
| **0:00–0:18** HOOK | Talking-head, OR a screen-grab of a generic cloud chatbot with a lab-report image pasted in; add a subtle red "uploaded to a server" overlay (blur the bot's name). | "Your blood test comes back full of numbers you can't read. The easy fix is to paste it into a cloud chatbot — and now your most private medical data lives on someone else's server. It shouldn't have to be that way." |
| **0:18–0:34** INTRO | **Phone** — Aegis **Home**: "Understand your labs" hero, the *Scan report* / *Paste text* tiles, the *Borrow a bigger brain* card, a recent "Lab panel" tile. | "This is Aegis — a private health copilot that reads your labs, explains them in plain language, and flags what matters, entirely on your own device." |
| **0:34–0:52** INTAKE | **Phone** — tap **Paste text** → **load sample** (keep the "synthetic" corner tag) → tap **Explain this report.** | "I'll load a sample report — synthetic, not a real patient — and tap Explain. From here, everything runs on the phone." |
| **0:52–1:38** RESULT (the core) | **Phone** — **Result** screen. Scroll slowly: the **plain-language summary** at top, then the flagged cards — **Hemoglobin 11.2 (ref 13.5–17.5) — Low**, **Fasting Glucose 7.8 (ref 3.9–5.5) — High**, **LDL 4.1 (ref < 3.0) — High** — each with its range bar + curated note. End on the **provenance line** (engine · ms · gpu · 0 network calls). | "Three values are flagged — hemoglobin low, fasting glucose high, LDL high. Here's the important part: the numbers and the in-range/out-of-range calls are computed **deterministically** — never guessed by a model — and the explanations come from a curated medical knowledge base. The on-device engine only writes the plain-language summary, *from those verified findings* — so the prose can't contradict the data. And the line at the bottom: it ran on the phone's GPU, with zero network calls." |
| **1:38–2:18** PRIVACY PROOF | **Phone** — Control Center → **airplane mode** (show Wi-Fi + cellular go dark) → back to app → run an explanation again → it still works → hold on **"0 network calls"** + overlay the badge. | "Now the real test — airplane mode. Wi-Fi off, cellular off, fully offline. Explain again… and it still works. Same flags, same explanation, zero network calls. The core flow runs in airplane mode by design — and our `remote-apis.json` lists every call the project makes; not one is AI inference." |
| **2:18–2:40** CROSS-HISTORY Q&A | **Phone** — **History** ("stored on this device") → **Ask** → tap a prompt like **"Any trends?"** → show the answer + provenance. | "Everything you analyze is saved — encrypted, on this device — so you can ask across your history. 'Any trends?' It answers from your own stored reports. Your records, your questions, your device." |
| **2:40–3:40** BORROW A BIGGER BRAIN (architecture, honest) | **Split:** (1) **Laptop terminal** — the provider printing `PROVIDER_PUBLIC_KEY` and, in a second terminal, a **delegated completion streaming** between two local nodes (the verified Node path) — tokens flowing, "delegated" in the logs. (2) **Phone** — **Pair** screen, paste the key, **Connect**, then **Go deeper**. When the mobile return-path is unstable, the app shows **"explained on-device instead"** and still returns an accurate result. | "On-device is great for the everyday read. For a deeper analysis you'd normally hit the cloud — Aegis instead borrows a bigger model on a device you already own, over a **direct, encrypted peer link**. Here's my laptop receiving that delegated request and streaming the answer back over the link — no server in the middle. On the phone you pair with a key and tap Go deeper; and if that peer link isn't reachable, Aegis **falls back to on-device automatically** — you always get your answer, never the cloud." |
| **3:40–4:20** CLOSE — proof + tracks | **Cut sequence:** (1) lower-third over a phone result: **"On-device · iPhone 15 Pro Max GPU · 0 network calls"** (the app's provenance shows the live ms; evidence bundle records 432 ms TTFT · 44.6 tok/s on the spike); (2) `LICENSE` (Apache-2.0) + README showing `@qvac/sdk`; (3) four track cards. | "Aegis is open source under Apache-2.0, and every bit of AI runs through the QVAC SDK — on the phone's GPU, sub-second to first token, with zero network calls. It spans four tracks: Psy models, Mobile, General Purpose, and Build-in-Public." |
| **4:20–4:35** SIGN-OFF | Talking-head or Home hold; end card: name, tagline, repo, Apache-2.0. | "Aegis. Your labs, read and explained — entirely on the devices you already own. Private by default. Thanks for watching." |

**Total: ~4:35.**

---

## What is true to claim (say these; avoid the rest)

**Verified — claim freely:**
- Reads/explains/flags a lab report **on-device**; data never leaves the device for the core flow.
- Numbers, units, ranges parsed **deterministically** (never hallucinated); flag notes from a **curated offline KB**; the model summarizes **from authoritative findings** so prose matches the cards. *(This is the accuracy story — it's real and it's the strongest point.)*
- Runs in **airplane mode**; **0 runtime cloud AI calls** (`remote-apis.json` → `ai_inference_remote_calls: []`).
- On-device GPU inference on iPhone 15 Pro Max (evidence: **432 ms TTFT · 44.6 tok/s · gpu**; full app measured ~741 ms — either is honest, just match what's on screen).
- The provider **receives and runs delegated requests over the encrypted peer link** (show the terminal). Delegation over Hyperswarm is **verified laptop↔laptop**.
- Open source **Apache-2.0**; all AI via **@qvac/sdk**; four tracks.

**Do NOT claim:**
- "MedPsy runs on the phone" — the phone engine is Llama-3.2-1B. (MedPsy-4B is the laptop model.)
- A **completed phone-side delegated round-trip** — it gracefully falls back instead; show the laptop-side proof + the fallback, not a fake phone completion.
- "0 network calls" during any delegated/peer shot.
- Specific MedPsy-4B accuracy numbers unless you actually ran MedPsy-4B and can show it.

---

## One-line framing for judges (use in the video description too)

> Aegis explains your lab reports privately and accurately on your own device via @qvac/sdk — deterministic flagging + on-device plain-language summaries, working in airplane mode — and can borrow a bigger model on your own laptop over an encrypted peer link, falling back to on-device automatically. No cloud, ever.
