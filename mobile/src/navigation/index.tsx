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
import type { FridgeItem, Recipe, FavoriteRecipe } from "../types";
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
import { useAuth } from "../context/AuthContext";

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
  AddFavoriteRecipe: undefined;
  EditFavoriteRecipe: { recipe: FavoriteRecipe };
  Account: undefined;
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

function AccountHeaderButton({ navigation }: { navigation: BottomTabNavigationProp<MainTabsParamList, "Start"> }) {
  const { session, household } = useAuth();
  const iconName = household ? "people" : session ? "person" : "person-outline";
  return (
    <TouchableOpacity
      onPress={() => navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate("Account")}
      hitSlop={12}
      style={{ marginRight: 16 }}
    >
      <Ionicons name={iconName} size={24} color="#fff" />
    </TouchableOpacity>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: THEME_COLOR },
        headerTintColor: "#fff",
        headerShadowVisible: false,
        tabBarActiveTintColor: ACCENT_COLOR,
        tabBarInactiveTintColor: "#9db5a6",
        tabBarStyle: { backgroundColor: "#fff", borderTopColor: "#eef5ef", height: 62, paddingBottom: 8, paddingTop: 6 },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
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
          headerRight: () => <AccountHeaderButton navigation={navigation} />,
        })}
      />
      <Tab.Screen
        name="Favoriten"
        component={FavoritesScreen}
        options={({ navigation }) => ({
          title: "Lieblingsrezepte",
          tabBarLabel: "Favoriten",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "heart" : "heart-outline"} size={size} color={color} />
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() =>
                navigation.getParent<NativeStackNavigationProp<RootStackParamList>>()?.navigate("AddFavoriteRecipe")
              }
              hitSlop={12}
              style={{ marginRight: 16 }}
            >
              <Ionicons name="add-circle-outline" size={26} color="#fff" />
            </TouchableOpacity>
          ),
        })}
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
          headerShadowVisible: false,
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
