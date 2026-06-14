/**
 * Result / explanation screen — the core value of Aegis. Prop-driven: renders a
 * HealthRecord (deterministic parsed values + the model's holistic summary). Per-flag
 * notes come from the curated knowledge base (accurate, offline), never hallucinated.
 */
import { View, Text, Pressable, StyleSheet, TextStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { palette, space, radius, type as t, shadow, font } from "../theme/tokens";
import { Screen, Card, Tag, RangeBar, OnDevicePill, IconButton, DelegationCard } from "../components/ui";
import { markerNote } from "../services/knowledge";
import { formatDate } from "../lib/format";
import type { HealthRecord } from "../services/types";
import type { LabValue } from "../services/labparse";

interface ResultScreenProps {
  record: HealthRecord;
  onBack: () => void;
  onAsk: () => void;
  onDeeper: () => void;
}

export function ResultScreen({ record, onBack, onAsk, onDeeper }: ResultScreenProps) {
  const flagged = record.parsed.values.filter((v) => v.tone !== "normal");
  const inRange = record.parsed.inRangeCount;

  return (
    <Screen>
      <View style={styles.topBar}>
        <IconButton icon="chevron-left" onPress={onBack} label="Back" />
        <OnDevicePill />
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.kicker}>{`REPORT · ${formatDate(record.ts).toUpperCase()}`}</Text>
        <Text style={styles.title} accessibilityRole="header">
          {record.title}
        </Text>
      </View>

      <Card style={styles.summaryCard}>
        <View style={styles.summaryHead}>
          <View style={styles.medpsyDot} />
          <Text style={styles.summaryHeadText}>WHAT THIS MEANS</Text>
        </View>
        <Text style={styles.summaryText}>{record.summary}</Text>
      </Card>

      {record.fellBackToLocal ? (
        <View style={styles.fallbackNote}>
          <Feather name="wifi-off" size={13} color={palette.high} />
          <Text style={styles.fallbackNoteText}>Couldn't reach your laptop — explained on-device instead.</Text>
        </View>
      ) : null}

      {record.parsed.values.length === 0 ? (
        // Parsed NO structured values — never claim "all in range" (it parsed nothing).
        <Card style={styles.allClear} elevation="soft">
          <View style={styles.neutralIcon}>
            <Feather name="file-text" size={18} color={palette.inkSecondary} />
          </View>
          <Text style={styles.allClearText}>
            Couldn't read individual values from this report — see the summary above.
          </Text>
        </Card>
      ) : flagged.length > 0 ? (
        <>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionLabel}>NEEDS ATTENTION</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{flagged.length}</Text>
            </View>
          </View>
          <View style={{ gap: space.md }}>
            {flagged.map((v) => (
              <FlagCard key={v.name} v={v} />
            ))}
          </View>
        </>
      ) : (
        <Card style={styles.allClear} elevation="soft">
          <View style={styles.allClearIcon}>
            <Feather name="check" size={18} color={palette.normal} />
          </View>
          <Text style={styles.allClearText}>All {record.parsed.values.length} values are within their reference ranges.</Text>
        </Card>
      )}

      {inRange > 0 && flagged.length > 0 ? (
        <View style={styles.inRange}>
          <View style={styles.inRangeIcon}>
            <Feather name="check" size={14} color={palette.normal} />
          </View>
          <Text style={styles.inRangeText}>
            <Text style={styles.inRangeNum}>{inRange} </Text>
            other value{inRange > 1 ? "s are" : " is"} in the normal range
          </Text>
        </View>
      ) : null}

      <Pressable
        onPress={onAsk}
        style={styles.askBar}
        accessibilityRole="button"
        accessibilityLabel="Ask a follow-up question about this report"
      >
        <Feather name="message-circle" size={18} color={palette.accentDeep} />
        <Text style={styles.askText}>Ask about this report…</Text>
      </Pressable>

      <View style={{ marginTop: space.md }}>
        <DelegationCard
          compact
          title="Want a deeper read?"
          sub="Re-run with MedPsy-4B on your MacBook over a private peer link."
          cta="Go deeper"
          onPress={onDeeper}
        />
      </View>

      <View style={styles.provenance}>
        <Feather name="shield" size={12} color={palette.inkTertiary} />
        <Text style={styles.provenanceText}>{provenanceLine(record)}</Text>
      </View>
    </Screen>
  );
}

function provenanceLine(r: HealthRecord): string {
  const parts = [`Explained by ${r.engine}`];
  if (r.stats?.ttftMs) parts.push(`${Math.round(r.stats.ttftMs)} ms`);
  if (r.servedBy === "delegated") {
    // The report was sent to the paired laptop — be truthful about egress.
    parts.push("encrypted peer link · no cloud");
  } else {
    if (r.stats?.backend) parts.push(r.stats.backend);
    parts.push("0 network calls");
  }
  return parts.join(" · ");
}

