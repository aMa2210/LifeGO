import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

import AppTabs from "@/components/app-tabs";
import { UnlockToast } from "@/components/UnlockToast";
import { useLifeGOStore } from "@/lib/store";

export default function TabLayout() {
  // Preheat: kick off persona generation at the earliest possible moment
  // (root layout mount, before any tab/screen renders). By the time the user
  // sees PersonaCard, the network round-trip is already in flight — saves
  // ~1 second of perceived latency vs. waiting for PersonaCard's own useEffect.
  const fetchPersona = useLifeGOStore((s) => s.fetchPersona);
  useEffect(() => {
    fetchPersona();
  }, [fetchPersona]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <AppTabs />
        <UnlockToast />
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
