import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Modal, FlatList } from "react-native";
import { StyledButton } from "./StyledButton";
import usePlayerStore from "@/stores/playerStore";
import useDetailStore, { episodesSelectorBySource } from "@/stores/detailStore";

interface EpisodeSelectionModalProps {}

const EPISODE_GROUP_SIZE = 30;

export const EpisodeSelectionModal: React.FC<EpisodeSelectionModalProps> = () => {
  const { showEpisodeModal, episodes, currentEpisodeIndex, playEpisode, setShowEpisodeModal } = usePlayerStore();
  const { detail } = useDetailStore();

  // 兜底剧集列表：优先使用 playerStore.episodes，若未就绪则从 detailStore 提取
  const effectiveEpisodes = useMemo(() => {
    if (episodes && episodes.length > 0) {
      return episodes;
    }
    if (detail?.source) {
      const detailEps = episodesSelectorBySource(detail.source)(useDetailStore.getState());
      if (detailEps && detailEps.length > 0) {
        return detailEps.map((ep, idx) => ({
          url: ep,
          title: `第 ${idx + 1} 集`,
        }));
      }
    }
    return [];
  }, [episodes, detail]);

  const [selectedEpisodeGroup, setSelectedEpisodeGroup] = useState<number>(0);

  // 每次打开选集弹窗或当前播放集数变化时，自动将分组对齐到当前集所在分组
  useEffect(() => {
    if (showEpisodeModal) {
      const validIndex = Math.max(0, currentEpisodeIndex);
      setSelectedEpisodeGroup(Math.floor(validIndex / EPISODE_GROUP_SIZE));
    }
  }, [showEpisodeModal, currentEpisodeIndex]);

  // 安全分组索引：彻底杜绝负数与越界
  const totalGroups = Math.max(1, Math.ceil(effectiveEpisodes.length / EPISODE_GROUP_SIZE));
  const safeGroupIndex = Math.max(0, Math.min(selectedEpisodeGroup, totalGroups - 1));

  const currentGroupEpisodes = useMemo(() => {
    const start = safeGroupIndex * EPISODE_GROUP_SIZE;
    const end = (safeGroupIndex + 1) * EPISODE_GROUP_SIZE;
    return effectiveEpisodes.slice(start, end);
  }, [effectiveEpisodes, safeGroupIndex]);

  const onSelectEpisode = (index: number) => {
    playEpisode(index);
    setShowEpisodeModal(false);
  };

  const onClose = () => {
    setShowEpisodeModal(false);
  };

  return (
    <Modal visible={showEpisodeModal} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>选择剧集</Text>

          {effectiveEpisodes.length > EPISODE_GROUP_SIZE && (
            <View style={styles.episodeGroupContainer}>
              {Array.from({ length: totalGroups }, (_, groupIndex) => (
                <StyledButton
                  key={groupIndex}
                  text={`${groupIndex * EPISODE_GROUP_SIZE + 1}-${Math.min(
                    (groupIndex + 1) * EPISODE_GROUP_SIZE,
                    effectiveEpisodes.length
                  )}`}
                  onPress={() => setSelectedEpisodeGroup(groupIndex)}
                  isSelected={safeGroupIndex === groupIndex}
                  style={styles.episodeGroupButton}
                  textStyle={styles.episodeGroupButtonText}
                />
              ))}
            </View>
          )}

          <FlatList
            data={currentGroupEpisodes}
            numColumns={5}
            contentContainerStyle={styles.episodeList}
            keyExtractor={(_, index) => `episode-${safeGroupIndex * EPISODE_GROUP_SIZE + index}`}
            renderItem={({ item, index }) => {
              const absoluteIndex = safeGroupIndex * EPISODE_GROUP_SIZE + index;
              const isSelected = currentEpisodeIndex === absoluteIndex;
              const shouldFocus = isSelected || (
                (currentEpisodeIndex < safeGroupIndex * EPISODE_GROUP_SIZE ||
                 currentEpisodeIndex >= (safeGroupIndex + 1) * EPISODE_GROUP_SIZE) &&
                index === 0
              );
              return (
                <StyledButton
                  text={item.title || `第 ${absoluteIndex + 1} 集`}
                  onPress={() => onSelectEpisode(absoluteIndex)}
                  isSelected={isSelected}
                  hasTVPreferredFocus={shouldFocus}
                  style={styles.episodeItem}
                  textStyle={styles.episodeItemText}
                />
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {effectiveEpisodes.length === 0 ? "暂无剧集数据" : "当前分组无内容"}
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  modalContent: {
    width: 600,
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    padding: 20,
  },
  modalTitle: {
    color: "white",
    marginBottom: 12,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  episodeList: {
    justifyContent: "flex-start",
  },
  episodeItem: {
    paddingVertical: 2,
    margin: 4,
    width: "18%",
  },
  episodeItemText: {
    fontSize: 14,
  },
  episodeGroupContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  episodeGroupButton: {
    paddingHorizontal: 6,
    margin: 8,
  },
  episodeGroupButtonText: {
    fontSize: 12,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 16,
  },
});

