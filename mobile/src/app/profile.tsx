import { useMemo, useState, type ReactNode } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { VideoView, useVideoPlayer } from "expo-video";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, Spacing } from "@/constants/theme";

import { MIA_USER } from "@/lib/fake-user";
import {
  ALL_VISUALS,
  VISUAL_META,
  type CharacterState,
  type CharacterVisual,
  type ResolvedVisual,
} from "@/lib/character";
import { CHANGE_VIDEO_ASSET } from "@/lib/character-assets";
import { EASTER_EGG_BY_ID, EASTER_EGGS, type EasterEggId } from "@/lib/easter-eggs";
import { useT, type Locale, type StringKey } from "@/lib/i18n";
import { useLifeGOStore } from "@/lib/store";

const LANG_OPTIONS: { value: Locale; label: string }[] = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
];

type TrendDirection = "up" | "down" | "steady";

type TrendRow = {
  id: string;
  direction: TrendDirection;
  labelKey: StringKey;
  phraseKey: StringKey;
  intensity: number; // 0-5
};

const TREND_ARROW: Record<TrendDirection, string> = {
  up: "↑",
  down: "↓",
  steady: "→",
};

const TREND_COLOR: Record<TrendDirection, string> = {
  up: "#7c3aed",
  down: "#94a3b8",
  steady: "#64748b",
};

const TREND_ROWS: Record<"week" | "month", TrendRow[]> = {
  week: [
    {
      id: "night",
      direction: "up",
      labelKey: "profile.trend.night.label",
      phraseKey: "profile.trend.night.phrase.week",
      intensity: 4,
    },
    {
      id: "athletic",
      direction: "down",
      labelKey: "profile.trend.athletic.label",
      phraseKey: "profile.trend.athletic.phrase.week",
      intensity: 2,
    },
    {
      id: "aesthete",
      direction: "steady",
      labelKey: "profile.trend.aesthete.label",
      phraseKey: "profile.trend.aesthete.phrase.week",
      intensity: 3,
    },
  ],
  month: [
    {
      id: "night",
      direction: "up",
      labelKey: "profile.trend.night.label",
      phraseKey: "profile.trend.night.phrase.month",
      intensity: 5,
    },
    {
      id: "athletic",
      direction: "down",
      labelKey: "profile.trend.athletic.label",
      phraseKey: "profile.trend.athletic.phrase.month",
      intensity: 2,
    },
    {
      id: "aesthete",
      direction: "up",
      labelKey: "profile.trend.aesthete.label",
      phraseKey: "profile.trend.aesthete.phrase.month",
      intensity: 4,
    },
  ],
};

type AchievementStatus = "active" | "sleeping";

type Achievement = {
  id: string;
  status: AchievementStatus;
  icon: string;
  titleKey: StringKey;
  detailKey: StringKey;
};

const VISUAL_DETAIL_KEY: Record<CharacterVisual, StringKey> = {
  "stage-sprout": "character.archive.sproutDetail",
  "stage-shape": "character.archive.shapeDetail",
  "stage-awaken": "character.archive.awakenDetail",
  "outfit-sport": "character.archive.sportDetail",
  "outfit-art": "character.archive.artDetail",
  "outfit-social": "character.archive.socialDetail",
};

/** Build the achievement archive: every visual exists as a slot; the user's
 *  CURRENT visual is "active", the other 5 are "sleeping". Eggs do NOT appear
 *  here — they live in the Hidden Traits card. */
function archiveFromVisual(currentVisual: ResolvedVisual): Achievement[] {
  return ALL_VISUALS.map((v) => {
    const meta = VISUAL_META[v];
    const isActive = currentVisual === v;
    return {
      id: `visual-${v}`,
      status: isActive ? ("active" as const) : ("sleeping" as const),
      icon: meta.emoji,
      titleKey: meta.titleKey,
      detailKey: VISUAL_DETAIL_KEY[v],
    };
  });
}

type HiddenTrait = {
  id: string;
  icon: string;
  titleKey: StringKey;
  detailKey: StringKey;
  unlocked: boolean;
};

const EGG_TITLE_KEY: Record<EasterEggId, StringKey> = {
  nocturnal: "profile.item.nocturnal",
  "early-bird": "profile.item.morning",
  "lone-wolf": "profile.item.loneWolf",
};

const EGG_DESC_KEY: Record<EasterEggId, StringKey> = {
  nocturnal: "egg.nocturnal.desc",
  "early-bird": "egg.early-bird.desc",
  "lone-wolf": "egg.lone-wolf.desc",
};

