import { useEffect } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

import AppTabs from "@/components/app-tabs";
import { Onboarding } from "@/components/Onboarding";
import { UnlockToast } from "@/components/UnlockToast";
import { useLifeGOStore } from "@/lib/store";

export default function TabLayout() {
  const hasOnboarded = useLifeGOStore((s) => s.user.hasOnboarded);
  const hydrated = useLifeGOStore((s) => s._hydrated);
  const fetchPersona = useLifeGOStore((s) => s.fetchPersona);

  // Preheat persona generation only AFTER hydration AND onboarding — we don't
  // want to fire the LLM call against an empty/placeholder identity.
  useEffect(() => {
    if (hydrated && hasOnboarded) {
      fetchPersona();
    }
  }, [hydrated, hasOnboarded, fetchPersona]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        {!hydrated ? (
          // Empty placeholder during the brief async hydration from storage —
          // prevents the "empty state → real state" flash on web reload.
          <View style={{ flex: 1 }} />
        ) : !hasOnboarded ? (
          <Onboarding />
        ) : (
          <>
            <AppTabs />
            <UnlockToast />
          </>
        )}
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
