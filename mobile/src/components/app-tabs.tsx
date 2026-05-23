// 3-tab bottom navigation using expo-router's NativeTabs.
// Labels are localized via useT(); icons use SF Symbols on iOS + PNG on Android.

import {
  NativeTabs,
  Label,
  Icon,
} from "expo-router/unstable-native-tabs";

import { useT } from "@/lib/i18n";

export default function AppTabs() {
  const t = useT();
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>{t("tabs.home")}</Label>
        <Icon
          sf={{ default: "house", selected: "house.fill" }}
          androidSrc={require("@/assets/images/tabIcons/home.png")}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="map">
        <Label>{t("tabs.map")}</Label>
        <Icon
          sf={{ default: "map", selected: "map.fill" }}
          androidSrc={require("@/assets/images/tabIcons/explore.png")}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Label>{t("tabs.profile")}</Label>
        <Icon
          sf={{
            default: "person.crop.circle",
            selected: "person.crop.circle.fill",
          }}
          androidSrc={require("@/assets/images/tabIcons/profile.png")}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
