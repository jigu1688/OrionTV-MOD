import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Pressable, useTVEventHandler } from "react-native";
import {
  Pause,
  Play,
  SkipForward,
  List,
  Tv,
  ArrowDownToDot,
  ArrowUpFromDot,
  Gauge,
} from "lucide-react-native";
import { MediaButton } from "@/components/MediaButton";

import usePlayerStore from "@/stores/playerStore";
import useDetailStore from "@/stores/detailStore";
import { useSources } from "@/stores/sourceStore";

interface PlayerControlsProps {
  showControls: boolean;
  setShowControls: (show: boolean) => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({ showControls }) => {
  const {
    currentEpisodeIndex,
    episodes,
    status,
    isSeeking,
    seekPosition,
    progressPosition,
    playbackRate,
    togglePlayPause,
    playEpisode,
    setShowEpisodeModal,
    setShowSourceModal,
    setShowSpeedModal,
    setIntroEndTime,
    setOutroStartTime,
    introEndTime,
    outroStartTime,
  } = usePlayerStore();

  const { detail } = useDetailStore();
  const resources = useSources();

  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [clockTime, setClockTime] = useState<string>("");
  const lastPressTimeRef = useRef<number>(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const mins = now.getMinutes().toString().padStart(2, "0");
      setClockTime(`${hours}:${mins}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  // 每次打开控制条时重置焦点至首个按钮
  useEffect(() => {
    if (showControls) {
      setFocusedIndex(0);
    }
  }, [showControls]);

  const videoTitle = detail?.title || "";
  const currentEpisode = episodes[currentEpisodeIndex];
  const currentEpisodeTitle = currentEpisode?.title || `第 ${currentEpisodeIndex + 1} 集`;
  const currentSource = resources.find((r) => r.source === detail?.source);
  const currentSourceName = currentSource?.source_name || detail?.source || "默认源";
  const hasNextEpisode = currentEpisodeIndex < (episodes.length || 0) - 1;
  const nextEpisodeTitle = hasNextEpisode ? (episodes[currentEpisodeIndex + 1]?.title || `第 ${currentEpisodeIndex + 2} 集`) : "";

  const formatTime = (milliseconds?: number) => {
    if (!milliseconds || milliseconds <= 0) return "00:00";
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const onPlayNextEpisode = () => {
    if (hasNextEpisode) {
      playEpisode(currentEpisodeIndex + 1);
    }
  };

  const progressPercent = Math.round(
    (isSeeking ? seekPosition : progressPosition) * 100
  );

  const buttonConfigs = [
    {
      key: "play-pause",
      icon: status?.isLoaded && status.isPlaying ? (
        <Pause color="white" size={24} />
      ) : (
        <Play color="white" size={24} />
      ),
      label: status?.isLoaded && status.isPlaying ? "暂停" : "播放",
      hint: status?.isLoaded && status.isPlaying
        ? "【暂停播放】 按确认键暂停当前视频"
        : "【继续播放】 按确认键继续播放视频",
      onPress: togglePlayPause,
    },
    {
      key: "next-episode",
      disabled: !hasNextEpisode,
      icon: <SkipForward color={hasNextEpisode ? "white" : "#666"} size={24} />,
      label: "下一集",
      badge: hasNextEpisode ? "下集" : undefined,
      hint: hasNextEpisode
        ? `【下一集】 按确认键立即播放 ${nextEpisodeTitle}`
        : "【下一集】 当前已是最后一集，暂无后续内容",
      onPress: onPlayNextEpisode,
    },
    {
      key: "episodes",
      icon: <List color="white" size={24} />,
      label: "选集",
      badge: episodes.length > 0 ? `${currentEpisodeIndex + 1}/${episodes.length}` : undefined,
      hint: episodes.length > 0
        ? `【剧集列表】 查看全集 (${currentEpisodeIndex + 1}/${episodes.length})，按确认键打开选集弹窗`
        : "【剧集列表】 查看全集并快速选集播放",
      onPress: () => setShowEpisodeModal(true),
    },
    {
      key: "speed",
      icon: <Gauge color="white" size={24} />,
      label: "倍速",
      badge: playbackRate !== 1.0 ? `${playbackRate}x` : undefined,
      active: playbackRate !== 1.0,
      hint: `【倍速播放】 当前速度 ${playbackRate}x，按确认键打开倍速面板 (0.5x ~ 2.0x)`,
      onPress: () => setShowSpeedModal(true),
    },
    {
      key: "source",
      icon: <Tv color="white" size={24} />,
      label: "换源",
      hint: `【切换片源】 当前源【${currentSourceName}】，按确认键选择其他清晰度与线路`,
      onPress: () => setShowSourceModal(true),
    },
    {
      key: "intro",
      icon: <ArrowDownToDot color="white" size={24} />,
      label: introEndTime ? "片头:已设" : "设片头",
      badge: introEndTime ? formatTime(introEndTime) : undefined,
      active: !!introEndTime,
      hint: introEndTime
        ? `【片头跳过点】 已设为 ${formatTime(introEndTime)} (按确认键可清除片头设置)`
        : `【标记片头】 按确认键将当前时间 (${status?.isLoaded ? formatTime(status.positionMillis) : "00:00"}) 设为片头跳过点`,
      onPress: setIntroEndTime,
    },
    {
      key: "outro",
      icon: <ArrowUpFromDot color="white" size={24} />,
      label: outroStartTime ? "片尾:已设" : "设片尾",
      badge: outroStartTime ? formatTime(outroStartTime) : undefined,
      active: !!outroStartTime,
      hint: outroStartTime
        ? `【片尾跳过点】 已设为倒数 ${formatTime(outroStartTime)} (按确认键可清除片尾设置)`
        : "【标记片尾】 按确认键将当前时间设为片尾跳过点，播放至该时间自动切下集",
      onPress: setOutroStartTime,
    },
  ];

  const handleExecute = (index: number) => {
    const now = Date.now();
    if (now - lastPressTimeRef.current < 250) {
      return;
    }
    lastPressTimeRef.current = now;
    const btn = buttonConfigs[index];
    if (btn && !btn.disabled) {
      btn.onPress();
    }
  };

  useTVEventHandler((event) => {
    if (!showControls) return;

    if (event.eventType === "right") {
      setFocusedIndex((prev) => {
        let next = prev + 1;
        while (next < buttonConfigs.length && buttonConfigs[next]?.disabled) {
          next++;
        }
        return next < buttonConfigs.length ? next : prev;
      });
    } else if (event.eventType === "left") {
      setFocusedIndex((prev) => {
        let next = prev - 1;
        while (next >= 0 && buttonConfigs[next]?.disabled) {
          next--;
        }
        return next >= 0 ? next : prev;
      });
    } else if (event.eventType === "select") {
      handleExecute(focusedIndex);
    }
  });

  return (
    <View style={styles.controlsOverlay}>
      {/* 顶部信息栏 */}
      <View style={styles.topControls}>
        <View style={styles.topLeft}>
          <Text style={styles.videoTitle}>{videoTitle}</Text>
          <Text style={styles.episodeBadge}>{currentEpisodeTitle}</Text>
        </View>

        <View style={styles.topRight}>
          <View style={styles.metaBadge}>
            <Text style={styles.metaBadgeText}>{currentSourceName}</Text>
          </View>
          <View style={[styles.metaBadge, styles.qualityBadge]}>
            <Text style={styles.qualityBadgeText}>1080P</Text>
          </View>
          {clockTime ? <Text style={styles.clockText}>{clockTime}</Text> : null}
        </View>
      </View>

      {/* 底部综合控制区 */}
      <View style={styles.bottomControlsContainer}>
        {/* 进度条与时间显示 */}
        <View style={styles.progressRow}>
          <Text style={styles.timeText}>
            {status?.isLoaded ? formatTime(status.positionMillis) : "00:00"}
          </Text>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground} />
            <View
              style={[
                styles.progressBarFilled,
                {
                  width: `${Math.min(100, Math.max(0, (isSeeking ? seekPosition : progressPosition) * 100))}%`,
                },
              ]}
            />
            <Pressable style={styles.progressBarTouchable} focusable={false} />
          </View>

          <Text style={styles.timeText}>
            {status?.isLoaded ? formatTime(status.durationMillis || 0) : "00:00"}
          </Text>
          <Text style={styles.percentText}>{progressPercent}%</Text>
        </View>

        {/* 动态焦点提示条 (Focus Tooltip Banner) */}
        <View style={styles.focusBanner}>
          <View style={styles.bannerBadge}>
            <Text style={styles.bannerBadgeText}>OK 确认</Text>
          </View>
          <Text style={styles.bannerText} numberOfLines={1}>
            {buttonConfigs[focusedIndex]?.hint || "按遥控器 [左/右] 切换功能按键，按 [确认] 执行操作"}
          </Text>
        </View>

        {/* 核心操作按钮组 */}
        <View style={styles.bottomControls}>
          {buttonConfigs.map((btn, index) => (
            <MediaButton
              key={btn.key}
              hasTVPreferredFocus={showControls && index === 0}
              isFocused={focusedIndex === index}
              disabled={btn.disabled}
              active={btn.active}
              icon={btn.icon}
              label={btn.label}
              badge={btn.badge}
              onFocus={() => setFocusedIndex(index)}
              onPress={() => handleExecute(index)}
            />
          ))}
        </View>

        {/* 底部遥控器操作温馨提示 */}
        <Text style={styles.shortcutGuide}>
          遥控操作: [◄/►] 左右选键/快退快进  •  [确认] 触发功能  •  [返回] 隐藏控制栏
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "space-between",
    paddingHorizontal: 36,
    paddingVertical: 24,
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  videoTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  episodeBadge: {
    color: "#4ade80",
    fontSize: 16,
    fontWeight: "600",
    backgroundColor: "rgba(0, 187, 94, 0.2)",
    borderColor: "rgba(0, 187, 94, 0.4)",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  topRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  metaBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderColor: "rgba(255, 255, 255, 0.25)",
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metaBadgeText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 13,
    fontWeight: "500",
  },
  qualityBadge: {
    backgroundColor: "rgba(0, 187, 94, 0.25)",
    borderColor: "#00bb5e",
  },
  qualityBadgeText: {
    color: "#4ade80",
    fontSize: 13,
    fontWeight: "bold",
  },
  clockText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 6,
  },
  bottomControlsContainer: {
    width: "100%",
    alignItems: "center",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 14,
    marginBottom: 10,
  },
  timeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    minWidth: 48,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  percentText: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 13,
    fontWeight: "500",
    minWidth: 36,
    textAlign: "right",
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    position: "relative",
    justifyContent: "center",
  },
  progressBarBackground: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 3,
  },
  progressBarFilled: {
    position: "absolute",
    left: 0,
    height: 6,
    backgroundColor: "#00bb5e",
    borderRadius: 3,
  },
  progressBarTouchable: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 24,
    top: -9,
    zIndex: 10,
  },
  focusBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(18, 24, 20, 0.90)",
    borderColor: "rgba(0, 187, 94, 0.6)",
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 22,
    marginBottom: 12,
    maxWidth: "85%",
    shadowColor: "#00bb5e",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  bannerBadge: {
    backgroundColor: "#00bb5e",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 10,
  },
  bannerBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  bannerText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    flexWrap: "nowrap",
  },
  shortcutGuide: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 10,
    letterSpacing: 0.5,
  },
});
