import { NavigationContainer, type CompositeScreenProps, type NavigatorScreenParams } from "@react-navigation/native";
import { createNativeStackNavigator, type NativeStackScreenProps } from "@react-navigation/native-stack";
import { createBottomTabNavigator, type BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { Image, Text, View } from "react-native";
import type { FridgeItem, Recipe } from "../types";
import HomeScreen from "../screens/HomeScreen";
import FavoritesScreen from "../screens/FavoritesScreen";
import CameraScreen from "../screens/CameraScreen";
import PreferencesScreen from "../screens/PreferencesScreen";
import IngredientsReviewScreen from "../screens/IngredientsReviewScreen";
import RecipesScreen from "../screens/RecipesScreen";
import RecipeDetailScreen from "../screens/RecipeDetailScreen";

export type MainTabsParamList = {
  Start: undefined;
  Favoriten: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabsParamList>;
  Camera: undefined;
  Preferences: undefined;
  IngredientsReview: { items: FridgeItem[]; notes?: string };
  Recipes: { recipes: Recipe[] };
  RecipeDetail: { recipe: Recipe };
};

export type MainTabsScreenProps<T extends keyof MainTabsParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabsParamList>();

const THEME_COLOR = "#1b4332";
const ACCENT_COLOR = "#2f9e44";

function HeaderLogo({ title }: { title: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Image
        source={require("../../assets/icon-mark.png")}
        style={{ width: 26, height: 26 }}
        resizeMode="contain"
      />
      <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>{title}</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: THEME_COLOR },
        headerTintColor: "#fff",
        tabBarActiveTintColor: ACCENT_COLOR,
        tabBarInactiveTintColor: "#9db5a6",
        tabBarStyle: { backgroundColor: "#fff", borderTopColor: "#e6f0e8" },
      }}
    >
      <Tab.Screen
        name="Start"
        component={HomeScreen}
        options={{
          headerTitle: () => <HeaderLogo title="Foodicted" />,
          tabBarLabel: "Start",
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="Favoriten"
        component={FavoritesScreen}
        options={{
          title: "Lieblingsrezepte",
          tabBarLabel: "Favoriten",
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>❤️</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerStyle: { backgroundColor: THEME_COLOR },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="Camera" component={CameraScreen} options={{ title: "Kühlschrank scannen" }} />
        <Stack.Screen name="Preferences" component={PreferencesScreen} options={{ title: "Präferenzen" }} />
        <Stack.Screen
          name="IngredientsReview"
          component={IngredientsReviewScreen}
          options={{ title: "Zutaten" }}
        />
        <Stack.Screen name="Recipes" component={RecipesScreen} options={{ title: "Rezeptvorschläge" }} />
        <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: "Rezept" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
