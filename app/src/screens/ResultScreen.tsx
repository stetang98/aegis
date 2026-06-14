/**
 * Result / explanation screen — the core value of Aegis.
 * After a report is scanned/pasted, MedPsy explains it in plain language and
 * flags out-of-range values. Presentational only (mock MedPsy output), web-safe.
 */
import { View, Text, Pressable, ScrollView, StyleSheet, TextStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette, space, radius, type as t, shadow, font } from "../theme/tokens";

type Flag = {
  name: string;
  value: string;
  unit: string;
  tone: "high" | "low";
  range: string;
  pos: number; // 0..1 marker position across the bar
  note: string;
};

const SUMMARY =
  "Your blood count is mostly healthy. Three values fall outside the usual range — none is an emergency, but they're worth raising with your doctor.";

const FLAGS: Flag[] = [
  {
    name: "Hemoglobin",
    value: "11.2",
    unit: "g/dL",
    tone: "low",
    range: "13.5–17.5",
    pos: 0.14,
    note: "Slightly low. This can cause tiredness or shortness of breath, and is often linked to low iron.",
  },
  {
    name: "Fasting glucose",
    value: "7.8",
    unit: "mmol/L",
    tone: "high",
    range: "3.9–5.5",
    pos: 0.86,
    note: "Above the typical fasting range, which can point toward prediabetes. A repeat test is usually advised.",
  },
  {
    name: "LDL cholesterol",
    value: "4.1",
    unit: "mmol/L",
    tone: "high",
    range: "< 3.0",
    pos: 0.82,
    note: "Higher than ideal. LDL is the 'bad' cholesterol tied to heart risk over time.",
  },
];

