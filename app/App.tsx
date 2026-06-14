/**
 * Aegis — offline private health copilot. App container + lightweight navigation.
 *
 * A tiny in-state navigation stack (no native nav deps → guaranteed web-bundle-safe for
 * design iteration; subtle cross-fade between screens). The container owns records and the
 * paired-provider key, and routes analysis through the platform-split @qvac/sdk service
 * (MedPsy on device, templated preview on web). Screens are presentational + prop-driven.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, Animated, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import { Fraunces_600SemiBold, Fraunces_700Bold_Italic } from "@expo-google-fonts/fraunces";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";

import { palette, font, space, radius, shadow } from "./src/theme/tokens";
import { HomeScreen } from "./src/screens/HomeScreen";
import { IntakeScreen } from "./src/screens/IntakeScreen";
import { ResultScreen } from "./src/screens/ResultScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { AskScreen } from "./src/screens/AskScreen";
import { PairScreen } from "./src/screens/PairScreen";
import { analyzeReport } from "./src/services/analyze";
import * as qvac from "./src/services/qvac";
import { parseLabReport } from "./src/services/labparse";
import { SAMPLE_REPORT } from "./src/lib/sample";
import type { HealthRecord, ExplainOptions } from "./src/services/types";

type Route =
  | { name: "home" }
  | { name: "intake"; mode: "scan" | "paste" }
  | { name: "result"; recordId: string }
  | { name: "history" }
  | { name: "ask" }
  | { name: "pair" };

function newId(): string {
  return `r-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/** Web-only design-preview deep link, e.g. ?route=result. Always [home] on a device. */
function initialStack(): Route[] {
  if (Platform.OS !== "web" || typeof window === "undefined") return [{ name: "home" }];
  const r = new URLSearchParams(window.location.search).get("route");
  switch (r) {
    case "result":
      return [{ name: "home" }, { name: "result", recordId: "sample-1" }];
    case "intake":
      return [{ name: "home" }, { name: "intake", mode: "paste" }];
    case "history":
      return [{ name: "home" }, { name: "history" }];
    case "ask":
      return [{ name: "home" }, { name: "ask" }];
    case "pair":
      return [{ name: "home" }, { name: "pair" }];
    default:
      return [{ name: "home" }];
  }
}

/** One pre-seeded sample so Home/History show content immediately (great for the demo). */
function buildSampleRecord(): HealthRecord {
  return {
    id: "sample-1",
    ts: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    title: "Lab panel",
    reportText: SAMPLE_REPORT,
    parsed: parseLabReport(SAMPLE_REPORT),
    summary:
      "Most of your values are within range, but three are outside it: hemoglobin (low), fasting glucose (high), and LDL cholesterol (high). None is an emergency, but they're worth raising with your doctor. This is health education, not a diagnosis.",
    servedBy: "preview",
    engine: "Sample",
  };
}

function AegisApp() {
  const [records, setRecords] = useState<HealthRecord[]>(() => [buildSampleRecord()]);
  const [stack, setStack] = useState<Route[]>(() => initialStack());
  const [analyzing, setAnalyzing] = useState(false);
  const [providerKey, setProviderKey] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const pendingDeeperId = useRef<string | null>(null);

  const top = stack[stack.length - 1];
  const delegateOpts = useMemo<ExplainOptions>(
    () => (providerKey ? { delegate: { providerPublicKey: providerKey } } : {}),
    [providerKey],
  );

  const push = useCallback((r: Route) => setStack((s) => [...s, r]), []);
  const back = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);
  const findRecord = useCallback((id: string) => records.find((r) => r.id === id), [records]);
  const dismissNotice = useCallback(() => setNotice(null), []);

  const runAnalysis = useCallback(
    async (text: string, opts: ExplainOptions): Promise<HealthRecord> => {
      const a = await analyzeReport(text, opts);
      return {
        id: newId(),
        ts: new Date().toISOString(),
        title: a.title,
        reportText: text,
        parsed: a.parsed,
        summary: a.outcome.summary,
        servedBy: a.outcome.servedBy,
        engine: a.outcome.engine,
        fellBackToLocal: a.outcome.fellBackToLocal,
        stats: a.outcome.stats,
      };
    },
    [],
  );

  const fallbackNotice = useCallback((rec: HealthRecord) => {
    if (rec.fellBackToLocal) setNotice("Couldn't reach your paired laptop — explained on-device instead.");
  }, []);

  const onAnalyze = useCallback(
    async (text: string) => {
      if (analyzing) return;
      setAnalyzing(true);
      setAnalyzeError(null);
      try {
        const rec = await runAnalysis(text, delegateOpts);
        setRecords((rs) => [rec, ...rs]);
        setStack([{ name: "home" }, { name: "result", recordId: rec.id }]);
        fallbackNotice(rec);
      } catch {
        // Stay on Intake (text preserved) and show a recoverable error — never silently bail.
        setAnalyzeError("Couldn't analyze this report. Please check the text and try again.");
      } finally {
        setAnalyzing(false);
      }
    },
    [analyzing, runAnalysis, delegateOpts, fallbackNotice],
  );

  // Re-run a record's analysis against a paired provider. `key` is passed explicitly to
  // avoid a stale providerKey closure when called right after pairing.
  const runDeeper = useCallback(
    async (record: HealthRecord, key: string) => {
      if (analyzing) return;
      setAnalyzing(true);
      try {
        const rec = await runAnalysis(record.reportText, { delegate: { providerPublicKey: key } });
        setRecords((rs) => [rec, ...rs.filter((r) => r.id !== rec.id)]); // keep the original record too
        setStack([{ name: "home" }, { name: "result", recordId: rec.id }]);
        fallbackNotice(rec);
      } catch {
        setNotice("Couldn't run a deeper read. Check that your laptop is paired and reachable.");
      } finally {
        setAnalyzing(false);
      }
    },
    [analyzing, runAnalysis, fallbackNotice],
  );

  const onDeeper = useCallback(
    (record: HealthRecord) => {
      if (!providerKey) {
        pendingDeeperId.current = record.id; // resume the deeper read after pairing
        push({ name: "pair" });
        return;
      }
      runDeeper(record, providerKey);
    },
    [providerKey, push, runDeeper],
  );

  const onAsk = useCallback(
    (question: string) =>
      qvac.followUp(
        question,
        records.map((r) => ({ ts: r.ts, reportText: r.reportText, summary: r.summary })),
        delegateOpts,
      ),
    [records, delegateOpts],
  );

  const screen = renderScreen({
    top,
    records,
    analyzing,
    analyzeError,
    providerConnected: !!providerKey,
    findRecord,
    push,
    back,
    onAnalyze,
    clearAnalyzeError: () => setAnalyzeError(null),
    clearPendingDeeper: () => {
      pendingDeeperId.current = null;
    },
    onDeeper,
    onAsk,
    onConnect: (key: string) => {
      const k = key.trim();
      setProviderKey(k || null);
      back();
      const pid = pendingDeeperId.current;
      pendingDeeperId.current = null;
      if (pid && k) {
        const rec = findRecord(pid);
        if (rec) runDeeper(rec, k);
      }
    },
  });

  const routeKey = `${top.name}:${"recordId" in top ? top.recordId : ""}:${"mode" in top ? top.mode : ""}`;
  return (
    <View style={styles.fill}>
      <Faded routeKey={routeKey}>{screen}</Faded>
      {notice ? <Flash message={notice} onDismiss={dismissNotice} /> : null}
    </View>
  );
}

