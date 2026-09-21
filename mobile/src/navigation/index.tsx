import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { FridgeItem, Recipe } from "../types";
import HomeScreen from "../screens/HomeScreen";
import CameraScreen from "../screens/CameraScreen";
import PreferencesScreen from "../screens/PreferencesScreen";
import IngredientsReviewScreen from "../screens/IngredientsReviewScreen";
import RecipesScreen from "../screens/RecipesScreen";
import RecipeDetailScreen from "../screens/RecipeDetailScreen";

export type RootStackParamList = {
  Home: undefined;
  Camera: undefined;
  Preferences: undefined;
  IngredientsReview: { items: FridgeItem[]; notes?: string };
  Recipes: { recipes: Recipe[] };
  RecipeDetail: { recipe: Recipe };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const THEME_COLOR = "#2f9e44";

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: { backgroundColor: THEME_COLOR },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Foodicted" }} />
        <Stack.Screen name="Camera" component={CameraScreen} options={{ title: "Kühlschrank scannen" }} />
        <Stack.Screen name="Preferences" component={PreferencesScreen} options={{ title: "Präferenzen" }} />
        <Stack.Screen
          name="IngredientsReview"
          component={IngredientsReviewScreen}
          options={{ title: "Erkannte Zutaten" }}
        />
        <Stack.Screen name="Recipes" component={RecipesScreen} options={{ title: "Rezeptvorschläge" }} />
        <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: "Rezept" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
