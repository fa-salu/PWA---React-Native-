import React from "react";
import { Animated, ActivityIndicator, Text } from "react-native";
import { styles } from "./RefreshIndicator.styles";

interface RefreshIndicatorProps {
  refreshOffset: Animated.Value;
  isRefreshing: boolean;
}

export const RefreshIndicator: React.FC<RefreshIndicatorProps> = ({
  refreshOffset,
  isRefreshing,
}) => {
  return (
    <Animated.View
      style={[
        styles.refreshIndicator,
        {
          opacity: refreshOffset.interpolate({
            inputRange: [0, 80],
            outputRange: [0, 1],
            extrapolate: "clamp",
          }),
          transform: [
            {
              translateY: refreshOffset.interpolate({
                inputRange: [0, 150],
                outputRange: [-40, 20],
                extrapolate: "clamp",
              }),
            },
          ],
        },
      ]}
    >
      <ActivityIndicator size="small" color="#000" />
      <Text style={styles.refreshText}>
        {isRefreshing ? "Refreshing..." : "Pull to refresh"}
      </Text>
    </Animated.View>
  );
};