interface RenderArgs {
  top: Route;
  records: HealthRecord[];
  analyzing: boolean;
  analyzeError: string | null;
  providerConnected: boolean;
  findRecord: (id: string) => HealthRecord | undefined;
  push: (r: Route) => void;
  back: () => void;
  onAnalyze: (text: string) => void;
  clearAnalyzeError: () => void;
  clearPendingDeeper: () => void;
  onDeeper: (r: HealthRecord) => void;
  onAsk: (q: string) => ReturnType<typeof qvac.followUp>;
  onConnect: (key: string) => void;
}

function renderScreen(a: RenderArgs) {
  const { top } = a;
  switch (top.name) {
    case "intake":
      return (
        <IntakeScreen
          mode={top.mode}
          analyzing={a.analyzing}
          error={a.analyzeError}
          onAnalyze={a.onAnalyze}
          onClearError={a.clearAnalyzeError}
          onBack={() => {
            a.clearAnalyzeError();
            a.back();
          }}
        />
      );
    case "result": {
      const record = a.findRecord(top.recordId);
      if (!record) return <HomeScreenBound {...a} />;
      return (
        <ResultScreen
          record={record}
          onBack={a.back}
          onAsk={() => a.push({ name: "ask" })}
          onDeeper={() => a.onDeeper(record)}
        />
      );
    }
    case "history":
      return (
        <HistoryScreen
          records={a.records}
          onOpen={(r) => a.push({ name: "result", recordId: r.id })}
          onBack={a.back}
        />
      );
    case "ask":
      return (
        <AskScreen
          recordCount={a.records.length}
          onAsk={a.onAsk}
          onAddReport={() => a.push({ name: "intake", mode: "paste" })}
          onBack={a.back}
        />
      );
    case "pair":
      return (
        <PairScreen
          connected={a.providerConnected}
          onConnect={a.onConnect}
          onBack={() => {
            a.clearPendingDeeper();
            a.back();
          }}
        />
      );
    case "home":
    default:
      return <HomeScreenBound {...a} />;
  }
}

function HomeScreenBound(a: RenderArgs) {
  return (
    <HomeScreen
      records={a.records}
      onNewReport={(mode) => a.push({ name: "intake", mode })}
      onOpenRecord={(r) => a.push({ name: "result", recordId: r.id })}
      onSeeAll={() => a.push({ name: "history" })}
      onDelegation={() => a.push({ name: "pair" })}
    />
  );
}

/** Transient top banner for app-level notices (e.g. delegate fallback / deeper-read errors). */
function Flash({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const insets = useSafeAreaInsets();
  useEffect(() => {
    const id = setTimeout(onDismiss, 4500);
    return () => clearTimeout(id);
  }, [message, onDismiss]);
  return (
    <Pressable
      onPress={onDismiss}
      accessibilityRole="alert"
      accessibilityLabel={message}
      style={[styles.flash, { top: insets.top + space.sm }]}
    >
      <Feather name="info" size={15} color={palette.inkOnDark} />
      <Text style={styles.flashText}>{message}</Text>
    </Pressable>
  );
}

/** Subtle cross-fade on route CHANGE (first mount stays fully visible). */
function Faded({ routeKey, children }: { routeKey: string; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const firstMount = useRef(true);
  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false;
      return;
    }
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [routeKey, opacity]);
  return <Animated.View style={[styles.fill, { opacity }]}>{children}</Animated.View>;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {fontsLoaded ? <AegisApp /> : <View style={[styles.fill, { backgroundColor: palette.bg }]} />}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flash: {
    position: "absolute",
    left: space.lg,
    right: space.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: palette.surfaceInk,
    borderRadius: radius.md,
    paddingVertical: 12,
    paddingHorizontal: space.lg,
    ...shadow.raised,
  },
  flashText: { fontFamily: font.medium, fontSize: 13, color: palette.inkOnDark, flex: 1, minWidth: 0 },
});

