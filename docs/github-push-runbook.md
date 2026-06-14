# Aegis — Public GitHub Push Runbook

Operator: **Ste** (GitHub user `stetang98`)
Repo: `~/Desktop/QVAC` → public repo `stetang98/aegis`
Target visibility: **PUBLIC**

Run every command from the repo root. Copy-paste blocks are intended to be run as-is from `~/Desktop/QVAC`.

```bash
cd ~/Desktop/QVAC
```

---

## 0. SECRET-SCAN VERDICT — ✅ GO (clear to push)

`safeToPush: true` · `gitignoreOk: true` · No CRITICAL/HIGH findings.

The scan found **no** hardcoded API keys, tokens, credentials, private keys, Apple signing identifiers, device UDIDs, provisioning profiles, or tracked `.env` files. `.gitignore` is comprehensive and correctly excludes `node_modules/`, `.expo/`, `ios/`, `android/`, `dist/`, `build/`, `*.gguf`, `models/`, `.env`, `.env.*`; `app/.gitignore` additionally excludes private-key material (`*.p8`, `*.p12`, `*.key`, `*.mobileprovision`, `*.pem`, `*.jks`). All source files use environment-variable patterns for sensitive values.

**Verdict: CLEAR TO PUSH AS PUBLIC.** Three minor findings exist (1 MEDIUM, 2 LOW), none blocking:

| Severity | File | What | Status / Action |
|---|---|---|---|
| MEDIUM | `docs/superpowers/plans/2026-06-13-aegis-day1-spike-and-foundation.md` | Absolute home path `~/Desktop/QVAC` hardcoded (lines 24, 57, 65, 112, 130, 162, 218) | Not a secret. **Optional cleanup** (recommended): replace with `.` or `$REPO_ROOT` so the doc is portable and doesn't leak your home-dir layout. Safe to ship as-is. |
| LOW | `app/app.json` | Bundle ID `com.stetang.aegis` contains your name | **Keep** — standard app identifier, intentional creator attribution, not a credential. |
| LOW | `docs/build-in-public.md` | X handle `@Stetang3438` in a marketing draft | **Keep** — intentional public marketing content. |

Because nothing is blocking, you do **not** need to remediate before pushing. **But before you create the repo, eyeball the full tracked-file list once** to confirm nothing surprising is staged for public exposure:

```bash
git ls-files | less        # or: git ls-files | sort | $PAGER
```

Sanity checks while scanning that list — all should print **nothing**:

```bash
git ls-files | grep -Ei '\.env($|\.)|\.p8$|\.p12$|\.key$|\.pem$|\.mobileprovision$|\.jks$|\.gguf$|id_rsa|\.keystore$' || echo "OK: no secret-shaped files tracked"
git ls-files models/ ios/ android/ app/dist/ 2>/dev/null || true   # expect empty — these are gitignored
```

