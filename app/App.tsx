/**
 * Aegis iOS spike screen (Plan 3). Minimal, self-contained: verifies on-device inference and the crux —
 * delegated inference from the iPhone (Bare/Expo runtime) to the laptop provider over QVAC P2P.
 * Uses the built-in LLAMA-1B (registry-downloadable) to keep the spike small; MedPsy comes after green.
 *
 * Note: `tokenStream` is the SDK's legacy (deprecated) convenience surface; it works and is verified, but
 * the full hero UI should migrate to `r.events` (contentDelta) — the canonical streaming API.
 */
import { useState, useRef } from "react";
import { View, Text, TextInput, Button, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { loadModel, completion, unloadModel, LLAMA_3_2_1B_INST_Q4_0 } from "@qvac/sdk";

export default function App() {
  const [providerKey, setProviderKey] = useState("");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("idle");
  const [busy, setBusy] = useState(false);
  const pending = useRef("");

  async function run(delegated: boolean): Promise<void> {
    if (busy) return;
    setBusy(true);
    setOutput("");
    pending.current = "";
    setStatus(delegated ? "loading (delegated)…" : "loading (local)…");
    let modelId: string | undefined;
    let flush: ReturnType<typeof setInterval> | undefined;
    try {
      const delegate = delegated ? { providerPublicKey: providerKey.trim(), timeout: 60_000 } : undefined;
      const t0 = Date.now();
      modelId = await loadModel({
        modelSrc: LLAMA_3_2_1B_INST_Q4_0,
        modelType: "llm",
        modelConfig: { device: "gpu", ctx_size: 4096 },
        onProgress: (p: unknown) => {
          const pct = typeof p === "object" && p !== null ? (p as { percentage?: number }).percentage : undefined;
          setStatus(pct != null ? `downloading model… ${Math.round(pct)}%` : "loading…");
        },
        ...(delegate ? { delegate } : {}),
      });
      setStatus(`loaded in ${Date.now() - t0}ms — generating…`);

      // Batch token rendering (~12fps) so the UI doesn't re-render per token; firstAt stays accurate.
      flush = setInterval(() => {
        if (pending.current) {
          setOutput((o) => o + pending.current);
          pending.current = "";
        }
      }, 80);

      const reqT = Date.now();
      let firstAt = 0;
      let n = 0;
      const r = completion({
        modelId,
        history: [{ role: "user", content: "Reply in one short sentence: are you running locally or remotely?" }],
        stream: true,
      });
      for await (const tok of r.tokenStream) {
        if (firstAt === 0) firstAt = Date.now();
        n++;
        pending.current += String(tok);
      }
      const fin = await r.final;
      const ttft = firstAt ? firstAt - reqT : 0;
      const tps = fin.stats?.tokensPerSecond?.toFixed(1) ?? "?";
      const backend = fin.stats?.backendDevice ?? "?";
      setStatus(`✅ ${delegated ? "DELEGATED" : "LOCAL"} — TTFT ${ttft}ms · tokens ${n} · ${tps} tok/s · ${backend}`);
    } catch (e) {
      setStatus("❌ ERROR: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      if (flush) clearInterval(flush);
      if (pending.current) {
        setOutput((o) => o + pending.current);
        pending.current = "";
      }
      if (modelId) {
        try {
          await unloadModel({ modelId });
        } catch (e) {
          console.warn("unload failed", e);
        }
      }
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Aegis · iOS spike</Text>
      <TextInput
        style={styles.input}
        placeholder="laptop provider public key (for DELEGATED)"
        value={providerKey}
        onChangeText={setProviderKey}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <View style={styles.row}>
        <Button title="Run LOCAL" onPress={() => void run(false)} disabled={busy} />
        <Button title="Run DELEGATED" onPress={() => void run(true)} disabled={busy || providerKey.trim().length === 0} />
      </View>
      {busy ? <ActivityIndicator style={styles.spinner} /> : null}
      <Text style={styles.status}>{status}</Text>
      <ScrollView style={styles.out}>
        <Text>{output}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 80, paddingHorizontal: 16, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginBottom: 10 },
  row: { flexDirection: "row", gap: 12, justifyContent: "space-between" },
  spinner: { margin: 8 },
  status: { marginVertical: 10, color: "#444" },
  out: { flex: 1, borderWidth: 1, borderColor: "#eee", borderRadius: 8, padding: 10 },
});
