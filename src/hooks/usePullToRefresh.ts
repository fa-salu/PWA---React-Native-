import { useRef, useState } from "react";
import { PanResponder, Animated } from "react-native";
import { WebView } from "react-native-webview";

export const usePullToRefresh = (
  webViewRef: React.RefObject<WebView | null>,
  isAtTop: boolean
) => {
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const refreshOffset = useRef(new Animated.Value(0)).current;
  const REFRESH_ZONE_HEIGHT = 130;
  const pullStartY = useRef<number>(0);
  const isPulling = useRef<boolean>(false);

  const handleRefresh = () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    Animated.timing(refreshOffset, {
      toValue: 60,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      webViewRef.current?.reload();

      setTimeout(() => {
        Animated.timing(refreshOffset, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setIsRefreshing(false);
        });
      }, 1000);
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const touchY = evt.nativeEvent.pageY;
        if (isAtTop && touchY <= REFRESH_ZONE_HEIGHT && gestureState.dy > 20) {
          pullStartY.current = touchY;
          isPulling.current = true;
          return true;
        }
        return false;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!isPulling.current) return;
        if (gestureState.dy > 0 && gestureState.dy < 150) {
          refreshOffset.setValue(gestureState.dy * 0.4);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (!isPulling.current) return;
        isPulling.current = false;

        if (gestureState.dy > 80) {
          handleRefresh();
        } else {
          Animated.spring(refreshOffset, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        isPulling.current = false;
        Animated.spring(refreshOffset, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return {
    isRefreshing,
    refreshOffset,
    panResponder,
  };
};
