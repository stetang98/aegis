/**
 * Home / intake — "Calm Clinical · Light Luxury".
 * Presentational only (mock data), web-safe for design iteration. The container
 * that wires @qvac/sdk (OCR, MedPsy, RAG, P2P delegation) lands on device later.
 */
import { View, Text, Pressable, ScrollView, StyleSheet, TextStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette, space, radius, type as t, shadow, font } from "../theme/tokens";

type Recent = {
  id: string;
  title: string;
  date: string;
  flags: number;
  topValue?: { name: string; value: string; unit: string; pos: number; tone: "high" | "low"; range: string };
};

const RECENTS: Recent[] = [
  {
    id: "1",
    title: "Complete blood count",
    date: "Jun 14",
    flags: 2,
    topValue: { name: "Hemoglobin", value: "11.2", unit: "g/dL", pos: 0.16, tone: "low", range: "13.5–17.5" },
  },
  { id: "2", title: "Lipid panel", date: "May 28", flags: 0 },
];

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[palette.bgWarmTop, palette.bg, palette.bg]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: insets.top + space.lg,
          paddingBottom: insets.bottom + space["3xl"],
          paddingHorizontal: space.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand row */}
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <View style={styles.brandGlyph}>
              <Feather name="shield" size={15} color={palette.inkOnAccent} />
            </View>
            <Text style={styles.wordmark}>Aegis</Text>
          </View>
          <View style={styles.onDevice}>
            <Feather name="lock" size={10} color={palette.accentDeep} />
            <Text style={styles.onDeviceText}>ON-DEVICE</Text>
          </View>
        </View>

        {/* Hero — serif display with an italic accent word */}
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>PRIVATE HEALTH COPILOT</Text>
          <Text style={styles.heroTitle}>
            Understand your{" "}
            <Text style={styles.heroAccent}>labs</Text>.
          </Text>
          <Text style={styles.heroSub}>
            Plain-language explanations of your medical reports — flagged, tracked, and
            answered. Nothing ever leaves this device.
          </Text>
        </View>

        {/* Intake actions */}
        <View style={styles.intakeRow}>
          <IntakeTile primary icon="camera" label="Scan report" sub="Photo → OCR" />
          <IntakeTile icon="edit-3" label="Paste text" sub="Type or paste" />
        </View>

        {/* Delegation showcase — the signature feature, rich emerald gradient.
            Outer view carries the shadow; inner Pressable clips the gradient
            (overflow:hidden would otherwise eat the shadow on iOS). */}
        <View style={styles.delegateShadow}>
        <Pressable
          style={({ pressed }) => [styles.delegate, pressed && { opacity: 0.95 }]}
          accessibilityRole="button"
          accessibilityLabel="Borrow a bigger brain. Pair your nearby MacBook to run MedPsy-4B."
        >
          <LinearGradient
            colors={["#16443D", palette.surfaceInk]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.delegateGlow} />
          <View style={styles.delegateTop}>
            <View style={styles.delegateIcon}>
              <Feather name="cpu" size={15} color={palette.accentRing} />
            </View>
            <View style={styles.delegateLive}>
              <View style={styles.liveDot} />
              <Text style={styles.delegateLiveText}>MACBOOK NEARBY</Text>
            </View>
          </View>
          <Text style={styles.delegateTitle}>Borrow a bigger brain</Text>
          <Text style={styles.delegateSub}>
            Hand off to MedPsy-4B on your laptop over a private peer link — deeper analysis,
            still fully offline.
          </Text>
          <View style={styles.delegateCta}>
            <Text style={styles.delegateCtaText}>Pair device</Text>
            <Feather name="arrow-right" size={15} color={palette.ink} />
          </View>
        </Pressable>
        </View>

        {/* Recent */}
        <View style={styles.recentHead}>
          <Text style={styles.sectionLabel}>RECENT</Text>
          <Pressable hitSlop={12} accessibilityRole="button" accessibilityLabel="See all records">
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        <View style={{ gap: space.md }}>
          {RECENTS.map((r) => (
            <RecordRow key={r.id} r={r} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function IntakeTile({
  icon,
  label,
  sub,
  primary,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  sub: string;
  primary?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.985 }] }]}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${sub}`}
    >
      <View style={styles.tileCard}>
        <View style={[styles.tileIcon, primary ? styles.tileIconPrimary : styles.tileIconNeutral]}>
          <Feather name={icon} size={20} color={primary ? palette.inkOnAccent : palette.accentDeep} />
        </View>
        <Text style={styles.tileLabel}>{label}</Text>
        <Text style={styles.tileSub}>{sub}</Text>
      </View>
    </Pressable>
  );
}

function RecordRow({ r }: { r: Recent }) {
  const flagged = r.flags > 0;
  return (
    <Pressable
      style={({ pressed }) => [pressed && { opacity: 0.9 }]}
      accessibilityRole="button"
      accessibilityLabel={`${r.title}, ${r.date}, ${flagged ? `${r.flags} values flagged` : "all in range"}`}
    >
      <View style={[styles.record, flagged && styles.recordFlagged]}>
        <View style={styles.recordTop}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.recordTitle}>{r.title}</Text>
            <Text style={styles.recordDate}>{r.date}</Text>
          </View>
          {flagged ? (
            <View style={[styles.tag, { backgroundColor: palette.highSoft }]}>
              <View style={[styles.tagDot, { backgroundColor: palette.high }]} />
              <Text style={[styles.tagText, { color: palette.high }]}>{r.flags} flagged</Text>
            </View>
          ) : (
            <View style={[styles.tag, { backgroundColor: palette.normalSoft }]}>
              <Feather name="check" size={11} color={palette.normal} />
              <Text style={[styles.tagText, { color: palette.normal }]}>In range</Text>
            </View>
          )}
        </View>
        {r.topValue ? (
          <View style={styles.recordValue}>
            <View style={styles.recordValueHead}>
              <Text style={styles.recordValueName}>{r.topValue.name}</Text>
              <View style={styles.recordNumWrap}>
                <Text style={[styles.recordNum, { color: palette.low }]}>{r.topValue.value}</Text>
                <Text style={styles.recordUnit}>{r.topValue.unit}</Text>
              </View>
            </View>
            <View style={styles.rangeTrack}>
              <View style={styles.rangeBand} />
              <View style={[styles.rangeDot, { left: `${r.topValue.pos * 100}%`, backgroundColor: palette.low }]} />
            </View>
            <View style={styles.rangeLabels}>
              <Text style={styles.rangeLabel}>Low</Text>
              <Text style={styles.rangeRef}>Ref {r.topValue.range}</Text>
              <Text style={styles.rangeLabel}>High</Text>
            </View>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.bg, width: "100%" },
  scroll: { flex: 1, width: "100%" },

  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandMark: { flexDirection: "row", alignItems: "center", gap: space.sm },
  brandGlyph: {
    width: 27,
    height: 27,
    borderRadius: 9,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: { fontFamily: font.display, fontSize: 20, color: palette.ink, letterSpacing: -0.2 } as TextStyle,
  onDevice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: palette.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  onDeviceText: { fontFamily: font.semibold, fontSize: 10, letterSpacing: 1, color: palette.accentDeep } as TextStyle,

  hero: { marginTop: space["3xl"], marginBottom: space.xl },
  eyebrow: { ...(t.caption as object), color: palette.accent } as TextStyle,
  heroTitle: { ...(t.hero as object), color: palette.ink, marginTop: space.md } as TextStyle,
  heroAccent: { fontFamily: font.displayItalic, color: palette.accent } as TextStyle,
  heroSub: { ...(t.body as object), color: palette.inkSecondary, marginTop: space.lg, maxWidth: 348 } as TextStyle,

  intakeRow: { flexDirection: "row", gap: space.md },
  tile: { flex: 1, minWidth: 0 },
  tileCard: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    padding: space.lg,
    paddingVertical: space.xl,
    gap: space.sm,
    ...shadow.card,
  },
  tileIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: space.xs },
  tileIconPrimary: { backgroundColor: palette.accent },
  tileIconNeutral: { backgroundColor: palette.accentSoft },
  tileLabel: { ...(t.h3 as object), color: palette.ink } as TextStyle,
  tileSub: { ...(t.small as object), color: palette.inkTertiary } as TextStyle,

  delegateShadow: {
    marginTop: space.xl,
    borderRadius: radius.xl,
    backgroundColor: "#16443D", // match LinearGradient start to avoid a dark seam at rounded corners
    ...shadow.raised,
  },
  delegate: {
    borderRadius: radius.xl,
    padding: space.xl,
    overflow: "hidden",
  },
  delegateGlow: {
    position: "absolute",
    top: -70,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: palette.accentRing,
    opacity: 0.18,
  },
  delegateTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.lg },
  delegateIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    backgroundColor: "rgba(79,163,154,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  delegateLive: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.accentRing },
  delegateLiveText: { fontFamily: font.semibold, fontSize: 10, letterSpacing: 1, color: palette.accentRing } as TextStyle,
  delegateTitle: { ...(t.display as object), fontSize: 26, lineHeight: 30, color: palette.inkOnDark } as TextStyle,
  delegateSub: { ...(t.small as object), color: palette.inkOnDarkDim, marginTop: space.sm, maxWidth: 326 } as TextStyle,
  delegateCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: palette.inkOnDark,
    alignSelf: "flex-start",
    paddingVertical: 11,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    marginTop: space.xl,
  },
  delegateCtaText: { fontFamily: font.semibold, fontSize: 15, color: palette.ink } as TextStyle,

  recentHead: {
    marginTop: space["2xl"],
    marginBottom: space.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionLabel: { ...(t.caption as object), color: palette.inkTertiary } as TextStyle,
  seeAll: { fontFamily: font.semibold, fontSize: 14, color: palette.accent } as TextStyle,

  record: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    padding: space.lg,
    gap: space.lg,
    ...shadow.soft,
  },
  recordFlagged: { borderLeftWidth: 3, borderLeftColor: palette.high },
  recordTop: { flexDirection: "row", alignItems: "flex-start", gap: space.md },
  recordTitle: { ...(t.bodyStrong as object), color: palette.ink } as TextStyle,
  recordDate: { ...(t.small as object), color: palette.inkTertiary, marginTop: 2 } as TextStyle,
  tag: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagText: { fontFamily: font.semibold, fontSize: 12 } as TextStyle,

  recordValue: { gap: space.sm },
  recordValueHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  recordValueName: { ...(t.small as object), color: palette.inkSecondary } as TextStyle,
  recordNumWrap: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  recordNum: { ...(t.numeral as object) } as TextStyle,
  recordUnit: { ...(t.small as object), color: palette.inkTertiary } as TextStyle,
  rangeTrack: { height: 8, borderRadius: 4, backgroundColor: palette.surfaceSunken, justifyContent: "center", marginTop: 2 },
  rangeBand: { position: "absolute", left: "32%", width: "44%", height: 8, borderRadius: 4, backgroundColor: palette.normalSoft },
  rangeDot: { position: "absolute", top: "50%", width: 13, height: 13, borderRadius: 7, marginLeft: -6.5, marginTop: -6.5, borderWidth: 2, borderColor: palette.surface },
  rangeLabels: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rangeLabel: { fontFamily: font.medium, fontSize: 11, color: palette.inkTertiary } as TextStyle,
  rangeRef: { fontFamily: font.medium, fontSize: 11, color: palette.inkTertiary } as TextStyle,
});
