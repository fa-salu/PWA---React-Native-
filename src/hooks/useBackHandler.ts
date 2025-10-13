import { useEffect } from "react";
import { Platform, Alert, BackHandler } from "react-native";
import { WebView } from "react-native-webview";

export const useBackHandler = (
  canGoBack: boolean,
  webViewRef: React.RefObject<WebView | null>
) => {
  useEffect(() => {
    if (Platform.OS === "android") {
      const backAction = (): boolean => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        Alert.alert("Exit App", "Are you sure you want to exit?", [
          { text: "Cancel", style: "cancel" },
          { text: "Exit", onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );
      return () => backHandler.remove();
    }
  }, [canGoBack, webViewRef]);
};
