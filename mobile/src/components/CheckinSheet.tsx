import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";

import { ThemedText } from "./themed-text";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useLifeGOStore } from "@/lib/store";
import {
  computeCheckinDelta,
  type POI,
  type POICategory,
} from "@/lib/tokyo-pois";

export type CheckinSheetHandle = {
  present: (poi: POI) => void;
};

const WEIGHTS = [
  { value: 1, emoji: "👋", label: "轻", desc: "路过" },
  { value: 3, emoji: "🪧", label: "中", desc: "停留" },
  { value: 5, emoji: "✨", label: "重", desc: "故事" },
] as const;

const TAGS_BY_CATEGORY: Partial<Record<POICategory, string[]>> = {
  cafe:         ["coffee", "indie", "reading", "with-friends"],
  "chain-cafe": ["work", "deep-focus", "with-friends"],
  park:         ["solo-walk", "picnic", "jog", "with-friends"],
  art:          ["immersive", "alone", "with-friends"],
  restaurant:   ["solo-dining", "with-friends", "splurge", "late-night"],
  bar:          ["nightlife", "stranger-chat", "with-friends", "jazz"],
  running:      ["morning-run", "long-distance"],
  coworking:    ["work", "deep-focus", "with-friends"],
  bookstore:    ["browsing", "discover", "with-friends"],
  gym:          ["workout", "yoga", "stretch"],
  library:      ["study", "quiet", "research"],
  walk:         ["solo-walk", "with-friends"],
  livehouse:    ["indie-music", "discovery", "with-friends"],
  market:       ["food-tour", "with-friends"],
};

const DEFAULT_TAGS = ["solo", "with-friends"];

export const CheckinSheet = forwardRef<CheckinSheetHandle>(function CheckinSheet(
  _,
  ref
) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [poi, setPoi] = useState<POI | null>(null);
  const [weight, setWeight] = useState<1 | 3 | 5 | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const addCheckin = useLifeGOStore((s) => s.addCheckin);
  const theme = useTheme();
  const snapPoints = useMemo(() => ["72%"], []);

  useImperativeHandle(
    ref,
    () => ({
      present: (p) => {
        setPoi(p);
        setWeight(null);
        setTags([]);
        setNote("");
        sheetRef.current?.present();
      },
    }),
    []
  );

  const toggleTag = useCallback((tag: string) => {
    setTags((t) => (t.includes(tag) ? t.filter((x) => x !== tag) : [...t, tag]));
    Haptics.selectionAsync();
  }, []);

  const handleSubmit = useCallback(() => {
    if (!poi || !weight) return;
    addCheckin({
      timestamp: new Date().toISOString(),
      poi,
      weight,
      tags,
      note: note.trim() || undefined,
      attributeDelta: computeCheckinDelta(poi, weight),
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    sheetRef.current?.dismiss();
  }, [poi, weight, tags, note, addCheckin]);

  const tagOptions = poi
    ? TAGS_BY_CATEGORY[poi.category] ?? DEFAULT_TAGS
    : [];

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      backgroundStyle={{ backgroundColor: theme.background }}
      handleIndicatorStyle={{ backgroundColor: theme.textSecondary }}
    >
      <BottomSheetView style={styles.content}>
        {poi && (
          <>
            <ThemedText type="subtitle">
              {poi.name}
              {poi.isRare && " ⭐"}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {poi.area} · {poi.category}
            </ThemedText>

            <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
              打卡重量
            </ThemedText>
            <View style={styles.weightRow}>
              {WEIGHTS.map((w) => {
                const isActive = weight === w.value;
                return (
                  <TouchableOpacity
                    key={w.value}
                    onPress={() => {
                      setWeight(w.value);
                      Haptics.selectionAsync();
                    }}
                    style={[
                      styles.weightCell,
                      { borderColor: theme.backgroundSelected, backgroundColor: theme.backgroundElement },
                      isActive && {
                        borderColor: "#a78bfa",
                        backgroundColor: "rgba(167,139,250,0.12)",
                      },
                    ]}
                  >
                    <ThemedText style={styles.weightEmoji}>{w.emoji}</ThemedText>
                    <ThemedText style={styles.weightLabel}>{w.label}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {w.desc}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {weight !== null && (
              <>
                <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
                  标签（可选）
                </ThemedText>
                <View style={styles.tagsRow}>
                  {tagOptions.map((tag) => {
                    const isActive = tags.includes(tag);
                    return (
                      <TouchableOpacity
                        key={tag}
                        onPress={() => toggleTag(tag)}
                        style={[
                          styles.tagChip,
                          { borderColor: theme.backgroundSelected },
                          isActive && {
                            backgroundColor: theme.text,
                            borderColor: theme.text,
                          },
                        ]}
                      >
                        <ThemedText
                          type="small"
                          style={isActive ? { color: theme.background } : undefined}
                        >
                          {tag}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {weight >= 3 && (
                  <>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
                      想法（可选）
                    </ThemedText>
                    <TextInput
                      value={note}
                      onChangeText={setNote}
                      placeholder="一句话留念……"
                      placeholderTextColor={theme.textSecondary}
                      style={[
                        styles.noteInput,
                        {
                          color: theme.text,
                          borderColor: theme.backgroundSelected,
                          backgroundColor: theme.backgroundElement,
                        },
                      ]}
                      maxLength={140}
                      multiline
                    />
                  </>
                )}
              </>
            )}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={!weight}
              style={[styles.submitButton, !weight && styles.submitDisabled]}
            >
              <ThemedText style={styles.submitText}>打卡</ThemedText>
            </TouchableOpacity>
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
  weightRow: { flexDirection: "row", gap: Spacing.two },
  weightCell: {
    flex: 1,
    borderWidth: 2,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    alignItems: "center",
    gap: 2,
  },
  weightEmoji: { fontSize: 28, lineHeight: 32 },
  weightLabel: { fontWeight: "600", marginTop: Spacing.one },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  tagChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 999,
    borderWidth: 1,
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    minHeight: 60,
    fontSize: 14,
    textAlignVertical: "top",
  },
  submitButton: {
    marginTop: Spacing.four,
    backgroundColor: "#7c3aed",
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: "center",
  },
  submitDisabled: { opacity: 0.4 },
  submitText: { color: "white", fontSize: 16, fontWeight: "600" },
});
