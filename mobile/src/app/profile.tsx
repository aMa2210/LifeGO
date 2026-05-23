import { useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Modal,
  Platform,
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

import type { AttributeKey, Attributes } from "@/lib/attributes";
import {
  OUTFITS,
  OUTFIT_META,
  type CharacterState,
  type CharacterVisual,
  type OutfitId,
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

/** Cross-platform confirm. Native uses Alert.alert (2-button); web uses
 *  window.confirm (sync). Both call onConfirm only if the user agrees. */
function confirmAction(message: string, onConfirm: () => void) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.confirm(message)) {
      onConfirm();
    }
  } else {
    Alert.alert("", message, [
      { text: "Cancel", style: "cancel" },
      { text: "OK", style: "destructive", onPress: onConfirm },
    ]);
  }
}

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

// ── Achievement archive (3 outfits × 3 states) ──────────────────────────
type AchievementStatus = "active" | "fading" | "sleeping";

type OutfitAchievement = {
  id: string;
  outfit: OutfitId;
  emoji: string;
  titleKey: StringKey;
  status: AchievementStatus;
};

/** Each outfit's underlying 6D axis. Decay on that axis = the outfit fades. */
const OUTFIT_AXIS: Record<OutfitId, AttributeKey> = {
  sport: "athletic",
  art: "aesthete",
  social: "social",
};

/** Above this post-Q1 delta the user could plausibly wear this outfit — so
 *  it counts as "fading" rather than "sleeping" when it's not the current one.
 *  Half the activation threshold (6) — keeps the recovery window meaningful. */
const FADING_DELTA_THRESHOLD = 3;

/**
 * Build the 3-outfit archive. States:
 *   active   = currently worn
 *   fading   = previously worn OR axis still close to threshold (recoverable)
 *   sleeping = never reached or axis fully decayed
 */
function outfitArchive(
  currentVisual: ResolvedVisual,
  visualHistory: ResolvedVisual[],
  attributes: Attributes,
  q1SnapshotAttrs: Attributes
): OutfitAchievement[] {
  const visited = new Set(visualHistory);
  return OUTFITS.map((outfit) => {
    const visualKey = `outfit-${outfit}` as CharacterVisual;
    let status: AchievementStatus;
    if (currentVisual === visualKey) {
      status = "active";
    } else {
      const delta = attributes[OUTFIT_AXIS[outfit]] - q1SnapshotAttrs[OUTFIT_AXIS[outfit]];
      const closeToThreshold = delta >= FADING_DELTA_THRESHOLD;
      if (visited.has(visualKey) || closeToThreshold) {
        status = "fading";
      } else {
        status = "sleeping";
      }
    }
    return {
      id: `outfit-${outfit}`,
      outfit,
      emoji: OUTFIT_META[outfit].emoji,
      titleKey: OUTFIT_META[outfit].titleKey,
      status,
    };
  });
}