const EGG_LOCKED_KEY: Record<EasterEggId, StringKey> = {
  nocturnal: "profile.eggLockedHint.nocturnal",
  "early-bird": "profile.eggLockedHint.earlyBird",
  "lone-wolf": "profile.eggLockedHint.loneWolf",
};

function hiddenTraitsFromEggs(eggs: EasterEggId[]): HiddenTrait[] {
  const unlocked = new Set(eggs);
  return EASTER_EGGS.map((e) => ({
    id: `egg-${e.id}`,
    icon: e.emoji,
    titleKey: EGG_TITLE_KEY[e.id],
    detailKey: unlocked.has(e.id) ? EGG_DESC_KEY[e.id] : EGG_LOCKED_KEY[e.id],
    unlocked: unlocked.has(e.id),
  }));
}

export default function ProfileScreen() {
  const {
    checkins,
    eggs,
    resetToSeed,
    playReplay,
    isReplaying,
    locale,
    setLocale,
    character,
  } = useLifeGOStore();
  const insets = useSafeAreaInsets();
  const t = useT();

  const [period, setPeriod] = useState<"week" | "month">("week");
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  const achievements = useMemo(
    () => archiveFromVisual(character.visual),
    [character.visual]
  );
  const hiddenTraits = useMemo(() => hiddenTraitsFromEggs(eggs), [eggs]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: BottomTabInset + insets.bottom + Spacing.four },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <ThemedText type="title">{t("profile.title")}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t("profile.subtitle", {
                  name: MIA_USER.name,
                  city: MIA_USER.city,
                  n: checkins.length,
                })}
              </ThemedText>
            </View>
            <TouchableOpacity onPress={() => setSettingsModalVisible(true)}>
              <ThemedView type="backgroundElement" style={styles.settingsDot}>
                <ThemedText>⚙︎</ThemedText>
              </ThemedView>
            </TouchableOpacity>
          </View>

          {/* ── 人格年轮 ─────────────────────────────────────────── */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="subtitle">
              {t("profile.growthRings.title")}
            </ThemedText>
            <GrowthRingSlot character={character} />
            <ThemedText type="small" themeColor="textSecondary">
              {character.hasSproutShapeTransition
                ? t("character.growth.playingNote")
                : t("character.growth.subtitle")}
            </ThemedText>

            <View style={styles.segmentRow}>
              {(["week", "month"] as const).map((value) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => setPeriod(value)}
                  style={[
                    styles.segmentButton,
                    period === value && styles.segmentButtonActive,
                  ]}
                >
                  <ThemedText
                    type="smallBold"
                    style={period === value && styles.segmentTextActive}
                  >
                    {t(
                      value === "week"
                        ? "profile.growthRings.week"
                        : "profile.growthRings.month"
                    )}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>

            <ThemedText type="smallBold">
              {t("profile.growthRings.stageHeader")}
            </ThemedText>
            <View style={styles.trendList}>
              {TREND_ROWS[period].map((row) => (
                <TrendRowView key={row.id} row={row} />
              ))}
            </View>
          </ThemedView>

          {/* ── 成就档案：6 个形象状态，仅当前 active，其余 sleeping ─── */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="subtitle">
              {t("profile.achievements.title")}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t("profile.achievements.summarySimple", {
                active: achievements.filter((v) => v.status === "active").length,
                total: achievements.length,
              })}
            </ThemedText>
            <View style={styles.grid}>
              {achievements.map((item) => (
                <ThemedView
                  key={item.id}
                  type="backgroundSelected"
                  style={[
                    styles.archiveItem,
                    item.status === "sleeping" && styles.sleepingItem,
                  ]}
                >
                  <ThemedText style={styles.archiveIcon}>{item.icon}</ThemedText>
                  <ThemedText type="smallBold">{t(item.titleKey)}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {t(item.detailKey)}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    style={styles.archiveStatusLine}
                  >
                    {item.status === "active"
                      ? t("profile.achievements.active")
                      : t("profile.achievements.sleeping")}
                  </ThemedText>
                </ThemedView>
              ))}
            </View>
          </ThemedView>

          {/* ── 隐藏特质：只显示彩蛋（未解锁也展示 locked hint）────── */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <ThemedText type="subtitle">
              {t("profile.hiddenTraits.title")}
            </ThemedText>
            <View style={styles.traitList}>
              {hiddenTraits.map((trait) => (
                <ThemedView
                  key={trait.id}
                  type="backgroundSelected"
                  style={[
                    styles.hiddenTraitRow,
                    !trait.unlocked && styles.hiddenTraitLocked,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.hiddenTraitIcon,
                      !trait.unlocked && styles.hiddenTraitIconLocked,
                    ]}
                  >
                    {trait.unlocked ? trait.icon : "✦"}
                  </ThemedText>
                  <View style={styles.flexOne}>
                    <ThemedText type="smallBold">
                      {trait.unlocked
                        ? t(trait.titleKey)
                        : t("profile.hiddenTraits.locked")}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {t(trait.detailKey)}
                    </ThemedText>
                  </View>
                </ThemedView>
              ))}
            </View>
          </ThemedView>
        </ScrollView>
      </SafeAreaView>

      <SettingsModal
        visible={settingsModalVisible}
        onClose={() => setSettingsModalVisible(false)}
        locale={locale}
        setLocale={setLocale}
        isReplaying={isReplaying}
        playReplay={playReplay}
        resetToSeed={resetToSeed}
      />
    </ThemedView>
  );
}

/** 16:9 horizontal growth-ring video. Plays change.mp4 once the user has
 *  reached stage-shape; otherwise shows the "生成中" placeholder. */
function GrowthRingSlot({ character }: { character: CharacterState }) {
  const t = useT();
  if (character.hasSproutShapeTransition) {
    return <ChangeVideo />;
  }
  return (
    <ThemedView type="backgroundSelected" style={styles.growthGeneratingSlot}>
      <ThemedText style={styles.growthSpinner}>⏳</ThemedText>
      <ThemedText style={styles.videoTitle}>
        {t("character.growth.generating")}
      </ThemedText>
      <ThemedText
        type="small"
        themeColor="textSecondary"
        style={styles.centerText}
      >
        {t("character.growth.hint")}
      </ThemedText>
    </ThemedView>
  );
}

function TrendRowView({ row }: { row: TrendRow }) {
  const t = useT();
  const color = TREND_COLOR[row.direction];
  return (
    <View style={styles.trendRow}>
      <ThemedText style={[styles.trendArrow, { color }]}>
        {TREND_ARROW[row.direction]}
      </ThemedText>
      <ThemedText type="smallBold" style={styles.trendLabel}>
        {t(row.labelKey)}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.trendPhrase}>
        {t(row.phraseKey)}
      </ThemedText>
      <View style={styles.trendDots}>
        {Array.from({ length: 5 }).map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.trendDot,
              idx < row.intensity
                ? { backgroundColor: color }
                : styles.trendDotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function ChangeVideo() {
  const player = useVideoPlayer(CHANGE_VIDEO_ASSET, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });
  return (
    <View style={styles.growthVideoBox}>
      <VideoView
        player={player}
        style={styles.growthVideoFill}
        contentFit="contain"
        nativeControls={false}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
      />
    </View>
  );
}

function SettingsModal({
  visible,
  onClose,
  locale,
  setLocale,
  isReplaying,
  playReplay,
  resetToSeed,
}: {
  visible: boolean;
  onClose: () => void;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isReplaying: boolean;
  playReplay: () => Promise<void>;
  resetToSeed: () => void;
}) {
  const t = useT();
  return (
    <DetailModal
      visible={visible}
      onClose={onClose}
      title={t("profile.settings.title")}
    >
      <ThemedText type="smallBold">{t("profile.privacy.title")}</ThemedText>
      {[
        ["profile.privacy.role", "profile.privacy.on"],
        ["profile.privacy.tags", "profile.privacy.on"],
        ["profile.privacy.place", "profile.privacy.area"],
        ["profile.privacy.diary", "profile.privacy.off"],
      ].map(([labelKey, valueKey]) => (
        <View key={labelKey} style={styles.privacyRow}>
          <ThemedText>{t(labelKey as StringKey)}</ThemedText>
          <ThemedView type="backgroundSelected" style={styles.valuePill}>
            <ThemedText type="smallBold">{t(valueKey as StringKey)}</ThemedText>
          </ThemedView>
        </View>
      ))}
      <View style={styles.modalDivider} />
      <ThemedText type="smallBold">🌐 {t("profile.languageHeader")}</ThemedText>
      <View style={styles.langRow}>
        {LANG_OPTIONS.map((opt) => {
          const isActive = locale === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setLocale(opt.value)}
              style={[styles.langButton, isActive && styles.langButtonActive]}
            >
              <ThemedText
                style={[
                  styles.langButtonText,
                  isActive && styles.langButtonTextActive,
                ]}
              >
                {opt.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.modalDivider} />
      <ThemedText type="smallBold">{t("profile.devToolsHeader")}</ThemedText>
      <ThemedText
        type="link"
        onPress={isReplaying ? undefined : () => playReplay()}
        style={[styles.actionLink, isReplaying && styles.disabledLink]}
      >
        {t("profile.replayAction")}
      </ThemedText>
      <ThemedText
        type="link"
        onPress={isReplaying ? undefined : resetToSeed}
        style={[styles.actionLink, isReplaying && styles.disabledLink]}
      >
        {t("profile.resetAction")}
      </ThemedText>
    </DetailModal>
  );
}

function DetailModal({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const t = useT();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <ThemedView type="background" style={styles.modalSheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.detailHeader}>
              <ThemedText type="subtitle">{title}</ThemedText>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <ThemedText type="smallBold">
                  {t("profile.common.close")}
                </ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.detailBody}>{children}</View>
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.three,
  },
  headerCopy: { flex: 1 },
  // ── Trend rows (under growth-ring video) ───────────────────────────
  segmentRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
  },
  segmentButtonActive: {
    backgroundColor: "#7c3aed",
    borderColor: "#7c3aed",
  },
  segmentTextActive: { color: "white" },
  trendList: { gap: Spacing.two },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  trendArrow: {
    width: 20,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  trendLabel: { width: 80 },
  trendPhrase: { flex: 1 },
  trendDots: { flexDirection: "row", gap: 3 },
  trendDot: { width: 6, height: 6, borderRadius: 3 },
  trendDotInactive: { backgroundColor: "rgba(0,0,0,0.12)" },
  settingsDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.three,
  },
  entryCard: {
    alignSelf: "stretch",
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.three,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  entryCopy: { flex: 1, flexShrink: 1, gap: Spacing.one },
  flexOne: { flex: 1 },
  // ── Growth ring video block (16:9, no crop) ──────────────────────────
  growthGeneratingSlot: {
    aspectRatio: 16 / 9,
    width: "100%",
    borderRadius: Spacing.three,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.four,
    gap: Spacing.two,
  },
  growthSpinner: { fontSize: 32, lineHeight: 38 },
  growthVideoBox: {
    aspectRatio: 16 / 9,
    width: "100%",
    borderRadius: Spacing.three,
    overflow: "hidden",
    // Soft same-tone bg fills the letterbox if the rendered video
    // aspect doesn't perfectly match the 16:9 frame.
    backgroundColor: "#fef3c7",
  },
  growthVideoFill: { width: "100%", height: "100%" },
  videoTitle: { fontSize: 18, lineHeight: 24, fontWeight: "700" },
  centerText: { textAlign: "center" },
  // ── Archive grid ────────────────────────────────────────────────────
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  archiveItem: {
    width: "48%",
    minHeight: 156,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  sleepingItem: {
    opacity: 0.55,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.08)",
  },
  archiveIcon: { fontSize: 28, lineHeight: 34 },
  archiveStatusLine: { marginTop: Spacing.one, fontWeight: "600" },
  // ── Hidden traits ───────────────────────────────────────────────────
  traitList: { gap: Spacing.two },
  hiddenTraitRow: {
    flexDirection: "row",
    gap: Spacing.three,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    alignItems: "flex-start",
  },
  hiddenTraitLocked: { opacity: 0.55 },
  hiddenTraitIcon: { fontSize: 26, lineHeight: 32 },
  hiddenTraitIconLocked: { color: "#9ca3af" },
  privacyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  valuePill: {
    minWidth: 58,
    flexShrink: 0,
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  actionLink: { paddingVertical: Spacing.two },
  disabledLink: { opacity: 0.4 },
  langRow: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  langButton: {
    flex: 1,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.12)",
    alignItems: "center",
  },
  langButtonActive: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  langButtonText: { fontSize: 14, fontWeight: "600" },
  langButtonTextActive: { color: "white" },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  modalSheet: {
    maxHeight: "92%",
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    padding: Spacing.four,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.three,
  },
  closeButton: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.12)",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  detailBody: {
    gap: Spacing.three,
    marginTop: Spacing.three,
    paddingBottom: Spacing.four,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginVertical: Spacing.one,
  },
});
