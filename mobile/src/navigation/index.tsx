import { NavigationContainer, type CompositeScreenProps, type NavigatorScreenParams } from "@react-navigation/native";
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp,
  type NativeStackScreenProps,
} from "@react-navigation/native-stack";
import {
  createBottomTabNavigator,
  type BottomTabNavigationProp,
  type BottomTabScreenProps,
} from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { FridgeItem, Recipe, FavoriteRecipe, CommunityRecipe } from "../types";
import HomeScreen from "../screens/HomeScreen";
import FavoritesScreen from "../screens/FavoritesScreen";
import CameraScreen from "../screens/CameraScreen";
import PreferencesScreen from "../screens/PreferencesScreen";
import IngredientsReviewScreen from "../screens/IngredientsReviewScreen";
import RecipesScreen from "../screens/RecipesScreen";
import RecipeDetailScreen from "../screens/RecipeDetailScreen";
import AddFavoriteRecipeScreen from "../screens/AddFavoriteRecipeScreen";
import EditFavoriteRecipeScreen from "../screens/EditFavoriteRecipeScreen";
import AccountScreen from "../screens/AccountScreen";
import ShoppingListScreen from "../screens/ShoppingListScreen";
import RecentRecipesScreen from "../screens/RecentRecipesScreen";
import IngredientMatchScreen from "../screens/IngredientMatchScreen";
import AboutScreen from "../screens/AboutScreen";
import CommunityScreen from "../screens/CommunityScreen";
import CommunityRecipeDetailScreen from "../screens/CommunityRecipeDetailScreen";
import PublishCommunityRecipeScreen from "../screens/PublishCommunityRecipeScreen";
import CommunityProfileScreen from "../screens/CommunityProfileScreen";
import OnboardingScreen, { ONBOARDING_SEEN_KEY } from "../screens/OnboardingScreen";
import { useAuth } from "../context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { colors, spacing } from "../constants/theme";

export type MainTabsParamList = {
  Start: undefined;
  Community: undefined;
  Favoriten: undefined;
  Einkaufsliste: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabsParamList>;
  Camera: { matchRecipe?: Recipe } | undefined;
  Preferences: undefined;
  IngredientsReview: { items: FridgeItem[]; notes?: string };
  Recipes: { recipes: Recipe[] };
  RecipeDetail: { recipe: Recipe };
  AddFavoriteRecipe: undefined;
  EditFavoriteRecipe: { recipe: FavoriteRecipe };
  Account: undefined;
  RecentRecipes: undefined;
  IngredientMatch: { recipe: Recipe; detectedItems: FridgeItem[] };
  About: undefined;
  CommunityRecipeDetail: { recipe: CommunityRecipe };
  PublishCommunityRecipe: { recipe?: CommunityRecipe; prefill?: Recipe } | undefined;
  CommunityProfile: { authorId: string; authorName: string };
};

export type MainTabsScreenProps<T extends keyof MainTabsParamList> = CompositeScreenProps<
  BottomTabScreenProps<MainTabsParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabsParamList>();

const THEME_COLOR = colors.brandDark;
const ACCENT_COLOR = colors.primary;

/** Consistent icon + title on every tab's header, so the brand mark is always
 * visible and the header doesn't visually jump between tabs (same layout,
 * only the title text differs). */
function HeaderLogo({ title }: { title: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
      <Image
        source={require("../../assets/icon-mark.png")}
        style={{ width: 26, height: 26 }}
        resizeMode="contain"
      />
      <Text style={{ color: colors.textOnDark, fontSize: 18, fontWeight: "800" }}>{title}</Text>
    </View>
  );
}

function AccountHeaderButton({
  navigation,
}: {
  navigation: BottomTabNavigationProp<MainTabsParamList, keyof MainTabsParamList>;
}) {
  const { session, household } = useAuth();
  const iconName = household ? "people" : session ? "person" : "person-outline";
  return (
    <TouchableOpacity
      onPress={() => navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate("Account")}
      hitSlop={12}
    >
      <Ionicons name={iconName} size={24} color={colors.textOnDark} />
    </TouchableOpacity>
  );
}

/** Account access is available on every tab (not just Start), and Favoriten's/
 * Community's "add recipe" action sits alongside it instead of replacing it. */
