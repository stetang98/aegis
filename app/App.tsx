/**
 * Aegis — offline private health copilot. Product shell (Calm-Clinical · Light Luxury).
 *
 * Presentational screens with no top-level @qvac/sdk import, so the UI also bundles
 * for web (react-native-web) during design iteration. On-device features (OCR,
 * MedPsy, RAG, P2P delegation) wire through a platform-guarded service layer.
 *
 * The two-button "spike" (verified on-device GPU inference: TTFT 432ms, 44.6 tok/s)
 * lives in git history; this is the real interface.
 */
import { View, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import {
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Fraunces_700Bold_Italic,
  Fraunces_900Black,
} from "@expo-google-fonts/fraunces";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { HomeScreen } from "./src/screens/HomeScreen";
import { ResultScreen } from "./src/screens/ResultScreen";
import { palette } from "./src/theme/tokens";

// Web-only design-preview switch (e.g. localhost:8081?screen=result).
// On a device this is always null, so Home is the entry screen.
const previewScreen =
  Platform.OS === "web" && typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("screen")
    : null;

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Fraunces_700Bold_Italic,
    Fraunces_900Black,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {fontsLoaded ? (
        previewScreen === "result" ? <ResultScreen /> : <HomeScreen />
      ) : (
        <View style={{ flex: 1, backgroundColor: palette.bg }} />
      )}
    </SafeAreaProvider>
  );
}