export function ResultScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[palette.bgWarmTop, palette.bg, palette.bg]}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: insets.top + space.md,
          paddingBottom: insets.bottom + space["4xl"],
          paddingHorizontal: space.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Pressable onPress={() => {}} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
            <Feather name="chevron-left" size={22} color={palette.ink} />
          </Pressable>
          <View style={styles.sourceTag}>
            <Feather name="lock" size={10} color={palette.accentDeep} />
            <Text style={styles.sourceTagText}>ON-DEVICE</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.kicker}>BLOOD REPORT · JUN 14</Text>
          <Text style={styles.title}>Complete blood count</Text>
        </View>

        {/* Plain-language summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHead}>
            <View style={styles.medpsyDot} />
            <Text style={styles.summaryHeadText}>What this means</Text>
          </View>
          <Text style={styles.summaryText}>{SUMMARY}</Text>
        </View>

        {/* Needs attention */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionLabel}>NEEDS ATTENTION</Text>
          <View style={styles.countPill}>
            <Text style={styles.countPillText}>{FLAGS.length}</Text>
          </View>
        </View>

        <View style={{ gap: space.md }}>
          {FLAGS.map((f) => (
            <FlagCard key={f.name} f={f} />
          ))}
        </View>

        {/* In range */}
        <Pressable
          onPress={() => {}}
          style={styles.inRange}
          accessibilityRole="button"
          accessibilityLabel="9 other values are in the normal range. View all."
        >
          <View style={styles.inRangeIcon}>
            <Feather name="check" size={14} color={palette.normal} />
          </View>
          <Text style={styles.inRangeText}>
            <Text style={styles.inRangeNum}>9 </Text>
            other values are in the normal range
          </Text>
          <Feather name="chevron-right" size={18} color={palette.inkTertiary} />
        </Pressable>

        {/* Ask a follow-up */}
        <Pressable
          onPress={() => {}}
          style={styles.askBar}
          accessibilityRole="button"
          accessibilityLabel="Ask a follow-up question about this report"
        >
          <Feather name="message-circle" size={18} color={palette.accentDeep} />
          <Text style={styles.askText}>Ask about this report…</Text>
        </Pressable>

        {/* Go deeper — delegation */}
        <View style={styles.deeperShadow}>
          <Pressable
            onPress={() => {}}
            style={({ pressed }) => [styles.deeper, pressed && { opacity: 0.95 }]}
            accessibilityRole="button"
            accessibilityLabel="Go deeper. Re-analyze with MedPsy-4B on your nearby MacBook."
          >
            <LinearGradient
              colors={["#16443D", palette.surfaceInk]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.deeperGlow} />
            <View style={styles.deeperRow}>
              <View style={styles.deeperIcon}>
                <Feather name="cpu" size={16} color={palette.accentRing} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.deeperTitle}>Want a deeper read?</Text>
                <Text style={styles.deeperSub}>Re-run with MedPsy-4B on your MacBook</Text>
              </View>
              <Feather name="arrow-right" size={18} color={palette.inkOnDark} />
            </View>
          </Pressable>
        </View>

        {/* Provenance / trust */}
        <View style={styles.provenance}>
          <Feather name="shield" size={12} color={palette.inkTertiary} />
          <Text style={styles.provenanceText}>
            Explained on-device by MedPsy · 432 ms · 0 network calls
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function FlagCard({ f }: { f: Flag }) {
  const tone = f.tone === "high" ? palette.high : palette.low;
  const toneSoft = f.tone === "high" ? palette.highSoft : palette.lowSoft;
  return (
    <View style={styles.flagCard}>
      <View style={[styles.flagAccent, { backgroundColor: tone }]} />
      <View style={styles.flagHead}>
        <Text style={styles.flagName}>{f.name}</Text>
        <View style={styles.flagNumWrap}>
          <Text style={[styles.flagNum, { color: tone }]}>{f.value}</Text>
          <Text style={styles.flagUnit}>{f.unit}</Text>
        </View>
      </View>

      <View style={styles.track}>
        <View style={styles.band} />
        <View style={[styles.dot, { left: `${f.pos * 100}%`, backgroundColor: tone }]} />
      </View>
      <View style={styles.trackLabels}>
        <Text style={styles.trackEnd}>Low</Text>
        <Text style={styles.trackEnd}>Ref {f.range}</Text>
        <Text style={styles.trackEnd}>High</Text>
      </View>

      <View style={styles.flagNoteRow}>
        <View style={[styles.flagBadge, { backgroundColor: toneSoft }]}>
          <Feather name={f.tone === "high" ? "arrow-up" : "arrow-down"} size={11} color={tone} />
          <Text style={[styles.flagBadgeText, { color: tone }]}>{f.tone === "high" ? "High" : "Low"}</Text>
        </View>
        <Text style={styles.flagNote}>{f.note}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg, width: "100%" },
  scroll: { flex: 1, width: "100%" },

  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: palette.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  sourceTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: palette.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  sourceTagText: { fontFamily: font.semibold, fontSize: 10, letterSpacing: 1, color: palette.accentDeep } as TextStyle,

  titleBlock: { marginTop: space.xl },
  kicker: { ...(t.caption as object), color: palette.accent } as TextStyle,
  title: { ...(t.display as object), color: palette.ink, marginTop: space.sm } as TextStyle,

  summaryCard: {
    marginTop: space.xl,
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    padding: space.lg,
    ...shadow.card,
  },
  summaryHead: { flexDirection: "row", alignItems: "center", gap: space.sm, marginBottom: space.sm },
  medpsyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.accent },
  summaryHeadText: { ...(t.caption as object), color: palette.inkTertiary } as TextStyle,
  summaryText: { ...(t.body as object), color: palette.ink, fontSize: 17, lineHeight: 26 } as TextStyle,

  sectionHead: {
    marginTop: space["2xl"],
    marginBottom: space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  sectionLabel: { ...(t.caption as object), color: palette.inkTertiary } as TextStyle,
  countPill: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: palette.highSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  countPillText: { fontFamily: font.bold, fontSize: 11, color: palette.high } as TextStyle,

  flagCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    padding: space.lg,
    paddingLeft: space.lg + 3,
    gap: space.md,
    overflow: "hidden",
    ...shadow.soft,
  },
  flagAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 3 },
  flagHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  flagName: { ...(t.bodyStrong as object), color: palette.ink, flex: 1, minWidth: 0 } as TextStyle,
  flagNumWrap: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  flagNum: { ...(t.numeral as object) } as TextStyle,
  flagUnit: { ...(t.small as object), color: palette.inkTertiary } as TextStyle,

  track: { width: "100%", height: 8, borderRadius: 4, backgroundColor: palette.surfaceSunken, justifyContent: "center" },
  band: { position: "absolute", left: "30%", width: "40%", height: 8, borderRadius: 4, backgroundColor: palette.normalSoft },
  dot: {
    position: "absolute",
    top: "50%",
    width: 13,
    height: 13,
    borderRadius: 7,
    marginLeft: -6.5,
    marginTop: -6.5,
    borderWidth: 2,
    borderColor: palette.surface,
  },
  trackLabels: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: -2 },
  trackEnd: { fontFamily: font.medium, fontSize: 11, color: palette.inkTertiary } as TextStyle,

  flagNoteRow: { flexDirection: "row", gap: space.sm, alignItems: "flex-start" },
  flagBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    marginTop: 1,
  },
  flagBadgeText: { fontFamily: font.bold, fontSize: 11 } as TextStyle,
  flagNote: { ...(t.small as object), color: palette.inkSecondary, flex: 1, minWidth: 0 } as TextStyle,

  inRange: {
    marginTop: space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    backgroundColor: palette.normalSoft,
    borderRadius: radius.lg,
    padding: space.lg,
  },
  inRangeIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: palette.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  inRangeText: { ...(t.small as object), color: palette.normal, flex: 1, minWidth: 0 } as TextStyle,
  inRangeNum: { fontFamily: font.bold, color: palette.normal } as TextStyle,

  askBar: {
    marginTop: space.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    backgroundColor: palette.surface,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairlineStrong,
    paddingVertical: 15,
    paddingHorizontal: space.lg,
    ...shadow.soft,
  },
  askText: { ...(t.body as object), color: palette.inkTertiary } as TextStyle,

  deeperShadow: { marginTop: space.md, borderRadius: radius.xl, backgroundColor: "#16443D", ...shadow.card },
  deeper: { borderRadius: radius.xl, padding: space.lg, overflow: "hidden" },
  deeperGlow: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: palette.accentRing,
    opacity: 0.16,
  },
  deeperRow: { flexDirection: "row", alignItems: "center", gap: space.md },
  deeperIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: "rgba(79,163,154,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  deeperTitle: { fontFamily: font.semibold, fontSize: 16, color: palette.inkOnDark } as TextStyle,
  deeperSub: { ...(t.small as object), color: palette.inkOnDarkDim, marginTop: 1 } as TextStyle,

  provenance: { marginTop: space.xl, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  provenanceText: { fontFamily: font.medium, fontSize: 12, color: palette.inkTertiary } as TextStyle,
});
