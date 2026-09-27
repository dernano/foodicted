import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PreferencesProvider } from "./src/context/PreferencesContext";
import { FavoritesProvider } from "./src/context/FavoritesContext";
import { RecentRecipesProvider } from "./src/context/RecentRecipesContext";
import AppNavigator from "./src/navigation";

export default function App() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <FavoritesProvider>
          <RecentRecipesProvider>
            <AppNavigator />
            <StatusBar style="light" />
          </RecentRecipesProvider>
        </FavoritesProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}
