import { useState, type ReactNode } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

import {
  PERSON_OPTIONS,
  PLACE_OPTIONS,
  TONE_OPTIONS,
  buildInitialAvatarProfile,
} from "@/lib/initial-avatar";
import { useT } from "@/lib/i18n";
import { useLifeGOStore } from "@/lib/store";

type InitialAvatarModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function InitialAvatarModal({
  visible,
  onClose,
}: InitialAvatarModalProps) {
  const t = useT();
  const applyInitialAvatarEdit = useLifeGOStore(
    (s) => s.applyInitialAvatarEdit
  );

  const [personId, setPersonId] = useState(PERSON_OPTIONS[1].id);
  const [placeIds, setPlaceIds] = useState<string[]>([
    PLACE_OPTIONS[1].id,
    PLACE_OPTIONS[0].id,
  ]);
  const [toneId, setToneId] = useState(TONE_OPTIONS[1].id);

  const canSubmit = !!(personId && placeIds.length > 0 && toneId);

  const togglePlace = (id: string) => {
    setPlaceIds((current) => {
      if (current.includes(id)) return current.filter((v) => v !== id);
      if (current.length >= 3) return current;
      return [...current, id];
    });
  };

  const submit = () => {
    if (!canSubmit) return;
    const profile = buildInitialAvatarProfile({
      archetypeId: personId,
      placeIds,
      toneId,
    });
    applyInitialAvatarEdit(profile);
    onClose();
  };

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
            <ThemedText type="subtitle">
              {t("profile.initialAvatar.modalTitle")}
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.warningBox}>
              <ThemedText type="small" themeColor="textSecondary">
                {t("profile.initialAvatar.warning")}
              </ThemedText>
            </ThemedView>

            <QuestionBlock title={t("profile.initialAvatar.question1")}>
              <View style={styles.optionGrid}>
                {PERSON_OPTIONS.map((option) => (
                  <ChoiceChip
                    key={option.id}
                    label={t(option.labelKey)}
                    selected={personId === option.id}
                    onPress={() => setPersonId(option.id)}
                  />
                ))}
              </View>
            </QuestionBlock>

            <QuestionBlock title={t("profile.initialAvatar.question2")}>
              <View style={styles.optionGrid}>
                {PLACE_OPTIONS.map((option) => (
                  <ChoiceChip
                    key={option.id}
                    label={t(option.labelKey)}
                    selected={placeIds.includes(option.id)}
                    onPress={() => togglePlace(option.id)}
                  />
                ))}
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {placeIds.length === 0
                  ? t("profile.initialAvatar.pickMore")
                  : `${placeIds.length}/3`}
              </ThemedText>
            </QuestionBlock>

            <QuestionBlock title={t("profile.initialAvatar.question3")}>
              <View style={styles.optionGrid}>
                {TONE_OPTIONS.map((option) => (
                  <ChoiceChip
                    key={option.id}
                    label={t(option.labelKey)}
                    selected={toneId === option.id}
                    onPress={() => setToneId(option.id)}
                  />
                ))}
              </View>
            </QuestionBlock>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={onClose} style={styles.secondaryButton}>
                <ThemedText type="smallBold">
                  {t("profile.initialAvatar.cancel")}
                </ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={!canSubmit}
                onPress={submit}
                style={[
                  styles.primaryButton,
                  styles.modalSubmit,
                  !canSubmit && styles.disabledButton,
                ]}
              >
                <ThemedText style={styles.primaryButtonText}>
                  {t("profile.initialAvatar.submit")}
                </ThemedText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </ThemedView>
      </View>
    </Modal>
  );
}

function QuestionBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.questionBlock}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {children}
    </View>
  );
}

function ChoiceChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.choiceChip, selected && styles.choiceChipSelected]}
    >
      <ThemedText type="smallBold" style={selected && styles.choiceTextSelected}>
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
  warningBox: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    marginTop: Spacing.three,
  },
  questionBlock: {
    gap: Spacing.two,
    marginTop: Spacing.four,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  choiceChip: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.12)",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  choiceChipSelected: {
    backgroundColor: "#7c3aed",
    borderColor: "#7c3aed",
  },
  choiceTextSelected: { color: "white" },
  modalActions: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.four,
    paddingBottom: Spacing.four,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: Spacing.three,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.12)",
    paddingVertical: Spacing.three,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#7c3aed",
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledButton: { opacity: 0.45 },
  modalSubmit: { flex: 1.6 },
});