type UnlockedTrait = {
  id: string;
  icon: string;
  titleKey: StringKey;
  detailKey: StringKey;
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

/** Only return the eggs the user has actually unlocked. Locked eggs are
 *  collapsed into a single mystery placeholder rendered separately — we
 *  never expose their identity or unlock criteria. */
function unlockedTraitsFromEggs(eggs: EasterEggId[]): UnlockedTrait[] {
  const set = new Set(eggs);
  return EASTER_EGGS.filter((e) => set.has(e.id)).map((e) => ({
    id: `egg-${e.id}`,
    icon: e.emoji,
    titleKey: EGG_TITLE_KEY[e.id],
    detailKey: EGG_DESC_KEY[e.id],
  }));
}

export default function ProfileScreen() {
  const {
    checkins,
    eggs,
    playReplay,
    isReplaying,
    locale,
    setLocale,
    character,
    visualHistory,
    attributes,
    q1SnapshotAttrs,
    user,
    snapshotBeforeMia,
    loadMiaSample,
    restoreFromMia,
    clearCheckins,
    resetUser,
  } = useLifeGOStore();
  const inMiaMode = !!snapshotBeforeMia;
  const insets = useSafeAreaInsets();
  const t = useT();

  const [period, setPeriod] = useState<"week" | "month">("week");
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  const outfits = useMemo(
    () =>
      outfitArchive(character.visual, visualHistory, attributes, q1SnapshotAttrs),
    [character.visual, visualHistory, attributes, q1SnapshotAttrs]
  );
  const unlockedTraits = useMemo(() => unlockedTraitsFromEggs(eggs), [eggs]);
  const hasLockedTraits = unlockedTraits.length < EASTER_EGGS.length;

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
                  name: user.name || "—",
                  city: user.city || "—",
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

          {/* ── 成就档案：3 outfit × 3 态 ─────────────────────────── */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.flexOne}>
              <ThemedText type="subtitle">
                {t("profile.achievements.title")}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t("profile.achievements.summary", {
                  active: outfits.filter((o) => o.status === "active").length,
                  fading: outfits.filter((o) => o.status === "fading").length,
                  sleeping: outfits.filter((o) => o.status === "sleeping").length,
                })}
              </ThemedText>
            </View>
            <View style={styles.wardrobeRow}>
              {outfits.map((o) => (
                <ThemedView
                  key={o.id}
                  type="backgroundSelected"
                  style={[
                    styles.wardrobeCard,
                    o.status === "active" && styles.wardrobeCardActive,
                    o.status === "fading" && styles.wardrobeCardFading,
                    o.status === "sleeping" && styles.wardrobeCardSleeping,
                  ]}
                >
                  <ThemedText style={styles.wardrobeIcon}>{o.emoji}</ThemedText>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {t(o.titleKey)}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    style={
                      o.status === "active"
                        ? styles.wardrobeStatusActive
                        : undefined
                    }
                  >
                    {t(`profile.achievements.${o.status}` as StringKey)}
                  </ThemedText>
                </ThemedView>
              ))}
            </View>
          </ThemedView>

          {/* ── 隐藏特质：横排（icon + 称号 + 解释，未解锁灰锁） ───── */}
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.flexOne}>
              <ThemedText type="subtitle">
                {t("profile.hiddenTraits.title")}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t("profile.hiddenTraits.subtitle")}
              </ThemedText>
            </View>
            <View style={styles.traitGrid}>
              {unlockedTraits.map((trait) => (
                <ThemedView
                  key={trait.id}
                  type="backgroundSelected"
                  style={styles.traitTile}
                >
                  <ThemedText style={styles.traitTileIcon}>
                    {trait.icon}
                  </ThemedText>
                  <ThemedText
                    type="smallBold"
                    style={styles.traitTileTitle}
                    numberOfLines={1}
                  >
                    {t(trait.titleKey)}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    themeColor="textSecondary"
                    style={styles.traitTileDesc}
                    numberOfLines={3}
                  >
                    {t(trait.detailKey)}
                  </ThemedText>
                </ThemedView>
              ))}
              {hasLockedTraits && (
                <ThemedView
                  type="backgroundSelected"
                  style={[styles.traitTile, styles.traitTileLocked]}
                >
                  <ThemedText
                    style={[styles.traitTileIcon, styles.traitTileIconLocked]}
                  >
                    ✦
                  </ThemedText>
                  <ThemedText
                    type="smallBold"
                    style={[styles.traitTileTitle, styles.traitTileTextLocked]}
                    numberOfLines={1}
                  >
                    {t("profile.hiddenTraits.lockedTile")}
                  </ThemedText>
                </ThemedView>
              )}
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
        inMiaMode={inMiaMode}
        snapshotUserName={snapshotBeforeMia?.user.name ?? null}
        loadMiaSample={loadMiaSample}
        restoreFromMia={restoreFromMia}
        clearCheckins={clearCheckins}
        resetUser={resetUser}
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
  inMiaMode,
  snapshotUserName,
  loadMiaSample,
  restoreFromMia,
  clearCheckins,
  resetUser,
}: {
  visible: boolean;
  onClose: () => void;
  locale: Locale;
  setLocale: (locale: Locale) => void;
  isReplaying: boolean;
  playReplay: () => Promise<void>;
  inMiaMode: boolean;
  snapshotUserName: string | null;
  loadMiaSample: () => void;
  restoreFromMia: () => void;
  clearCheckins: () => void;
  resetUser: () => void;
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
      {inMiaMode ? (
        <ThemedText
          type="link"
          onPress={
            isReplaying
              ? undefined
              : () =>
                  confirmAction(
                    t("profile.restoreFromMiaConfirm"),
                    restoreFromMia
                  )
          }
          style={[styles.actionLink, isReplaying && styles.disabledLink]}
        >
          {t("profile.restoreFromMia", { name: snapshotUserName ?? "—" })}
        </ThemedText>
      ) : (
        <ThemedText
          type="link"
          onPress={
            isReplaying
              ? undefined
              : () =>
                  confirmAction(t("profile.loadSampleConfirm"), loadMiaSample)
          }
          style={[styles.actionLink, isReplaying && styles.disabledLink]}
        >
          {t("profile.loadSample")}
        </ThemedText>
      )}
      <ThemedText
        type="link"
        onPress={
          isReplaying
            ? undefined
            : () =>
                confirmAction(t("profile.clearCheckinsConfirm"), clearCheckins)
        }
        style={[styles.actionLink, isReplaying && styles.disabledLink]}
      >
        {t("profile.clearCheckins")}
      </ThemedText>
      <ThemedText
        type="link"
        onPress={
          isReplaying
            ? undefined
            : () => confirmAction(t("profile.resetUserConfirm"), resetUser)
        }
        style={[styles.actionLink, isReplaying && styles.disabledLink]}
      >
        {t("profile.resetUser")}
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
  // ── Achievement archive (3 outfit cards × 3 states) ─────────────────
  wardrobeRow: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  wardrobeCard: {
    flex: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
    alignItems: "center",
    minHeight: 110,
  },
  wardrobeCardActive: {
    borderWidth: 1.5,
    borderColor: "#7c3aed",
  },
  wardrobeCardFading: {
    opacity: 0.72,
    borderWidth: 1.5,
    borderColor: "rgba(124,58,237,0.25)",
  },
  wardrobeCardSleeping: {
    opacity: 0.5,
  },
  wardrobeIcon: { fontSize: 30, lineHeight: 36 },
  wardrobeStatusActive: {
    color: "#7c3aed",
    fontWeight: "700",
  },
  // ── Hidden traits horizontal grid (3 tiles in a row) ───────────────
  traitGrid: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  traitTile: {
    flex: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
    alignItems: "center",
    minHeight: 124,
  },
  traitTileLocked: {
    opacity: 0.6,
  },
  traitTileIcon: { fontSize: 28, lineHeight: 34 },
  traitTileIconLocked: { color: "#9ca3af" },
  traitTileTitle: { textAlign: "center" },
  traitTileTextLocked: { color: "#6b7280" },
  traitTileDesc: { textAlign: "center" },
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
