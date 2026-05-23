import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "./themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useLifeGOStore } from "@/lib/store";
import {
  CATEGORY_DELTA,
  computeCheckinDelta,
  computeWeightFromContent,
  type POI,
  type POICategory,
} from "@/lib/tokyo-pois";
import { useT, type StringKey } from "@/lib/i18n";

export type CheckinSheetHandle = {
  present: (poi: POI, opts?: { pickCategory?: boolean }) => void;
};

type Mode = "pick-category" | "choose" | "share";

// 14 categories shown in the picker. Emoji + i18n key per category.
const PICKER_ITEMS: { category: POICategory; emoji: string }[] = [
  { category: "cafe",         emoji: "☕" },
  { category: "chain-cafe",   emoji: "🏢" },
  { category: "park",         emoji: "🌳" },
  { category: "art",          emoji: "🎨" },
  { category: "restaurant",   emoji: "🍜" },
  { category: "bar",          emoji: "🍻" },
  { category: "running",      emoji: "🏃" },
  { category: "coworking",    emoji: "💻" },
  { category: "bookstore",    emoji: "📚" },
  { category: "gym",          emoji: "💪" },
  { category: "library",      emoji: "📖" },
  { category: "walk",         emoji: "🚶" },
  { category: "livehouse",    emoji: "🎤" },
  { category: "market",       emoji: "🥕" },
];

