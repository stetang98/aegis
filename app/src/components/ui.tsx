/**
 * Shared "Calm Clinical · Light Luxury" UI primitives.
 *
 * Pure presentational RN (no @qvac/sdk import) so every screen stays web-bundle-safe
 * for fast design iteration. Extracted from the approved Home/Result screens to keep the
 * five screens consistent and DRY. Consume design tokens — never hardcode palette/spacing.
 */
import { ReactNode } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette, space, radius, type as t, shadow, font } from "../theme/tokens";

type FeatherName = keyof typeof Feather.glyphMap;
export type Tone = "high" | "low" | "normal" | "accent" | "neutral";

const toneColors: Record<Tone, { fg: string; soft: string }> = {
  high: { fg: palette.high, soft: palette.highSoft },
  low: { fg: palette.low, soft: palette.lowSoft },
  normal: { fg: palette.normal, soft: palette.normalSoft },
  accent: { fg: palette.accentDeep, soft: palette.accentSoft },
  neutral: { fg: palette.inkSecondary, soft: palette.surfaceSunken },
};

/** Full-screen wrapper: warm gradient atmosphere + safe-area + optional scroll. */
export function Screen({
  children,
  scroll = true,
  topInset = true,
}: {
  children: ReactNode;
  scroll?: boolean;
  topInset?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const pad = {
    paddingTop: (topInset ? insets.top : 0) + space.lg,
    paddingBottom: insets.bottom + space["4xl"],
    paddingHorizontal: space.xl,
  };
  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={[palette.bgWarmTop, palette.bg, palette.bg]}
        locations={[0, 0.38, 1]}
        style={StyleSheet.absoluteFill}
      />
      {scroll ? (
        <ScrollView style={styles.scroll} contentContainerStyle={pad} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.scroll, pad, { flex: 1 }]}>{children}</View>
      )}
    </View>
  );
}

export function Card({
  children,
  style,
  elevation = "card",
  accessible,
  accessibilityLabel,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  elevation?: keyof typeof shadow | "none";
  accessible?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <View
      accessible={accessible ?? accessibilityLabel !== undefined}
      accessibilityLabel={accessibilityLabel}
      style={[styles.card, elevation !== "none" && shadow[elevation], style]}
    >
      {children}
    </View>
  );
}

/** "🔒 ON-DEVICE" trust pill. */
export function OnDevicePill() {
  return (
    <View style={styles.onDevice}>
      <Feather name="lock" size={10} color={palette.accentDeep} />
      <Text style={styles.onDeviceText}>ON-DEVICE</Text>
    </View>
  );
}

export function Tag({ label, tone = "neutral", icon }: { label: string; tone?: Tone; icon?: FeatherName }) {
  const c = toneColors[tone];
  return (
    <View style={[styles.tag, { backgroundColor: c.soft }]}>
      {icon ? <Feather name={icon} size={11} color={c.fg} /> : <View style={[styles.tagDot, { backgroundColor: c.fg }]} />}
      <Text style={[styles.tagText, { color: c.fg }]}>{label}</Text>
    </View>
  );
}

/** Reference-range bar with a marker. `tone` colors the marker; band is the normal zone. */
export function RangeBar({
  pos,
  tone = "normal",
  lowFrac = 0.3,
  highFrac = 0.7,
}: {
  pos: number;
  tone?: "high" | "low" | "normal";
  lowFrac?: number;
  highFrac?: number;
}) {
  const dotColor = tone === "high" ? palette.high : tone === "low" ? palette.low : palette.normal;
  const clamped = Math.max(0.04, Math.min(0.96, pos));
  return (
    <View style={styles.track}>
      <View style={[styles.band, { left: `${lowFrac * 100}%`, width: `${(highFrac - lowFrac) * 100}%` }]} />
      <View style={[styles.dot, { left: `${clamped * 100}%`, backgroundColor: dotColor }]} />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  icon,
  style,
  disabled,
}: {
  label: string;
  onPress?: () => void;
  icon?: FeatherName;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.primaryBtn,
        disabled && styles.primaryBtnDisabled,
        pressed && !disabled && styles.primaryBtnPressed,
        style,
      ]}
    >
      <Text style={[styles.primaryBtnText, disabled && styles.primaryBtnTextDisabled]}>{label}</Text>
      {icon ? <Feather name={icon} size={18} color={disabled ? palette.inkTertiary : palette.inkOnAccent} /> : null}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
}: {
  icon: FeatherName;
  onPress?: () => void;
  label: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.iconBtn, pressed && { opacity: 0.7 }]}
    >
      <Feather name={icon} size={22} color={palette.ink} />
    </Pressable>
  );
}

