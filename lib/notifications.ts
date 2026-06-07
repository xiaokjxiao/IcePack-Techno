import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let permissionsReady = false;

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (permissionsReady) return true;

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("Notification permissions not granted");
      return false;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("critical-alerts", {
        name: "Critical Shipment Alerts",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#ef4444",
        sound: "default",
      });
      await Notifications.setNotificationChannelAsync("departure-reminders", {
        name: "Departure Reminders",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 100, 200],
        lightColor: "#1a8ad4",
        sound: "default",
      });
    }

    permissionsReady = true;
    return true;
  } catch (e) {
    console.warn("Failed to setup notifications:", e);
    return false;
  }
}

export async function notifyCriticalShipments(
  count: number,
  names: string[],
): Promise<void> {
  if (count <= 0) return;

  const ok = await ensureNotificationPermissions();
  if (!ok) return;

  const body =
    count === 1
      ? `${names[0] ?? "A shipment"} is in critical condition — ice levels dangerously low.`
      : `${count} shipments are in critical condition — including ${names.slice(0, 2).join(", ")}.`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Critical Alert`,
      subtitle: count === 1 ? "1 shipment at risk" : `${count} shipments at risk`,
      body,
      sound: "default",
      color: "#ef4444",
      data: { type: "critical", count, names },
    },
    trigger: null,
  });
}

export async function notifyDepartureReminders(
  shipments: { name: string; time: string }[],
): Promise<void> {
  if (shipments.length === 0) return;

  const ok = await ensureNotificationPermissions();
  if (!ok) return;

  const body =
    shipments.length === 1
      ? `${shipments[0].name} departs at ${shipments[0].time}.`
      : `${shipments.length} shipments scheduled today — including ${shipments[0].name} at ${shipments[0].time}.`;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Departure Reminder",
      subtitle: shipments.length === 1 ? "1 shipment scheduled today" : `${shipments.length} shipments scheduled today`,
      body,
      sound: "default",
      color: "#1a8ad4",
      data: { type: "departure", count: shipments.length },
    },
    trigger: null,
  });
}