> Optional MEDIUM cleanup (do it now if you want a portable doc; skip if you're fine shipping):
> ```bash
> sed -i '' 's#~/Desktop/QVAC#$REPO_ROOT#g' docs/superpowers/plans/2026-06-13-aegis-day1-spike-and-foundation.md
> git add docs/superpowers/plans/2026-06-13-aegis-day1-spike-and-foundation.md
> git commit -m "docs: make spike-plan paths portable (\$REPO_ROOT)"
> ```

---

## 1. Pre-push checklist

Confirm each line before creating the remote.

```bash
# 1a. On main, working tree clean, nothing uncommitted
git status -sb
git branch --show-current          # expect: main

# 1b. No remote yet (we add it in step 2)
git remote -v                      # expect: empty

# 1c. LICENSE + README present and correct
ls -la LICENSE README.md
head -3 LICENSE                    # expect (after a leading blank line): "Apache License / Version 2.0, January 2004"

# 1d. .gitignore in place (root + app)
sed -n '1,40p' .gitignore
sed -n '1,40p' app/.gitignore
```

**Decision: commit `app/dist` or keep it gitignored? → KEEP IT GITIGNORED (already decided for you).**
`app/dist/` is the Expo web build output and is matched by `dist/` in both `.gitignore` and `app/.gitignore`. It is **not** currently tracked. Build artifacts should not live in the repo — leave it ignored. Verify:

```bash
git ls-files app/dist | wc -l      # expect: 0  (not tracked)
git check-ignore app/dist          # expect: app/dist  (confirms it is ignored)
```

If you ever want to publish the web demo, deploy `app/dist` to GitHub Pages / a host instead of committing it (regenerate with `cd app && npx expo export -p web`).

**Final pre-push gate (all must be true):**
- [ ] `git status` clean, on `main`
- [ ] `git remote -v` empty
- [ ] `LICENSE` (Apache-2.0) + `README.md` present
- [ ] `git ls-files` eyeballed; secret-shaped grep prints "OK"
- [ ] `app/dist` not tracked (build artifact stays ignored)

---

## 2. Create the public repo and push

> **Description honesty note.** The repo description below is scoped to what is *verified* today and flags what is *roadmap*, so the public repo doesn't overclaim. Verified: full web demo UX end-to-end; on-device GPU LLM inference on iPhone 15 Pro Max via `@qvac/sdk` (measured with a LLAMA-3.2-1B proxy for MedPsy); AES-256-GCM encrypted store in the shared core; deterministic parser; injection defenses; zero runtime cloud AI calls (see `remote-apis.json`). Roadmap / not yet device-verified: camera→OCR (paste route is live), MedPsy-4B correctness on real reports, and phone↔laptop P2P delegation on the Expo app (delegation RPC is proven on Node).

### Option A — gh CLI (preferred; you are authed as `stetang98`)

Your `gh` is logged in to `stetang98` with the `repo` scope and SSH git protocol — this is the fast path. One command creates the repo, adds `origin`, and pushes `main`:

```bash
gh repo create stetang98/aegis \
  --public \
  --source=. \
  --remote=origin \
  --description "Aegis — private, offline health copilot. Paste a lab report (camera→OCR on the roadmap) → parsed, explained in plain language, and flagged, on-device. On-device GPU LLM inference via @qvac/sdk (demoed with a LLAMA-3.2-1B proxy for MedPsy on iPhone 15 Pro Max); AES-256-GCM encrypted store in the shared core; optional P2P delegation to your own laptop (delegation RPC proven on Node; on-device path in progress). Zero runtime cloud AI calls." \
  --push
```

Verify it landed:

```bash
git remote -v                      # expect: origin  git@github.com:stetang98/aegis.git
git branch -vv                     # expect: main tracking origin/main
gh repo view stetang98/aegis --web # opens it in the browser
```

### Option B — web UI + manual remote (fallback if `gh` isn't authed)

Use this only if `gh auth status` is broken or you'd rather click. **Create the repo EMPTY** — do not let GitHub add a README, .gitignore, or license (you already have all three; an auto-init creates a conflicting commit).

1. Go to https://github.com/new
2. **Owner:** `stetang98` · **Repository name:** `aegis`
3. **Visibility:** Public
4. **Do NOT** check "Add a README", "Add .gitignore", or "Choose a license" — leave all unchecked.
5. Click **Create repository**.
6. Back in the terminal, wire the remote and push (SSH, matching your gh config):

```bash
git remote add origin git@github.com:stetang98/aegis.git
git push -u origin main
```

> If you use HTTPS instead of SSH, swap the URL: `git remote add origin https://github.com/stetang98/aegis.git`
> If `origin` already exists from a prior attempt: `git remote set-url origin git@github.com:stetang98/aegis.git`

---

## 3. Set description + topics

The description is already set in Option A. Set/refresh it plus the topics (topics power GitHub search/discovery). The refreshed description below is the same honest, verified-vs-roadmap framing:

```bash
gh repo edit stetang98/aegis \
  --description "Aegis — private, offline health copilot. Paste a lab report (camera→OCR roadmap) → parsed, explained in plain language, and flagged, on-device via @qvac/sdk. On-device GPU LLM inference demoed on iPhone 15 Pro Max (LLAMA-3.2-1B proxy for MedPsy); AES-256-GCM encrypted store in the shared core; optional P2P delegation to your own laptop (RPC proven on Node, on-device path in progress). Zero runtime cloud AI calls." \
  --add-topic edge-ai \
  --add-topic on-device \
  --add-topic privacy \
  --add-topic health \
  --add-topic qvac \
  --add-topic react-native \
  --add-topic expo \
  --add-topic llm
```

Verify:

```bash
gh repo view stetang98/aegis --json description,repositoryTopics,visibility,licenseInfo
```

(Web UI fallback: repo home → gear icon next to **About** → set description + add the 8 topics → Save.)

---

## 4. Post-push verification

Run through all of these; each should pass before you treat the push as done.

```bash
# 4a. Repo is PUBLIC and license auto-detected as Apache-2.0
gh repo view stetang98/aegis --json visibility,licenseInfo,defaultBranchRef
# expect: visibility "PUBLIC"; licenseInfo.spdxId "Apache-2.0"; defaultBranchRef.name "main"

# 4b. Local and remote main match (nothing left unpushed)
git fetch origin
git status -sb                      # expect: "## main...origin/main" with nothing ahead/behind

# 4c. File count on remote matches local tracked set (91 files)
git ls-files | wc -l               # expect: 91
```

Then eyeball in the browser (`gh repo view stetang98/aegis --web`):

- [ ] **Public** badge — repo is visible while logged out (open an incognito window to confirm).
- [ ] **License:** GitHub's right-side "About" panel shows **Apache-2.0**.
- [ ] **README renders** — title, tagline, sections, badges all display correctly.
- [ ] **Screenshots render** — images in `docs/screenshots/` (`aegis-home.png`, `aegis-result.png`, `aegis-pair.png`) load inline in the README, not broken links. If broken, they likely use absolute/local paths; switch to repo-relative paths (e.g. `docs/screenshots/aegis-home.png`) and re-push.
- [ ] **Topics** show the 8 chips under the description.
- [ ] **No secret-scanning alert** — check the **Security** tab → "Secret scanning". Expect zero alerts. (GitHub push protection would have blocked the push if it found a known secret pattern; a clean push is itself a signal.)
- [ ] **Actions tab** — if no workflows exist, it's empty (expected; this repo has none). If GitHub later flags anything, address before sharing widely.
- [ ] `remote-apis.json`, `LICENSE`, `evidence/`, `fixtures/` (synthetic, non-PHI) are present and viewable. `remote-apis.json` backs the **"zero runtime cloud AI calls"** claim; `evidence/on-device-inference.md` backs the iPhone GPU inference metrics. (Note: `remote-apis.json` flags that blind-relay encryption specifics for the P2P path still need final confirmation — don't present P2P as proven E2E-encrypted until that's locked.)

---

## 5. Capture the final URL (for DoraHacks + X)

Grab the canonical URL once everything above passes:

```bash
gh repo view stetang98/aegis --json url -q .url
# → https://github.com/stetang98/aegis
```

**Repo URL to paste:**

```
https://github.com/stetang98/aegis
```

Use it in:

- **DoraHacks submission** — paste `https://github.com/stetang98/aegis` into the project/source-code field. Pair it with the reproduce steps from the README so judges can run the web demo with no device:
  ```bash
  cd app && npm install && npx expo start --web
  ```
- **X / build-in-public thread** (`@Stetang3438`) — link the repo in the launch thread. Suggested closer line, grounded in verified facts (model attribution kept honest — the metric is a LLAMA-3.2-1B proxy run, MedPsy is the target model):
  > Aegis is open source (Apache-2.0): https://github.com/stetang98/aegis — on-device GPU LLM inference via @qvac/sdk. iPhone 15 Pro Max: 432 ms TTFT, 44.6 tok/s, 0 network calls (LLAMA-3.2-1B proxy run; MedPsy is the target). AES-256-GCM encrypted store in the core. Zero runtime cloud AI calls. #edge-ai #privacy
  Draft copy already lives in `docs/build-in-public.md` — reuse it and drop the URL in.

---

### Rollback / oops handlers

- **Pushed and immediately want it private again:** `gh repo edit stetang98/aegis --visibility private --accept-visibility-change-consequences`
- **Wrong remote URL:** `git remote set-url origin git@github.com:stetang98/aegis.git`
- **Need to undo the remote entirely (before sharing the link):** Your current gh token scopes are `repo, read:org, gist, admin:public_key` — there is **no `delete_repo` scope**, so `gh repo delete stetang98/aegis --yes` **will refuse**. Either grant the scope first with `gh auth refresh -h github.com -s delete_repo` and then `gh repo delete stetang98/aegis --yes`, or simply delete via repo **Settings → Danger Zone** in the web UI. After deleting, start over at step 2.
- **Accidentally committed a secret in a later commit:** stop, rotate the secret immediately, then scrub history with `git filter-repo` (or BFG) and force-push — do not just delete the file in a new commit.
