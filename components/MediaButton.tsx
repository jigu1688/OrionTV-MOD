import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Animated,
  StyleProp,
  ViewStyle,
  Platform,
} from "react-native";
import { useButtonAnimation } from "@/hooks/useAnimation";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";

export interface MediaButtonProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  onPress?: () => void;
  disabled?: boolean;
  hasTVPreferredFocus?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  style?: StyleProp<ViewStyle>;
  active?: boolean;
  isFocused?: boolean;
}

export const MediaButton: React.FC<MediaButtonProps> = ({
  icon,
  label,
  badge,
  onPress,
  disabled = false,
  hasTVPreferredFocus = false,
  onFocus,
  onBlur,
  style,
  active = false,
  isFocused: controlledFocused,
}) => {
  const [internalFocused, setInternalFocused] = useState(false);
  const effectiveFocused =
    controlledFocused !== undefined ? controlledFocused : internalFocused;
  const animationStyle = useButtonAnimation(effectiveFocused, 1.08);
  const { deviceType } = useResponsiveLayout();

  return (
    <Animated.View style={[animationStyle, style]}>
      <Pressable
        hasTVPreferredFocus={hasTVPreferredFocus}
        focusable={!disabled}
        disabled={disabled}
        onPress={onPress}
        onFocus={() => {
          setInternalFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          setInternalFocused(false);
          onBlur?.();
        }}
        android_ripple={
          Platform.isTV || deviceType !== "tv"
            ? { color: "transparent" }
            : { color: "rgba(0, 187, 94, 0.3)" }
        }
        style={({ focused }) => {
          const isButtonFocused =
            controlledFocused !== undefined
              ? controlledFocused
              : internalFocused || focused;

          return [
            styles.button,
            isButtonFocused ? styles.buttonFocused : styles.buttonNormal,
            active && !isButtonFocused && styles.buttonActive,
            disabled && styles.buttonDisabled,
          ];
        }}
      >
        {/* 右上角微标 / 状态信息 */}
        {badge ? (
          <View
            style={[
              styles.badgeContainer,
              effectiveFocused && styles.badgeContainerFocused,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                effectiveFocused && styles.badgeTextFocused,
              ]}
              numberOfLines={1}
            >
              {badge}
            </Text>
          </View>
        ) : null}

        {/* 核心图标容器 */}
        <View style={styles.iconContainer}>
          {icon}
        </View>

        {/* 底部中文文本标注 */}
        <Text
          style={[
            styles.label,
            effectiveFocused ? styles.labelFocused : styles.labelNormal,
            disabled && styles.labelDisabled,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 96,
    height: 70,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    position: "relative",
  },
  buttonNormal: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    borderColor: "rgba(255, 255, 255, 0.22)",
  },
  buttonFocused: {
    backgroundColor: "#00bb5e",
    borderColor: "#6ee7b7",
    shadowColor: "#00bb5e",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 8,
  },
  buttonActive: {
    borderColor: "#00bb5e",
    backgroundColor: "rgba(0, 187, 94, 0.25)",
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  iconContainer: {
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "600",
    textAlign: "center",
  },
  labelNormal: {
    color: "rgba(255, 255, 255, 0.88)",
  },
  labelFocused: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  labelDisabled: {
    color: "rgba(255, 255, 255, 0.45)",
  },
  badgeContainer: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    borderColor: "rgba(255, 255, 255, 0.35)",
    borderWidth: 0.5,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    maxWidth: 48,
  },
  badgeContainerFocused: {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#6ee7b7",
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
  },
  badgeTextFocused: {
    color: "#FFFFFF",
  },
});
