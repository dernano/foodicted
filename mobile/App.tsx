import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PreferencesProvider } from "./src/context/PreferencesContext";
import { AuthProvider } from "./src/context/AuthContext";
import { FavoritesProvider } from "./src/context/FavoritesContext";
import { RecentRecipesProvider } from "./src/context/RecentRecipesContext";
import AppNavigator from "./src/navigation";

export default function App() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <AuthProvider>
          <FavoritesProvider>
            <RecentRecipesProvider>
              <AppNavigator />
              <StatusBar style="light" />
            </RecentRecipesProvider>
          </FavoritesProvider>
        </AuthProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}
