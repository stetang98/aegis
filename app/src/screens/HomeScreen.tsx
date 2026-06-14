/**
 * Home / intake — "Calm Clinical · Light Luxury". Prop-driven: shows real saved records
 * (or an empty state) and routes to intake / a record / history / delegation pairing.
 */
import { View, Text, Pressable, StyleSheet, TextStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { palette, space, radius, type as t, font } from "../theme/tokens";
import { Screen, Card, OnDevicePill, Tag, RangeBar, DelegationCard } from "../components/ui";
import { formatDate } from "../lib/format";
import type { HealthRecord } from "../services/types";

interface HomeScreenProps {
  records: HealthRecord[];
  onNewReport: (mode: "scan" | "paste") => void;
  onOpenRecord: (r: HealthRecord) => void;
  onSeeAll: () => void;
  onDelegation: () => void;
}

export function HomeScreen({ records, onNewReport, onOpenRecord, onSeeAll, onDelegation }: HomeScreenProps) {
  return (
    <Screen>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <View style={styles.brandGlyph}>
            <Feather name="shield" size={15} color={palette.inkOnAccent} />
          </View>
          <Text style={styles.wordmark}>Aegis</Text>
        </View>
        <OnDevicePill />
      </View>

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>PRIVATE HEALTH COPILOT</Text>
        <Text style={styles.heroTitle} accessibilityRole="header">
          Understand your <Text style={styles.heroAccent}>labs</Text>.
        </Text>
        <Text style={styles.heroSub}>
          Plain-language explanations of your medical reports — flagged, tracked, and answered.
          Nothing ever leaves this device.
        </Text>
      </View>

      <View style={styles.intakeRow}>
        <IntakeTile primary icon="camera" label="Scan report" sub="Photo → OCR" onPress={() => onNewReport("scan")} />
        <IntakeTile icon="edit-3" label="Paste text" sub="Type or paste" onPress={() => onNewReport("paste")} />
      </View>

      <View style={{ marginTop: space.xl }}>
        <DelegationCard
          title="Borrow a bigger brain"
          sub="Hand off to MedPsy-4B on your laptop over a private peer link — deeper analysis, still fully offline."
          cta="Pair device"
          onPress={onDelegation}
        />
      </View>

      <View style={styles.recentHead}>
        <Text style={styles.sectionLabel}>RECENT</Text>
        {records.length > 0 ? (
          <Pressable hitSlop={16} onPress={onSeeAll} accessibilityRole="button" accessibilityLabel="See all records">
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        ) : null}
      </View>

      {records.length === 0 ? (
        <Card style={styles.empty} elevation="soft">
          <View style={styles.emptyIcon}>
            <Feather name="file-text" size={20} color={palette.accentDeep} />
          </View>
          <Text style={styles.emptyTitle}>No reports yet</Text>
          <Text style={styles.emptySub}>Scan or paste a lab report to get a plain-language explanation.</Text>
        </Card>
      ) : (
        <View style={{ gap: space.md }}>
          {records.slice(0, 3).map((r) => (
            <RecordRow key={r.id} r={r} onPress={() => onOpenRecord(r)} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function IntakeTile({
  icon,
  label,
  sub,
  primary,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  sub: string;
  primary?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${sub}`}
      style={({ pressed }) => [styles.tile, pressed && { transform: [{ scale: 0.985 }] }]}
    >
      <Card style={styles.tileCard} elevation="card">
        <View style={[styles.tileIcon, primary ? styles.tileIconPrimary : styles.tileIconNeutral]}>
          <Feather name={icon} size={20} color={primary ? palette.inkOnAccent : palette.accentDeep} />
        </View>
        <Text style={styles.tileLabel}>{label}</Text>
        <Text style={styles.tileSub}>{sub}</Text>
      </Card>
    </Pressable>
  );
}

function RecordRow({ r, onPress }: { r: HealthRecord; onPress: () => void }) {
  const flagged = r.parsed.flaggedCount;
  const top = r.parsed.values.find((v) => v.tone !== "normal");
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${r.title}, ${formatDate(r.ts)}, ${flagged > 0 ? `${flagged} flagged` : "all in range"}`}
      style={({ pressed }) => [pressed && { opacity: 0.9 }]}
    >
      <Card style={{ gap: space.lg }} elevation="soft">
        <View style={styles.recordTop}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.recordTitle}>{r.title}</Text>
            <Text style={styles.recordDate}>{formatDate(r.ts)}</Text>
          </View>
          {flagged > 0 ? (
            <Tag label={`${flagged} flagged`} tone="high" />
          ) : (
            <Tag label="All in range" tone="normal" icon="check" />
          )}
        </View>
        {top ? (
          <View style={{ gap: space.sm }}>
            <View style={styles.recordValueHead}>
              <Text style={styles.recordValueName}>{top.name}</Text>
              <View style={styles.recordNumWrap}>
                <Text style={[styles.recordNum, { color: top.tone === "high" ? palette.high : palette.low }]}>
                  {top.valueText}
                </Text>
                <Text style={styles.recordUnit}>{top.unit}</Text>
              </View>
            </View>
            <RangeBar pos={top.pos} tone={top.tone === "high" ? "high" : "low"} />
          </View>
        ) : null}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  brandRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandMark: { flexDirection: "row", alignItems: "center", gap: space.sm },
  brandGlyph: { width: 27, height: 27, borderRadius: 9, backgroundColor: palette.accent, alignItems: "center", justifyContent: "center" },
  wordmark: { fontFamily: font.display, fontSize: 20, color: palette.ink, letterSpacing: -0.2 } as TextStyle,

  hero: { marginTop: space["3xl"], marginBottom: space.xl },
  eyebrow: { ...(t.caption as object), color: palette.accent } as TextStyle,
  heroTitle: { ...(t.hero as object), color: palette.ink, marginTop: space.md } as TextStyle,
  heroAccent: { fontFamily: font.displayItalic, color: palette.accent } as TextStyle,
  heroSub: { ...(t.body as object), color: palette.inkSecondary, marginTop: space.lg, maxWidth: 348 } as TextStyle,

  intakeRow: { flexDirection: "row", gap: space.md },
  tile: { flex: 1, minWidth: 0 },
  tileCard: { paddingVertical: space.xl, gap: space.sm },
  tileIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: space.xs },
  tileIconPrimary: { backgroundColor: palette.accent },
  tileIconNeutral: { backgroundColor: palette.accentSoft },
  tileLabel: { ...(t.h3 as object), color: palette.ink } as TextStyle,
  tileSub: { ...(t.small as object), color: palette.inkTertiary } as TextStyle,

  recentHead: { marginTop: space["2xl"], marginBottom: space.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionLabel: { ...(t.caption as object), color: palette.inkTertiary } as TextStyle,
  seeAll: { fontFamily: font.semibold, fontSize: 14, color: palette.accent } as TextStyle,

  empty: { alignItems: "center", gap: space.sm, paddingVertical: space["2xl"] },
  emptyIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: palette.accentSoft, alignItems: "center", justifyContent: "center", marginBottom: space.xs },
  emptyTitle: { ...(t.h3 as object), color: palette.ink } as TextStyle,
  emptySub: { ...(t.small as object), color: palette.inkTertiary, textAlign: "center", maxWidth: 260 } as TextStyle,

  recordTop: { flexDirection: "row", alignItems: "flex-start", gap: space.md },
  recordTitle: { ...(t.bodyStrong as object), color: palette.ink } as TextStyle,
  recordDate: { ...(t.small as object), color: palette.inkTertiary, marginTop: 2 } as TextStyle,
  recordValueHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  recordValueName: { ...(t.small as object), color: palette.inkSecondary } as TextStyle,
  recordNumWrap: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  recordNum: { ...(t.mono as object) } as TextStyle,
  recordUnit: { ...(t.small as object), color: palette.inkTertiary } as TextStyle,
});
