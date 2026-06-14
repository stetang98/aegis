/**
 * Pair device — connect to a nearby laptop running the Aegis provider so heavy analysis
 * delegates to MedPsy-4B over a private Hyperswarm peer link. On device you'd scan the
 * provider's QR; here you paste its public key. Prop-driven.
 */
import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, TextStyle } from "react-native";
import { Feather } from "@expo/vector-icons";
import { palette, space, radius, type as t, shadow, font } from "../theme/tokens";
import { Screen, Card, IconButton, PrimaryButton } from "../components/ui";

interface PairScreenProps {
  connected: boolean;
  onConnect: (key: string) => void;
  onBack: () => void;
}

const STEPS = [
  "Run the Aegis provider on your laptop — it loads MedPsy-4B and prints a public key.",
  "On a phone you'd scan its QR; here, paste the key below.",
  "Heavy reports then run on the laptop over an encrypted peer link — still no cloud.",
];

const HYPERSWARM_KEY = /^[0-9a-fA-F]{64}$/;

export function PairScreen({ connected, onConnect, onBack }: PairScreenProps) {
  const [key, setKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleConnect() {
    const k = key.trim();
    if (!HYPERSWARM_KEY.test(k)) {
      setError("That doesn't look like a valid key — it should be 64 hex characters from the laptop provider.");
      return;
    }
    setError(null);
    onConnect(k);
  }

  return (
    <Screen>
      <View style={styles.topBar}>
        <IconButton icon="chevron-left" onPress={onBack} label="Back" />
        <Text style={styles.title} accessibilityRole="header">
          Pair device
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <Feather name="cpu" size={20} color={palette.accentRing} />
        </View>
        <Text style={styles.heroTitle}>Borrow a bigger brain</Text>
        <Text style={styles.heroSub}>
          Your phone runs MedPsy-1.7B offline. Pair a nearby laptop to delegate to the larger,
          more accurate MedPsy-4B over a private peer-to-peer link.
        </Text>
      </View>

      {connected ? (
        <Card style={styles.connected} elevation="soft">
          <View style={styles.connectedIcon}>
            <Feather name="check" size={16} color={palette.normal} />
          </View>
          <Text style={styles.connectedText}>Paired. Deeper reads will run on your laptop.</Text>
        </Card>
      ) : null}

      <Text style={styles.label}>HOW IT WORKS</Text>
      <View style={{ gap: space.md }}>
        {STEPS.map((s, i) => (
          <View key={i} style={styles.step}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{i + 1}</Text>
            </View>
            <Text style={styles.stepText}>{s}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.label}>PROVIDER PUBLIC KEY</Text>
      <View style={styles.well}>
        <TextInput
          style={styles.input}
          value={key}
          onChangeText={(v) => {
            setKey(v);
            if (error) setError(null);
          }}
          placeholder="Paste the laptop's public key…"
          placeholderTextColor={palette.inkTertiary}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Provider public key"
        />
      </View>

      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}

      <View style={{ height: space.lg }} />
      <PrimaryButton
        label={connected ? "Update connection" : "Connect"}
        icon="link"
        onPress={handleConnect}
        disabled={key.trim().length === 0}
      />
      <Text style={styles.privacy}>The peer link is direct and encrypted — nothing goes to a server.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { ...(t.h2 as object), color: palette.ink } as TextStyle,

  heroCard: { marginTop: space.xl, backgroundColor: palette.surfaceInk, borderRadius: radius.xl, padding: space.xl, ...shadow.card },
  heroIcon: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: "rgba(79,163,154,0.18)", alignItems: "center", justifyContent: "center", marginBottom: space.md },
  heroTitle: { ...(t.display as object), fontSize: 24, lineHeight: 28, color: palette.inkOnDark } as TextStyle,
  heroSub: { ...(t.small as object), color: palette.inkOnDarkDim, marginTop: space.sm } as TextStyle,

  connected: { marginTop: space.lg, flexDirection: "row", alignItems: "center", gap: space.md, backgroundColor: palette.normalSoft, borderColor: palette.normalSoft },
  connectedIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: palette.surface, alignItems: "center", justifyContent: "center" },
  connectedText: { ...(t.smallStrong as object), color: palette.normal, flex: 1, minWidth: 0 } as TextStyle,

  label: { ...(t.caption as object), color: palette.inkTertiary, marginTop: space.xl, marginBottom: space.md } as TextStyle,
  step: { flexDirection: "row", gap: space.md, alignItems: "flex-start" },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: palette.accentSoft, alignItems: "center", justifyContent: "center", marginTop: 1 },
  stepNumText: { fontFamily: font.bold, fontSize: 12, color: palette.accentDeep } as TextStyle,
  stepText: { ...(t.small as object), color: palette.inkSecondary, flex: 1, minWidth: 0, lineHeight: 21 } as TextStyle,

  well: { backgroundColor: palette.surface, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: palette.hairline, paddingHorizontal: space.lg, paddingVertical: 14, ...shadow.soft },
  input: { fontFamily: font.regular, fontSize: 15, color: palette.ink } as TextStyle,

  error: { ...(t.small as object), color: palette.high, marginTop: space.md } as TextStyle,
  privacy: { fontFamily: font.medium, fontSize: 12, color: palette.inkTertiary, textAlign: "center", marginTop: space.md } as TextStyle,
});
