# Aegis — Demo Video Shot List (≤ 5:00)

**Title:** Aegis — Private, Offline Health Copilot
**Audience:** QVAC hackathon judges
**Hard cap:** 5:00 (this script budgets to **4:52** to leave headroom)
**Two believability goals:** (a) it genuinely runs on-device / private; (b) phone→laptop delegation is a real differentiator.

> Honesty note baked into this script: every shot that depends on a feature not yet verified on a physical device is tagged **[NEEDS: … verified before filming]** and ships with a **FALLBACK** that uses only verified surfaces (the web demo, or laptop↔laptop Node delegation). No spoken line claims anything the app can't currently back up. Where the on-device model is the verified Llama-1B proxy (not MedPsy), the narration says "the on-device engine," not "MedPsy on your phone." Where a result is **delegated** over P2P, the narration says "no cloud," **never** "zero network calls" — because P2P does cross the network to the user's own laptop (Hyperswarm DHT bootstrap + blind relays, per `remote-apis.json`).

---

## Pre-production checklist

**Hardware / state**
- [ ] iPhone 15 Pro Max, iOS 17+, **Auto-Lock = Never** (Settings → Display & Brightness → Auto-Lock → Never) so the screen never dims mid-take.
- [ ] Phone **Do Not Disturb / Focus = on**; clear notification banners; hide the cell-carrier/personal info if visible.
- [ ] Laptop (**MacBook Pro M4, 16 GB** — the verified machine; the General Purpose track envelope is laptop ≤32 GB) with the provider running before you start: `cd provider && npm install && npx tsx src/provider.ts` — confirm it **prints the 64-hex public key**. Keep that terminal window framed and legible.
- [ ] Sample report ready: `fixtures/synthetic-lab-report.txt` (synthetic, non-PHI). Have it loadable via the app's "load sample" path AND copyable to clipboard as a paste fallback.
- [ ] Airplane-mode toggle rehearsed: swipe Control Center, tap airplane icon, confirm Wi-Fi + cellular both off. Practice the gesture so it reads clearly on camera.
- [ ] Web demo warm in a browser as the universal fallback: `cd app && npm install && npx expo start --web`.
- [ ] Decide per shot which surface you're filming (phone vs web vs laptop) based on what is verified on the day — see the [NEEDS] tags below.

**Capture method**
- **Phone:** iOS built-in Screen Recording (Control Center → Record), 1080p/60. Mirror to the Mac via QuickTime ("New Movie Recording" → select iPhone) only if you also want a clean hardware-framed shot; the on-device recording is the primary asset.
- **Laptop:** macOS screen capture (`Shift+Cmd+5`) for the provider terminal and any web-demo browser shots.
- **Talking-head (optional):** webcam at 1080p; keep to the two short bookend moments only.
- Record all audio narration separately (voiceover) and lay it over the captures — tighter than live talking, and lets you hit the 4:52 budget exactly.

**Banner / lower-third overlays to prepare**
- "0 network calls" badge (use ONLY over local / airplane-mode shots, never over a delegated result)
- "Verified on iPhone 15 Pro Max · 432 ms TTFT · 44.6 tok/s" lower-third (Llama-1B proxy metrics — "on-device engine," not MedPsy)
- "Apache-2.0 · all AI via @qvac/sdk" end card
- "Synthetic sample — not a real patient" persistent corner tag whenever the report is on screen

---

## Shot-by-shot timed table

