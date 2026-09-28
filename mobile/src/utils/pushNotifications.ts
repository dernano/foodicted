import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "../lib/supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Requests permission and registers this device's Expo push token against the
 * signed-in user, so other household members' changes can reach it. Silently
 * does nothing if permission is denied or push isn't available (e.g. simulator). */
export async function registerForPushNotifications(userId: string): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  if (status !== "granted") return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  if (!projectId) return;

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await supabase.from("push_tokens").upsert({ user_id: userId, token }, { onConflict: "user_id,token" });
  } catch (err) {
    console.warn("Failed to register push token", err);
  }
}

/** Notifies every other member of the household (never the caller) via Expo's
 * push service. Best-effort - failures are swallowed so they never affect the
 * action that triggered them (e.g. adding a shopping list item). */
export async function notifyHouseholdMembers(householdId: string, title: string, body: string): Promise<void> {
  try {
    const { data, error } = await supabase.rpc("household_push_tokens", { hh_id: householdId });
    if (error || !data?.length) return;
    const tokens = (data as { token: string }[]).map((row) => row.token);
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(tokens.map((to) => ({ to, title, body, sound: "default" }))),
    });
  } catch (err) {
    console.warn("Failed to send push notification", err);
  }
}
