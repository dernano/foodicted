import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PreferencesProvider } from "./src/context/PreferencesContext";
import AppNavigator from "./src/navigation";

export default function App() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <AppNavigator />
        <StatusBar style="light" />
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}
