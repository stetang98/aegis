/**
 * Ask — cross-history follow-up Q&A. The model answers using the patient's stored reports
 * as context (on device: MedPsy + RAG; on web: templated preview). Prop-driven.
 */
import { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  AccessibilityInfo,
  StyleSheet,
  TextStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { palette, space, radius, type as t, shadow, font } from "../theme/tokens";
import { Screen, Card, IconButton, PrimaryButton } from "../components/ui";
import type { ExplainOutcome } from "../services/types";

interface AskScreenProps {
  recordCount: number;
  onAsk: (question: string) => Promise<ExplainOutcome>;
  onAddReport: () => void;
  onBack: () => void;
}

const EXAMPLES = ["Any trends over time?", "What should I ask my doctor?", "Is anything urgent?"];

export function AskScreen({ recordCount, onAsk, onAddReport, onBack }: AskScreenProps) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<ExplainOutcome | null>(null);
  const [asked, setAsked] = useState("");
  const busy = useRef(false);

  async function submit(q: string) {
    const trimmed = q.trim();
    if (trimmed.length === 0 || busy.current) return; // synchronous guard against double-fire
    busy.current = true;
    setLoading(true);
    setAsked(trimmed);
    setAnswer(null);
    try {
      const outcome = await onAsk(trimmed);
      setAnswer(outcome);
      AccessibilityInfo.announceForAccessibility("Answer ready");
    } catch {
      setAnswer({ summary: "Something went wrong answering that. Please try again.", servedBy: "preview", engine: "Error" });
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }

  const canAsk = question.trim().length > 0 && !loading;

  if (recordCount === 0) {
    return (
      <Screen>
        <Header onBack={onBack} />
        <Card style={styles.empty} elevation="soft">
          <View style={styles.emptyIcon}>
            <Feather name="message-circle" size={20} color={palette.accentDeep} />
          </View>
          <Text style={styles.emptyTitle}>Nothing to ask about yet</Text>
          <Text style={styles.emptySub}>Add a lab report first, then ask questions across your history.</Text>
          <View style={{ height: space.lg }} />
          <PrimaryButton label="Add a report" icon="plus" onPress={onAddReport} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header onBack={onBack} />
      <Text style={styles.sub}>
        Answered across your {recordCount} report{recordCount === 1 ? "" : "s"} — on this device.
      </Text>

      <View style={styles.well}>
        <TextInput
          style={styles.input}
          value={question}
          onChangeText={setQuestion}
          placeholder="Ask about your results…"
          placeholderTextColor={palette.inkTertiary}
          multiline
          editable={!loading}
          accessibilityLabel="Your question"
        />
      </View>

      <View style={styles.chips}>
        {EXAMPLES.map((ex) => (
          <Pressable
            key={ex}
            onPress={() => {
              setQuestion(ex);
              submit(ex);
            }}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={ex}
            accessibilityState={{ disabled: loading }}
            style={({ pressed }) => [styles.chip, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.chipText}>{ex}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ height: space.lg }} />
      <PrimaryButton label="Ask" icon="arrow-up" onPress={() => submit(question)} disabled={!canAsk} />

      {loading ? (
        <View style={styles.loading} accessibilityLiveRegion="polite">
          <ActivityIndicator color={palette.accent} />
          <Text style={styles.loadingText}>Thinking on-device…</Text>
        </View>
      ) : null}

      {answer && !loading ? (
        <Card style={styles.answerCard} accessibilityLabel={`Answer: ${answer.summary}`}>
          <Text style={styles.answerQ}>{asked}</Text>
          <Text style={styles.answerText}>{answer.summary}</Text>
          <View style={styles.answerMeta}>
            <Feather name="shield" size={11} color={palette.inkTertiary} />
            <Text style={styles.answerMetaText}>
              {answer.engine}
              {answer.servedBy === "delegated" ? " · encrypted peer link" : " · 0 network calls"}
            </Text>
          </View>
        </Card>
      ) : null}
    </Screen>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.topBar}>
      <IconButton icon="chevron-left" onPress={onBack} label="Back" />
      <Text style={styles.title} accessibilityRole="header">
        Ask
      </Text>
      <View style={{ width: 44 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { ...(t.h2 as object), color: palette.ink } as TextStyle,
  sub: { ...(t.small as object), color: palette.inkTertiary, marginTop: space.lg } as TextStyle,

  well: {
    marginTop: space.lg,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    padding: space.lg,
    minHeight: 96,
    ...shadow.soft,
  },
  input: { fontFamily: font.regular, fontSize: 16, lineHeight: 23, color: palette.ink, minHeight: 64 } as TextStyle,

  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.md },
  chip: {
    backgroundColor: palette.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: space.md,
    minHeight: 44,
    justifyContent: "center",
  },
  chipText: { fontFamily: font.medium, fontSize: 13, color: palette.accentDeep } as TextStyle,

  loading: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.md, paddingVertical: space.xl },
  loadingText: { ...(t.bodyStrong as object), color: palette.accentDeep } as TextStyle,

  answerCard: { marginTop: space.xl, gap: space.sm },
  answerQ: { fontFamily: font.semibold, fontSize: 14, color: palette.inkTertiary } as TextStyle,
  answerText: { fontFamily: font.regular, fontSize: 17, lineHeight: 26, color: palette.ink } as TextStyle,
  answerMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: space.sm },
  answerMetaText: { fontFamily: font.medium, fontSize: 12, color: palette.inkTertiary } as TextStyle,

  empty: { marginTop: space.xl, alignItems: "center", paddingVertical: space["2xl"] },
  emptyIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: palette.accentSoft, alignItems: "center", justifyContent: "center", marginBottom: space.md },
  emptyTitle: { ...(t.h3 as object), color: palette.ink } as TextStyle,
  emptySub: { ...(t.small as object), color: palette.inkTertiary, textAlign: "center", maxWidth: 280, marginTop: space.xs } as TextStyle,
});
