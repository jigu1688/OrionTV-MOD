import React, { useCallback, useRef, useState, useEffect, useMemo } from "react";
import { View, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, BackHandler, Platform } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { getCommonResponsiveStyles } from "@/utils/ResponsiveStyles";

interface CustomScrollViewProps {
  data: any[];
  renderItem: ({ item, index }: { item: any; index: number }) => React.ReactNode;
  numColumns?: number; // 如果不提供，将使用响应式默认值
  loading?: boolean;
  loadingMore?: boolean;
  error?: string | null;
  onEndReached?: () => void;
  loadMoreThreshold?: number;
  emptyMessage?: string;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
}

const CustomScrollView: React.FC<CustomScrollViewProps> = ({
  data,
  renderItem,
  numColumns,
  loading = false,
  loadingMore = false,
  error = null,
  onEndReached,
  loadMoreThreshold = 200,
  emptyMessage = "暂无内容",
  ListFooterComponent,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const responsiveConfig = useResponsiveLayout();
  const commonStyles = getCommonResponsiveStyles(responsiveConfig);
  const { deviceType } = responsiveConfig;

  // 使用响应式列数，如果没有明确指定的话
  const effectiveColumns = numColumns || responsiveConfig.columns;

  const scrollToTop = useCallback(() => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // 添加返回键处理逻辑：在 TV 端滚动到底部后，按返回键先返回顶部
  useEffect(() => {
    if (deviceType === 'tv') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (showScrollToTop) {
          scrollToTop();
          return true; // 阻止默认的返回行为
        }
        return false; // 允许默认的返回行为
      });

      return () => backHandler.remove();
    }
  }, [showScrollToTop, deviceType, scrollToTop]);

  const handleScroll = useCallback(
    ({ nativeEvent }: { nativeEvent: any }) => {
      const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
      const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - loadMoreThreshold;

      // 显示/隐藏返回顶部按钮
      setShowScrollToTop(contentOffset.y > 200);

      if (isCloseToBottom && !loadingMore && onEndReached) {
        onEndReached();
      }
    },
    [onEndReached, loadingMore, loadMoreThreshold]
  );

  const renderFooter = useCallback(() => {
    if (ListFooterComponent) {
      if (React.isValidElement(ListFooterComponent)) {
        return ListFooterComponent;
      } else if (typeof ListFooterComponent === "function") {
        const Component = ListFooterComponent as React.ComponentType<any>;
        return <Component />;
      }
      return null;
    }
    if (loadingMore) {
      return <ActivityIndicator style={{ marginVertical: 20 }} size="large" />;
    }
    return null;
  }, [ListFooterComponent, loadingMore]);

  // 将数据按行分组并使用 useMemo 缓存
  const rows = useMemo(() => {
    const grouped = [];
    for (let i = 0; i < data.length; i += effectiveColumns) {
      grouped.push(data.slice(i, i + effectiveColumns));
    }
    return grouped;
  }, [data, effectiveColumns]);

  // 动态样式
  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        listContent: {
          paddingBottom: responsiveConfig.spacing * 2,
          paddingHorizontal: responsiveConfig.spacing / 2,
        },
        rowContainer: {
          flexDirection: "row",
          marginBottom: responsiveConfig.spacing,
        },
        fullRowContainer: {
          justifyContent: "space-around",
          marginRight: responsiveConfig.spacing / 2,
        },
        partialRowContainer: {
          justifyContent: "flex-start",
        },
        itemContainer: {
          width: responsiveConfig.cardWidth,
        },
        itemWithMargin: {
          width: responsiveConfig.cardWidth,
          marginRight: responsiveConfig.spacing,
        },
        scrollToTopButton: {
          position: "absolute",
          right: responsiveConfig.spacing,
          bottom: responsiveConfig.spacing * 2,
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          padding: responsiveConfig.spacing,
          borderRadius: responsiveConfig.spacing,
          opacity: showScrollToTop ? 1 : 0,
        },
      }),
    [responsiveConfig, showScrollToTop]
  );

  const renderRow = useCallback(
    ({ item: row, index: rowIndex }: { item: any[]; index: number }) => {
      const isFullRow = row.length === effectiveColumns;
      const rowStyle = isFullRow ? dynamicStyles.fullRowContainer : dynamicStyles.partialRowContainer;

      return (
        <View style={[dynamicStyles.rowContainer, rowStyle]}>
          {row.map((item, itemIndex) => {
            const actualIndex = rowIndex * effectiveColumns + itemIndex;
            const isLastItemInPartialRow = !isFullRow && itemIndex === row.length - 1;
            const itemStyle = isLastItemInPartialRow ? dynamicStyles.itemContainer : dynamicStyles.itemWithMargin;

            return (
              <View
                key={item?.id ? `item-${item.id}-${actualIndex}` : `item-${actualIndex}`}
                style={isFullRow ? dynamicStyles.itemContainer : itemStyle}
              >
                {renderItem({ item, index: actualIndex })}
              </View>
            );
          })}
        </View>
      );
    },
    [effectiveColumns, dynamicStyles, renderItem]
  );

  if (loading) {
    return (
      <View style={commonStyles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={commonStyles.center}>
        <ThemedText type="subtitle" style={{ padding: responsiveConfig.spacing }}>
          {error}
        </ThemedText>
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={commonStyles.center}>
        <ThemedText>{emptyMessage}</ThemedText>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        data={rows}
        keyExtractor={(_, index) => `row-${index}`}
        renderItem={renderRow}
        contentContainerStyle={dynamicStyles.listContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews={Platform.OS === "android"}
        showsVerticalScrollIndicator={deviceType !== "tv"}
        ListFooterComponent={renderFooter}
      />
      {deviceType !== "tv" && (
        <TouchableOpacity
          style={dynamicStyles.scrollToTopButton}
          onPress={scrollToTop}
          activeOpacity={0.8}
        >
          <ThemedText>⬆️</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default CustomScrollView;
