/**
 * Intake screen — paste a lab report (or load the sample), then analyze. Camera→OCR is a
 * device feature wired later; on web/preview the paste path is the route. Prop-driven.
 */
import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, TextStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { palette, space, radius, type as t, shadow, font } from "../theme/tokens";
import { Screen, IconButton, PrimaryButton } from "../components/ui";
import { SAMPLE_REPORT } from "../lib/sample";

interface IntakeScreenProps {
  mode: "scan" | "paste";
  analyzing: boolean;
  error?: string | null;
  onAnalyze: (text: string) => void;
  onClearError: () => void;
  onBack: () => void;
}

export function IntakeScreen({ mode, analyzing, error, onAnalyze, onClearError, onBack }: IntakeScreenProps) {
  const [text, setText] = useState("");
  const canAnalyze = text.trim().length > 0 && !analyzing;

  return (
    <Screen>
      <View style={styles.topBar}>
        <IconButton icon="chevron-left" onPress={onBack} label="Back" />
        <Text style={styles.title} accessibilityRole="header">
          New report
        </Text>
        <View style={{ width: 44 }} />
      </View>

      {mode === "scan" ? (
        <View style={styles.scanNote}>
          <Feather name="camera" size={16} color={palette.accentDeep} />
          <Text style={styles.scanNoteText}>
            Camera scanning runs on your device. Paste the report text here, or load the sample.
          </Text>
        </View>
      ) : null}

      <Text style={styles.label}>REPORT TEXT</Text>
      <View style={styles.well}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={(v) => {
            setText(v);
            if (error) onClearError();
          }}
          placeholder="Paste your lab report here…"
          placeholderTextColor={palette.inkTertiary}
          multiline
          textAlignVertical="top"
          autoCorrect={false}
          editable={!analyzing}
          accessibilityLabel="Report text"
        />
      </View>

      <Pressable
        onPress={() => {
          setText(SAMPLE_REPORT);
          if (error) onClearError();
        }}
        disabled={analyzing}
        hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
        style={({ pressed }) => [styles.sampleBtn, pressed && { opacity: 0.6 }]}
        accessibilityRole="button"
        accessibilityLabel="Use the sample report"
      >
        <Feather name="file-text" size={15} color={palette.accent} />
        <Text style={styles.sampleText}>Use sample report</Text>
      </Pressable>

      <View style={styles.spacer} />

      {error ? (
        <View style={styles.errorBox} accessibilityLiveRegion="polite" accessibilityRole="alert">
          <Feather name="alert-circle" size={15} color={palette.high} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {analyzing ? (
        <View style={styles.analyzing} accessibilityLiveRegion="polite">
          <ActivityIndicator color={palette.accent} />
          <Text style={styles.analyzingText}>Reading on-device…</Text>
        </View>
      ) : (
        <PrimaryButton
          label="Explain this report"
          icon="arrow-right"
          onPress={() => onAnalyze(text)}
          disabled={!canAnalyze}
        />
      )}
      <Text style={styles.privacy}>Processed on this device unless you pair a laptop. No cloud.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { ...(t.h2 as object), color: palette.ink } as TextStyle,

  scanNote: {
    marginTop: space.xl,
    flexDirection: "row",
    gap: space.sm,
    alignItems: "center",
    backgroundColor: palette.accentSoft,
    borderRadius: radius.md,
    padding: space.md,
  },
  scanNoteText: { ...(t.small as object), color: palette.accentDeep, flex: 1, minWidth: 0 } as TextStyle,

  label: { ...(t.caption as object), color: palette.inkTertiary, marginTop: space.xl, marginBottom: space.sm } as TextStyle,
  well: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    padding: space.lg,
    minHeight: 200,
    ...shadow.soft,
  },
  input: { fontFamily: font.regular, fontSize: 15, lineHeight: 22, color: palette.ink, minHeight: 170 } as TextStyle,

  sampleBtn: { marginTop: space.md, flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: space.xs },
  sampleText: { fontFamily: font.semibold, fontSize: 14, color: palette.accent } as TextStyle,

  spacer: { height: space.xl },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    backgroundColor: palette.highSoft,
    borderRadius: radius.md,
    padding: space.md,
    marginBottom: space.md,
  },
  errorText: { ...(t.small as object), color: palette.high, flex: 1, minWidth: 0 } as TextStyle,
  analyzing: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.md, paddingVertical: 16 },
  analyzingText: { ...(t.bodyStrong as object), color: palette.accentDeep } as TextStyle,
  privacy: { fontFamily: font.medium, fontSize: 12, color: palette.inkTertiary, textAlign: "center", marginTop: space.md } as TextStyle,
});
