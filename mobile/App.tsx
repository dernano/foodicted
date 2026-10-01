import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PreferencesProvider } from "./src/context/PreferencesContext";
import { AuthProvider } from "./src/context/AuthContext";
import { FavoritesProvider } from "./src/context/FavoritesContext";
import { ShoppingListProvider } from "./src/context/ShoppingListContext";
import { RecentRecipesProvider } from "./src/context/RecentRecipesContext";
import { PantryProvider } from "./src/context/PantryContext";
import AppNavigator from "./src/navigation";

export default function App() {
  return (
    <SafeAreaProvider>
      <PreferencesProvider>
        <AuthProvider>
          <FavoritesProvider>
            <ShoppingListProvider>
              <RecentRecipesProvider>
                <PantryProvider>
                  <AppNavigator />
                  {/* Dark icons/text by default now that headers are light
                      (Phase 2) - RecipeDetail/CommunityRecipeDetail locally
                      override back to "light" since they still have a dark
                      photo hero under the status bar. */}
                  <StatusBar style="dark" />
                </PantryProvider>
              </RecentRecipesProvider>
            </ShoppingListProvider>
          </FavoritesProvider>
        </AuthProvider>
      </PreferencesProvider>
    </SafeAreaProvider>
  );
}
