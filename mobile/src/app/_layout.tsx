import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

import AppTabs from "@/components/app-tabs";
import { UnlockToast } from "@/components/UnlockToast";

export default function TabLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <AppTabs />
        <UnlockToast />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