function TabHeaderRight({
  navigation,
  addRoute,
}: {
  navigation: BottomTabNavigationProp<MainTabsParamList, keyof MainTabsParamList>;
  addRoute?: "AddFavoriteRecipe" | "PublishCommunityRecipe";
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.lg, marginRight: spacing.lg }}>
      {addRoute && (
        <TouchableOpacity
          onPress={() => navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate(addRoute)}
          hitSlop={12}
        >
          <Ionicons name="add-circle-outline" size={26} color={colors.textOnDark} />
        </TouchableOpacity>
      )}
      <AccountHeaderButton navigation={navigation} />
    </View>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: THEME_COLOR },
        headerTintColor: colors.textOnDark,
        headerShadowVisible: false,
        tabBarActiveTintColor: ACCENT_COLOR,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          height: 56 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: spacing.sm,
          shadowColor: colors.brandDark,
          shadowOpacity: 0.05,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: -2 },
          elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Start"
        component={HomeScreen}
        options={({ navigation }) => ({
          headerTitle: () => <HeaderLogo title="Foodicted" />,
          tabBarLabel: "Start",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={size} color={color} />
          ),
          headerRight: () => <TabHeaderRight navigation={navigation} />,
        })}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={({ navigation }) => ({
          headerTitle: () => <HeaderLogo title="Community" />,
          tabBarLabel: "Community",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "compass" : "compass-outline"} size={size} color={color} />
          ),
          headerRight: () => <TabHeaderRight navigation={navigation} addRoute="PublishCommunityRecipe" />,
        })}
      />
      <Tab.Screen
        name="Favoriten"
        component={FavoritesScreen}
        options={({ navigation }) => ({
          headerTitle: () => <HeaderLogo title="Lieblingsrezepte" />,
          tabBarLabel: "Favoriten",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "heart" : "heart-outline"} size={size} color={color} />
          ),
          headerRight: () => <TabHeaderRight navigation={navigation} addRoute="AddFavoriteRecipe" />,
        })}
      />
      <Tab.Screen
        name="Einkaufsliste"
        component={ShoppingListScreen}
        options={({ navigation }) => ({
          headerTitle: () => <HeaderLogo title="Einkaufsliste" />,
          tabBarLabel: "Liste",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "cart" : "cart-outline"} size={size} color={color} />
          ),
          headerRight: () => <TabHeaderRight navigation={navigation} />,
        })}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState<"Onboarding" | "MainTabs" | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_SEEN_KEY)
      .then((value) => setInitialRoute(value ? "MainTabs" : "Onboarding"))
      .catch(() => setInitialRoute("MainTabs"));
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: { backgroundColor: THEME_COLOR },
          headerTintColor: colors.textOnDark,
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen
          name="Camera"
          component={CameraScreen}
          options={({ route }) => ({ title: route.params?.matchRecipe ? "Zutaten abgleichen" : "Vorrat scannen" })}
        />
        <Stack.Screen name="Preferences" component={PreferencesScreen} options={{ title: "Präferenzen" }} />
        <Stack.Screen
          name="IngredientsReview"
          component={IngredientsReviewScreen}
          options={{ title: "Zutaten" }}
        />
        <Stack.Screen name="Recipes" component={RecipesScreen} options={{ title: "Rezeptvorschläge" }} />
        {/* No title text here - the recipe's own large title lives in the
            screen's hero card, which visually continues this dark header. */}
        <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} options={{ title: "" }} />
        <Stack.Screen
          name="AddFavoriteRecipe"
          component={AddFavoriteRecipeScreen}
          options={{ title: "Rezept hinzufügen" }}
        />
        <Stack.Screen name="Account" component={AccountScreen} options={{ title: "Konto & Haushalt" }} />
        <Stack.Screen
          name="EditFavoriteRecipe"
          component={EditFavoriteRecipeScreen}
          options={{ title: "Rezept bearbeiten" }}
        />
        <Stack.Screen name="RecentRecipes" component={RecentRecipesScreen} options={{ title: "Verlauf" }} />
        <Stack.Screen name="IngredientMatch" component={IngredientMatchScreen} options={{ title: "Zutaten-Check" }} />
        <Stack.Screen name="About" component={AboutScreen} options={{ title: "Über Foodicted" }} />
        {/* No title text here - same reasoning as RecipeDetail: the recipe's
            own large title lives in the screen's hero card. */}
        <Stack.Screen name="CommunityRecipeDetail" component={CommunityRecipeDetailScreen} options={{ title: "" }} />
        <Stack.Screen
          name="PublishCommunityRecipe"
          component={PublishCommunityRecipeScreen}
          options={({ route }) => ({ title: route.params?.recipe ? "Rezept bearbeiten" : "Rezept veröffentlichen" })}
        />
        <Stack.Screen
          name="CommunityProfile"
          component={CommunityProfileScreen}
          options={({ route }) => ({ title: route.params.authorName })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
