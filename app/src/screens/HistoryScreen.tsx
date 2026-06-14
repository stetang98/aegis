/** History — a scannable list of all saved reports. Prop-driven. */
import { View, Text, Pressable, StyleSheet, TextStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { palette, space, radius, type as t } from "../theme/tokens";
import { Screen, Card, IconButton, Tag } from "../components/ui";
import { formatDate } from "../lib/format";
import type { HealthRecord } from "../services/types";

interface HistoryScreenProps {
  records: HealthRecord[];
  onOpen: (r: HealthRecord) => void;
  onBack: () => void;
}

export function HistoryScreen({ records, onOpen, onBack }: HistoryScreenProps) {
  return (
    <Screen>
      <View style={styles.topBar}>
        <IconButton icon="chevron-left" onPress={onBack} label="Back" />
        <Text style={styles.title} accessibilityRole="header">
          History
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <Text style={styles.count}>
        {records.length} report{records.length === 1 ? "" : "s"} · stored on this device
      </Text>

      {records.length === 0 ? (
        <Card style={styles.empty} elevation="soft">
          <Text style={styles.emptyText}>No reports yet.</Text>
        </Card>
      ) : (
        <View style={{ gap: space.sm, marginTop: space.md }}>
          {records.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => onOpen(r)}
              accessibilityRole="button"
              accessibilityLabel={`${r.title}, ${formatDate(r.ts)}`}
              style={({ pressed }) => [pressed && { opacity: 0.9 }]}
            >
              <Card style={styles.row} elevation="soft">
                <View style={styles.rowIcon}>
                  <Feather name="file-text" size={16} color={palette.accentDeep} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {r.title}
                  </Text>
                  <Text style={styles.rowDate}>{formatDate(r.ts)}</Text>
                </View>
                {r.parsed.flaggedCount > 0 ? (
                  <Tag label={`${r.parsed.flaggedCount}`} tone="high" />
                ) : (
                  <Tag label="OK" tone="normal" icon="check" />
                )}
                <Feather name="chevron-right" size={18} color={palette.inkTertiary} />
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { ...(t.h2 as object), color: palette.ink } as TextStyle,
  count: { ...(t.small as object), color: palette.inkTertiary, marginTop: space.lg } as TextStyle,
  empty: { marginTop: space.xl, alignItems: "center", paddingVertical: space["2xl"] },
  emptyText: { ...(t.body as object), color: palette.inkTertiary } as TextStyle,
  row: { flexDirection: "row", alignItems: "center", gap: space.md },
  rowIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: palette.accentSoft, alignItems: "center", justifyContent: "center" },
  rowTitle: { ...(t.bodyStrong as object), color: palette.ink } as TextStyle,
  rowDate: { ...(t.small as object), color: palette.inkTertiary, marginTop: 1 } as TextStyle,
});
