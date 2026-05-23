// Web variant of AppTabs. Metro picks `.web.tsx` automatically when the
// platform is web; iOS/Android keep using `app-tabs.tsx` (NativeTabs).
//
// NativeTabs from expo-router/unstable-native-tabs is not available on web,
// so we fall back to the JS-based `<Tabs>` from expo-router, with emoji icons
// (cheap and dependency-free — SF Symbols don't exist on web).

import { Tabs } from "expo-router";
import { Text } from "react-native";

import { useT } from "@/lib/i18n";

export default function AppTabs() {
  const t = useT();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#7c3aed",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#fffbeb",
          borderTopColor: "#f3e8d4",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ color }) => <TabEmoji emoji="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: t("tabs.map"),
          tabBarIcon: ({ color }) => <TabEmoji emoji="🗺️" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ color }) => <TabEmoji emoji="👤" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabEmoji({ emoji, color }: { emoji: string; color: string }) {
  return <Text style={{ fontSize: 20, color }}>{emoji}</Text>;
}