function FlagCard({ v }: { v: LabValue }) {
  const tone = v.tone === "high" ? palette.high : palette.low;
  const note = markerNote(v.name, v.tone === "high" ? "high" : "low", v.range.text);
  const label = `${v.name}: ${v.valueText} ${v.unit}, ${v.tone === "high" ? "high" : "low"}, reference ${v.range.text}. ${note}`;
  return (
    <Card style={styles.flagCard} elevation="soft" accessible accessibilityLabel={label}>
      <View style={[styles.flagAccent, { backgroundColor: tone }]} />
      <View style={styles.flagHead}>
        <Text style={styles.flagName}>{v.name}</Text>
        <View style={styles.flagNumWrap}>
          <Text style={[styles.flagNum, { color: tone }]}>{v.valueText}</Text>
          <Text style={styles.flagUnit}>{v.unit}</Text>
        </View>
      </View>
      <RangeBar pos={v.pos} tone={v.tone === "high" ? "high" : "low"} />
      <View style={styles.trackLabels}>
        <Text style={styles.trackEnd}>Low</Text>
        <Text style={styles.trackEnd}>Ref {v.range.text}</Text>
        <Text style={styles.trackEnd}>High</Text>
      </View>
      <View style={styles.flagNoteRow}>
        <Tag label={v.tone === "high" ? "High" : "Low"} tone={v.tone} icon={v.tone === "high" ? "arrow-up" : "arrow-down"} />
        <Text style={styles.flagNote}>{note}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },

  titleBlock: { marginTop: space.xl },
  kicker: { ...(t.caption as object), color: palette.accent } as TextStyle,
  title: { ...(t.display as object), color: palette.ink, marginTop: space.sm } as TextStyle,

  summaryCard: { marginTop: space.xl },
  summaryHead: { flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.sm },
  medpsyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.accent },
  summaryHeadText: { ...(t.caption as object), color: palette.inkTertiary } as TextStyle,
  summaryText: { fontFamily: font.regular, fontSize: 17, lineHeight: 26, color: palette.ink } as TextStyle,

  sectionHead: { marginTop: space["2xl"], marginBottom: space.md, flexDirection: "row", alignItems: "center", gap: space.sm },
  sectionLabel: { ...(t.caption as object), color: palette.inkTertiary } as TextStyle,
  countPill: { minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: radius.pill, backgroundColor: palette.highSoft, alignItems: "center", justifyContent: "center" },
  countPillText: { fontFamily: font.bold, fontSize: 11, color: palette.high } as TextStyle,

  allClear: { marginTop: space.xl, flexDirection: "row", alignItems: "center", gap: space.md },
  allClearIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.normalSoft, alignItems: "center", justifyContent: "center" },
  neutralIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.surfaceSunken, alignItems: "center", justifyContent: "center" },
  allClearText: { ...(t.bodyStrong as object), color: palette.ink, flex: 1, minWidth: 0 } as TextStyle,

  fallbackNote: { marginTop: space.md, flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: palette.highSoft, borderRadius: radius.md, paddingVertical: 10, paddingHorizontal: space.md },
  fallbackNoteText: { ...(t.small as object), color: palette.high, flex: 1, minWidth: 0 } as TextStyle,

  flagCard: { gap: space.md, overflow: "hidden", paddingLeft: space.lg + 3 },
  flagAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3 },
  flagHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  flagName: { ...(t.bodyStrong as object), color: palette.ink, flex: 1, minWidth: 0 } as TextStyle,
  flagNumWrap: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  flagNum: { ...(t.numeral as object) } as TextStyle,
  flagUnit: { ...(t.small as object), color: palette.inkTertiary } as TextStyle,
  trackLabels: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: -2 },
  trackEnd: { fontFamily: font.medium, fontSize: 11, color: palette.inkTertiary } as TextStyle,
  flagNoteRow: { flexDirection: "row", gap: space.sm, alignItems: "flex-start" },
  flagNote: { ...(t.small as object), color: palette.inkSecondary, flex: 1, minWidth: 0 } as TextStyle,

  inRange: { marginTop: space.md, flexDirection: "row", alignItems: "center", gap: space.md, backgroundColor: palette.normalSoft, borderRadius: radius.lg, padding: space.lg },
  inRangeIcon: { width: 26, height: 26, borderRadius: 13, backgroundColor: palette.surface, alignItems: "center", justifyContent: "center" },
  inRangeText: { ...(t.small as object), color: palette.normal, flex: 1, minWidth: 0 } as TextStyle,
  inRangeNum: { fontFamily: font.bold, color: palette.normal } as TextStyle,

  askBar: { marginTop: space.xl, flexDirection: "row", alignItems: "center", gap: space.md, backgroundColor: palette.surface, borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.hairlineStrong, paddingVertical: 15, paddingHorizontal: space.lg, ...shadow.soft },
  askText: { ...(t.body as object), color: palette.inkTertiary } as TextStyle,

  provenance: { marginTop: space.xl, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  provenanceText: { fontFamily: font.medium, fontSize: 12, color: palette.inkTertiary } as TextStyle,
});