/** The signature "borrow a bigger brain" P2P-delegation card (emerald gradient). */
export function DelegationCard({
  title,
  sub,
  cta,
  liveLabel = "MACBOOK NEARBY",
  onPress,
  compact,
}: {
  title: string;
  sub: string;
  cta?: string;
  liveLabel?: string;
  onPress?: () => void;
  compact?: boolean;
}) {
  return (
    <View style={styles.delegateShadow}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${sub}`}
        style={({ pressed }) => [styles.delegate, pressed && { opacity: 0.95 }]}
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
            <Text style={styles.delegateLiveText}>{liveLabel}</Text>
          </View>
        </View>
        <Text style={[styles.delegateTitle, compact && { fontSize: 22, lineHeight: 26 }]}>{title}</Text>
        <Text style={styles.delegateSub}>{sub}</Text>
        {cta ? (
          <View style={styles.delegateCta}>
            <Text style={styles.delegateCtaText}>{cta}</Text>
            <Feather name="arrow-right" size={15} color={palette.ink} />
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.bg, width: "100%" },
  scroll: { flex: 1, width: "100%" },

  card: {
    backgroundColor: palette.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.hairline,
    padding: space.lg,
  },
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

  tag: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  tagDot: { width: 6, height: 6, borderRadius: 3 },
  tagText: { fontFamily: font.semibold, fontSize: 12 } as TextStyle,

  track: { width: "100%", height: 8, borderRadius: 4, backgroundColor: palette.surfaceSunken, justifyContent: "center" },
  band: { position: "absolute", height: 8, borderRadius: 4, backgroundColor: palette.normalSoft },
  dot: { position: "absolute", top: "50%", width: 13, height: 13, borderRadius: 7, marginLeft: -6.5, marginTop: -6.5, borderWidth: 2, borderColor: palette.surface },

  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    backgroundColor: palette.accent,
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: space.xl,
    ...shadow.soft,
  },
  primaryBtnPressed: { backgroundColor: palette.accentDeep, transform: [{ scale: 0.99 }] },
  primaryBtnDisabled: { backgroundColor: palette.surfaceSunken, shadowOpacity: 0, elevation: 0 },
  primaryBtnText: { fontFamily: font.semibold, fontSize: 16, color: palette.inkOnAccent } as TextStyle,
  primaryBtnTextDisabled: { color: palette.inkTertiary } as TextStyle,

  iconBtn: {
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

  delegateShadow: { borderRadius: radius.xl, backgroundColor: "#16443D", ...shadow.raised },
  delegate: { borderRadius: radius.xl, padding: space.xl, overflow: "hidden" },
  delegateGlow: { position: "absolute", top: -70, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: palette.accentRing, opacity: 0.18 },
  delegateTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: space.lg },
  delegateIcon: { width: 34, height: 34, borderRadius: radius.md, backgroundColor: "rgba(79,163,154,0.18)", alignItems: "center", justifyContent: "center" },
  delegateLive: { flexDirection: "row", alignItems: "center", gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: palette.accentRing },
  delegateLiveText: { fontFamily: font.semibold, fontSize: 10, letterSpacing: 1, color: palette.accentRing } as TextStyle,
  delegateTitle: { ...(t.display as object), fontSize: 26, lineHeight: 30, color: palette.inkOnDark } as TextStyle,
  delegateSub: { ...(t.small as object), color: palette.inkOnDarkDim, marginTop: space.sm, maxWidth: 326 } as TextStyle,
  delegateCta: { flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: palette.inkOnDark, alignSelf: "flex-start", paddingVertical: 11, paddingHorizontal: space.lg, borderRadius: radius.pill, marginTop: space.lg },
  delegateCtaText: { fontFamily: font.semibold, fontSize: 15, color: palette.ink } as TextStyle,
});