| Timestamp | On-screen | Spoken narration (verbatim) |
|---|---|---|
| **0:00–0:18** HOOK | **Talking-head** (or screen recording of a generic cloud chatbot web page with a lab-report image being pasted into the prompt box; blur the bot's name). Show the paste, then a subtle red "uploaded to server" overlay. | "Your blood test just came back, full of numbers you don't understand. So you paste it into a cloud chatbot. And now your most private medical data is sitting on someone else's server — used for who-knows-what. That should never have to happen." |
| **0:18–0:33** AEGIS INTRO | **Phone screen recording** — Aegis **HomeScreen**: app icon/title, recent-reports tiles (or empty state), the "scan a report" and "paste text" tiles, and the "Borrow a bigger brain" card. Hold steady. | "This is Aegis — a private, offline health copilot. It reads your lab report, explains it in plain language, and flags what matters — entirely on your own device. Your medical data never leaves your hands." |
| **0:33–0:52** CORE FLOW — intake | **Phone screen recording** — tap "paste text" → **IntakeScreen** modal → tap "load sample" so the synthetic report fills in → keep "Synthetic sample" corner tag visible. Tap **"Explain this report."** <br><br>**[NEEDS: nothing — paste/sample route is verified live.]** | "Let's try it. I'll load a sample lab report — this is synthetic, not a real patient. One tap: 'Explain this report.' Everything from here runs on the phone." |
| **0:52–1:28** CORE FLOW — result | **Phone screen recording** — **ResultScreen** scrolling slowly through flagged values. Pause on **Hemoglobin 11.2 g/dL (ref 13.5–17.5) — LOW**, **Fasting Glucose 7.8 mmol/L (ref 3.9–5.5) — HIGH**, **LDL 4.1 mmol/L (ref < 3.0) — HIGH**. Show the visual range bar and the curated explanation text on one card. Then pan to the **provenance line**. <br><br>**[NEEDS: on-device inference path rendering the ResultScreen on the physical phone. The execution path itself is verified (Llama-1B proxy, 432 ms, 44.6 tok/s, 0 network calls); MedPsy-on-device accuracy is NOT verified — so narrate "the on-device engine," never "MedPsy on your phone."]** <br>**FALLBACK:** film the **ResultScreen on the web demo** (`expo start --web`, full UX verified end-to-end) and change the line "running on the phone's GPU" to "running locally — here in the browser preview, on device in the build." | "Here's the result. Three values are flagged. Hemoglobin's low. Fasting glucose is high — well over the reference range. LDL cholesterol is high too. Every flag shows its exact reference range, a visual bar, and a plain-language explanation — and those explanations come from a curated medical knowledge base, not a model making things up. And see this line at the bottom: the engine, the time to first token, and 'zero network calls.'" |
| **1:28–2:08** PRIVACY PROOF | **Phone screen recording** — from HomeScreen, swipe down Control Center, **tap airplane mode** (show Wi-Fi + cellular going dark), close Control Center. Re-run an explanation on the sample report. Result renders. Hold on the provenance line **"0 network calls."** Overlay the "0 network calls" badge. <br><br>**[NEEDS: on-device explanation completing in airplane mode on the physical phone. The disclosure (`remote-apis.json`, zero runtime AI calls) and the on-device path are verified; an end-to-end airplane-mode run on the phone is the dependency.]** <br>**FALLBACK 1:** show the same airplane-mode toggle on the phone, then run the explanation in the **web demo with the laptop's Wi-Fi off** (DevTools Network tab open showing **no requests**). **FALLBACK 2:** screen-capture `remote-apis.json` (`"ai_inference_remote_calls": []`) and the README disclosure as the proof artifact. | "Now the real test. I'm turning on airplane mode — Wi-Fi off, cellular off. The phone is fully offline. And I'll explain the report again. It still works. Same flags, same explanations, zero network calls. Our disclosure file lists every remote call the project ever makes — and not one of them is AI inference. The core flow runs in airplane mode, by design." |
| **2:08–2:24** HERO SETUP — why delegate | **Phone screen recording** — back online; on ResultScreen tap the **"Go deeper"** card, OR HomeScreen "Borrow a bigger brain." Cut to **PairScreen** with its instructions. | "On-device is great for the everyday read. But sometimes you want a deeper analysis from a bigger model. Most apps would send that to the cloud. Aegis does something different — it borrows a bigger brain from a device you already own." |
| **2:24–2:54** HERO MOMENT — pair | **Split / cut between two captures:** (1) **Laptop screen capture** — provider terminal already printing the **64-hex public key**; (2) **Phone screen recording** — **PairScreen**, paste the key, tap connect, connection-established state. <br><br>**[NEEDS: phone↔laptop P2P delegation over Hyperswarm DHT on the Expo app, verified on the physical iPhone. Delegation RPC is verified laptop↔laptop on Node only; the iOS Expo P2P path is NOT yet verified (design doc tags this the "Mobile P2P consumer unproven" crux).]** <br>**FALLBACK:** show the **laptop provider terminal printing the key** and the **PairScreen UI accepting a key** as separate verified surfaces, then demonstrate the actual streamed delegation **laptop↔laptop on Node** (verified) in a second terminal — narrate it as "here's the same encrypted delegation link, proven between two machines." Do NOT show a fabricated phone-side completion. | "On my laptop, I run the Aegis provider. It prints a public key. I paste that key into the phone — and that establishes a direct, encrypted peer-to-peer link between my two devices. No server in the middle. No account. Just my phone talking to my laptop." |
| **2:54–3:30** HERO MOMENT — go deeper | **Phone screen recording** — tap "Go deeper," watch the heavier MedPsy-4B analysis stream onto ResultScreen with **live metrics** updating; provenance line now reads the app's real delegated string **"encrypted peer link · no cloud."** <br><br>**[NEEDS: MedPsy-4B delegated completion streaming to the physical phone over the P2P link — depends on the same unverified iOS P2P path above, plus MedPsy-4B real-report correctness, which is unverified.]** <br>**FALLBACK:** show the **delegated MedPsy-4B stream on the laptop↔laptop Node demo** (verified transport) with its live tokens-per-second, and frame the phone as the intended client: "this is the deeper analysis streaming over the encrypted link — proven on the wire today, with the phone as the client." Keep all spoken metrics to verified numbers only. **Do not overlay the "0 network calls" badge here** — this is a delegated run. | "Now I tap 'Go deeper.' The heavy analysis runs on the laptop's bigger model and streams back to the phone over that encrypted link — live, token by token. And look: no cloud server anywhere — the data only crosses the encrypted link between the two devices in my hands." |
| **3:30–4:02** CROSS-HISTORY Q&A | **Phone screen recording** — open **HistoryScreen** ("stored on this device" label, flagged-count tags) → tap into **AskScreen**. Tap an example prompt like **"Any trends over time?"** Show question, streamed answer across stored reports, and provenance. <br><br>**[NEEDS: on-device RAG over the encrypted store on the physical phone. AES-256-GCM store + RAG reasoning are verified in `shared/`; on-device MMKV/FileSystem persistence on the phone is NOT verified.]** <br>**FALLBACK:** film AskScreen in the **web demo** (templated-preview Q&A is verified) and narrate "across your encrypted history" without claiming on-phone persistence. | "Everything you analyze is saved — encrypted, on this device. So you can ask across your whole history. 'Any trends?' It answers using your stored reports — retrieved and reasoned over locally — with the same provenance line. Your records, your questions, your device." |
| **4:02–4:38** CLOSE — proof + tracks | **Cut sequence:** (1) lower-third over a phone result: **"Verified on iPhone 15 Pro Max · 432 ms TTFT · 44.6 tok/s · GPU · 0 network calls"** (on-device engine metrics, Llama-1B proxy); (2) screen capture of **`LICENSE` (Apache-2.0)** and **`package.json` / README showing `@qvac/sdk`**; (3) quick montage of the four tracks as text cards. <br><br>**[NEEDS: nothing — these are verified artifacts. The 432 ms / 44.6 tok/s figures are measured with the Llama-1B proxy; keep the lower-third wording as on-device engine metrics, not MedPsy.]** | "Aegis is open source under Apache-2.0, and every bit of AI runs through the QVAC SDK. On-device inference is real and measured: 432 milliseconds to first token, 44 tokens a second, on the phone's GPU, with zero network calls. It spans four tracks — Psy models, Mobile, General Purpose, and Build-in-Public." |
| **4:38–4:52** SIGN-OFF | **Talking-head or HomeScreen hold** with end card: app name, tagline, repo handle, Apache-2.0. | "Aegis. Your lab report, read and explained — entirely on the devices you already own. Private by default. Thanks for watching." |

**Total: 4:52** (8s headroom under the 5:00 cap).

---

## Filming-day decision rule (keep it honest)

For each tagged shot, on the morning of filming run the relevant repro command and decide:

1. **On-device path renders on the phone?** (`cd app && npx expo run:ios --device`) → film the phone shots for 0:52–1:28, 1:28–2:08, 3:30–4:02.
2. **Phone↔laptop P2P works on the Expo app?** → film 2:24–2:54 and 2:54–3:30 on the phone. **If not**, use the laptop↔laptop Node delegation fallback (`cd provider && npx tsx src/provider.ts`) and reword to "proven on the wire / phone is the client."
3. **Any phone path not ready?** → fall back to the **web demo** (`npx expo start --web`, fully verified) and adjust the one narration word noted in each FALLBACK.

Never film a phone completion that didn't actually happen. Never overlay "0 network calls" over a delegated result — the app itself says "no cloud" there. Every fallback above uses only verified surfaces, so the video stays truthful regardless of what verifies in time.

---

## Spoken-claim → fact map (for your own check before recording)

- "reads… explains… flags… on your own device / data never leaves your hands" → tagline + privacyClaim.
- "exact reference range, a visual bar, and a plain-language explanation… curated knowledge base, not a model making things up" → ResultScreen behavior + curated offline marker knowledge base (~15 common markers, deterministic, not model-generated — verified) + deterministic parser, never hallucinated (verified).
- Specific flags (Hemoglobin low, Glucose high, LDL high) → exact values in `fixtures/synthetic-lab-report.txt` (Hemoglobin 11.2 / Fasting Glucose 7.8 / LDL 4.1 — match the parser output).
- "zero network calls" / "lists every remote call… not one is AI inference" / "runs in airplane mode" → `remote-apis.json` (`ai_inference_remote_calls: []`) + privacyClaim (verified). **Use "zero network calls" only for local / airplane-mode shots, never during delegation.**
- "direct, encrypted peer-to-peer link" / "no cloud" → Hyperswarm DHT P2P (verified laptop↔laptop on Node; iOS path tagged [NEEDS]). Blind relays are end-to-end-encrypted passthrough by design; `remote-apis.json` notes the relay-encryption specifics are still to be confirmed before submission. Delegated provenance string in-app is "encrypted peer link · no cloud" — match that exactly on screen.
- "432 ms… 44 tok/s… phone's GPU… zero network calls" → evidence/on-device-inference.md (verified, Llama-1B proxy — narrated as "the on-device engine," not MedPsy).
- "open source under Apache-2.0… every bit of AI through the QVAC SDK" → `LICENSE` + @qvac/sdk 0.12.2 (verified).
- "four tracks — Psy, Mobile, General Purpose, Build-in-Public" → tracks list (verified).
- "MedPsy on the laptop's bigger model" → MedPsy-4B via provider; correctness on real reports unverified → tagged [NEEDS], fallback avoids per-claim accuracy statements.

---

> **Note on the secret-scan / GO–NO-GO check:** this deliverable is the demo shot-list, which contains no GitHub-push runbook section. The secret scan (`safeToPush: true`; one MEDIUM = absolute home-dir paths in `docs/superpowers/plans/2026-06-13-aegis-day1-spike-and-foundation.md`; two LOW = bundle id `com.stetang.aegis` and the `@Stetang3438` handle in `docs/build-in-public.md`) and its verdict belong in the separate github-push-runbook, not here. Verdict carried for reference: **GO**, conditional on making the spike-plan paths relative; the LOW findings are intentional and need no action.