export const CheckinSheet = forwardRef<CheckinSheetHandle>(function CheckinSheet(
  _,
  ref
) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [poi, setPoi] = useState<POI | null>(null);
  const [mode, setMode] = useState<Mode>("choose");
  const [note, setNote] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const addCheckin = useLifeGOStore((s) => s.addCheckin);
  const theme = useTheme();
  const t = useT();
  const snapPoints = useMemo(() => ["66%", "85%"], []);

  useImperativeHandle(
    ref,
    () => ({
      present: (p, opts) => {
        setPoi(p);
        setMode(opts?.pickCategory ? "pick-category" : "choose");
        setNote("");
        setPhotoUri(null);
        sheetRef.current?.present();
      },
    }),
    []
  );

  const onPickCategory = useCallback(
    (category: POICategory) => {
      setPoi((prev) => (prev ? { ...prev, category } : prev));
      setMode("choose");
      Haptics.selectionAsync();
    },
    []
  );

  const submit = useCallback(
    (quick = false) => {
      if (!poi) return;
      // Quick path forces weight=1, no content.
      // Share path derives weight from note + photo content density.
      const trimmedNote = note.trim() || undefined;
      const finalPhoto = photoUri ?? undefined;
      const weight = quick
        ? 1
        : computeWeightFromContent({
            note: trimmedNote,
            photoUrl: finalPhoto,
          });
      addCheckin({
        timestamp: new Date().toISOString(),
        poi,
        weight,
        note: quick ? undefined : trimmedNote,
        photoUrl: quick ? undefined : finalPhoto,
        attributeDelta: computeCheckinDelta(poi, weight),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      sheetRef.current?.dismiss();
    },
    [poi, note, photoUri, addCheckin]
  );

  const pickPhoto = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        Haptics.selectionAsync();
      }
    } catch (err) {
      if (__DEV__) console.warn("ImagePicker failed:", err);
    }
  }, []);

  if (!poi) return null;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      index={mode === "pick-category" ? 1 : 0}
      backgroundStyle={{ backgroundColor: theme.background }}
      handleIndicatorStyle={{ backgroundColor: theme.textSecondary }}
    >
      <BottomSheetView style={styles.content}>
        <ThemedText type="subtitle">
          {poi.name}
          {poi.isRare && " ⭐"}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {poi.area}
          {mode !== "pick-category" && ` · ${poi.category}`}
        </ThemedText>

        {mode === "pick-category" ? (
          <>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.sectionLabel}
            >
              {t("pickCategory.header")}
            </ThemedText>
            <View style={styles.pickerGrid}>
              {PICKER_ITEMS.map(({ category, emoji }) => {
                const delta = CATEGORY_DELTA[category];
                const traits = Object.entries(delta)
                  .filter(([, v]) => typeof v === "number" && v > 0)
                  .map(([k]) =>
                    t(`attr.${k}` as StringKey)
                  )
                  .join(" · ");
                // Highlight whichever category this POI most recently used.
                // For first-ever check-ins on a search result, poi.category
                // is the placeholder "cafe" — that placeholder gets highlighted
                // which is fine (user can still tap any other cell).
                const isCurrent = poi.category === category;
                return (
                  <TouchableOpacity
                    key={category}
                    onPress={() => onPickCategory(category)}
                    style={[
                      styles.pickerCell,
                      {
                        borderColor: isCurrent
                          ? "#7c3aed"
                          : theme.backgroundSelected,
                        backgroundColor: isCurrent
                          ? "rgba(124, 58, 237, 0.12)"
                          : theme.backgroundElement,
                      },
                    ]}
                  >
                    <ThemedText style={styles.pickerEmoji}>{emoji}</ThemedText>
                    <ThemedText
                      style={[
                        styles.pickerLabel,
                        isCurrent && { color: "#7c3aed", fontWeight: "600" },
                      ]}
                    >
                      {t(`poiCategory.${category}` as StringKey)}
                    </ThemedText>
                    <ThemedText
                      type="small"
                      themeColor="textSecondary"
                      style={styles.pickerTraits}
                    >
                      {traits}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        ) : mode === "choose" ? (
          <View style={styles.chooseRow}>
            <TouchableOpacity
              onPress={() => submit(true)}
              style={[
                styles.chooseButton,
                {
                  borderColor: theme.backgroundSelected,
                  backgroundColor: theme.backgroundElement,
                },
              ]}
            >
              <ThemedText style={styles.chooseEmoji}>📍</ThemedText>
              <ThemedText style={styles.chooseLabel}>
                {t("checkin.quick.label")}
              </ThemedText>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.chooseDesc}
              >
                {t("checkin.quick.desc")}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setMode("share");
                Haptics.selectionAsync();
              }}
              style={[
                styles.chooseButton,
                {
                  borderColor: "#a78bfa",
                  backgroundColor: "rgba(167,139,250,0.12)",
                },
              ]}
            >
              <ThemedText style={styles.chooseEmoji}>✨</ThemedText>
              <ThemedText style={styles.chooseLabel}>
                {t("checkin.share.label")}
              </ThemedText>
              <ThemedText
                type="small"
                themeColor="textSecondary"
                style={styles.chooseDesc}
              >
                {t("checkin.share.desc")}
              </ThemedText>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ThemedText
              type="small"
              themeColor="textSecondary"
              style={styles.sectionLabel}
            >
              {t("checkin.noteHeader")}
            </ThemedText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder={t("checkin.notePlaceholder")}
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.noteInput,
                {
                  color: theme.text,
                  borderColor: theme.backgroundSelected,
                  backgroundColor: theme.backgroundElement,
                },
              ]}
              maxLength={200}
              multiline
            />

            <TouchableOpacity
              onPress={pickPhoto}
              style={[
                styles.photoSlot,
                {
                  borderColor: theme.backgroundSelected,
                  backgroundColor: theme.backgroundElement,
                },
              ]}
            >
              {photoUri ? (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: photoUri }} style={styles.photoThumb} />
                  <View style={styles.photoMeta}>
                    <ThemedText type="small">
                      {t("checkin.photo.attached")}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {t("checkin.photo.remove")} ↻
                    </ThemedText>
                  </View>
                </View>
              ) : (
                <ThemedText themeColor="textSecondary">
                  {t("checkin.photo.add")}
                </ThemedText>
              )}
            </TouchableOpacity>

            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => {
                  setMode("choose");
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.backButton,
                  { borderColor: theme.backgroundSelected },
                ]}
              >
                <ThemedText>{t("checkin.back")}</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => submit(false)}
                style={styles.submitButton}
              >
                <ThemedText style={styles.submitText}>
                  {t("checkin.submit")}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.one,
  },
  sectionLabel: {
    marginTop: Spacing.three,
    marginBottom: Spacing.one,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chooseRow: {
    flexDirection: "row",
    gap: Spacing.three,
    marginTop: Spacing.four,
  },
  chooseButton: {
    flex: 1,
    borderWidth: 2,
    borderRadius: Spacing.four,
    paddingVertical: Spacing.four,
    paddingHorizontal: Spacing.three,
    alignItems: "center",
    gap: Spacing.one,
  },
  chooseEmoji: { fontSize: 36, lineHeight: 42 },
  chooseLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: Spacing.one,
  },
  chooseDesc: { textAlign: "center" },
  noteInput: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    minHeight: 80,
    fontSize: 14,
    textAlignVertical: "top",
  },
  photoSlot: {
    marginTop: Spacing.three,
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    minHeight: 64,
    justifyContent: "center",
    alignItems: "center",
  },
  photoPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
  },
  photoThumb: {
    width: 48,
    height: 48,
    borderRadius: Spacing.two,
  },
  photoMeta: {
    gap: 2,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  backButton: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderWidth: 1,
    borderRadius: Spacing.three,
    justifyContent: "center",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#7c3aed",
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: "center",
  },
  submitText: { color: "white", fontSize: 16, fontWeight: "600" },
  pickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  pickerCell: {
    width: "31%",
    borderWidth: 1,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    alignItems: "center",
    gap: 2,
  },
  pickerEmoji: { fontSize: 24, lineHeight: 28 },
  pickerLabel: { fontSize: 13, fontWeight: "500" },
  pickerTraits: { fontSize: 10, textAlign: "center" },
});
