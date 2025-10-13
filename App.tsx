import React, { useRef, useState, JSX } from "react";
import { StyleSheet, StatusBar, View, Animated } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import * as SplashScreen from "expo-splash-screen";

// Custom hooks
import { useAuthToken } from "./src/hooks/useAuthToken";
import { useBackHandler } from "./src/hooks/useBackHandler";
import { usePullToRefresh } from "./src/hooks/usePullToRefresh";
import { useWebViewHandlers } from "./src/hooks/useWebViewHandlers";

// Components
import { RefreshIndicator } from "./src/components/RefreshIndicator/RefreshIndicator";
import { LoadingOverlay } from "./src/components/LoadingOverlay/LoadingOverlay";

// Utils and constants
import { ERP_URL } from "./src/constants/config";
import { getInjectedJavaScript } from "./src/utils/injectedScripts";

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

function AppContent(): JSX.Element {
  // Use non-null assertion operator to tell TypeScript this will never be null at runtime
  const webViewRef = useRef<WebView>(null!);
  const [isAtTop, setIsAtTop] = useState<boolean>(true);

  // Custom hooks
  const { authToken, saveAuthToken } = useAuthToken();

  const {
    isLoading,
    canGoBack,
    handleNavigationStateChange,
    handleLoadEnd,
    handleError,
    handleShouldStartLoadWithRequest,
    handleMessage,
  } = useWebViewHandlers(authToken, webViewRef, saveAuthToken, setIsAtTop);

  const { isRefreshing, refreshOffset, panResponder } = usePullToRefresh(
    webViewRef,
    isAtTop
  );

  useBackHandler(canGoBack, webViewRef);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FEFAF1"
        translucent={false}
      />

      <View style={styles.webviewContainer} {...panResponder.panHandlers}>
        <RefreshIndicator
          refreshOffset={refreshOffset}
          isRefreshing={isRefreshing}
        />

        <Animated.View
          style={[
            styles.webview,
            {
              transform: [{ translateY: refreshOffset }],
            },
          ]}
        >
          <WebView
            ref={webViewRef}
            source={{ uri: ERP_URL }}
            style={styles.webview}
            originWhitelist={[
              "https://*",
              "http://*",
              "tel:*",
              "geo:*",
              "maps:*",
            ]}
            cacheEnabled={true}
            cacheMode="LOAD_CACHE_ELSE_NETWORK"
            javaScriptEnabled={true}
            domStorageEnabled={true}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            incognito={false}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            mixedContentMode="compatibility"
            startInLoadingState={true}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn(
                "HTTP Error:",
                nativeEvent.statusCode,
                nativeEvent.description
              );
            }}
            onNavigationStateChange={handleNavigationStateChange}
            onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
            injectedJavaScript={getInjectedJavaScript()}
            onMessage={handleMessage}
            userAgent="GoldensERP-Mobile/1.0 (Expo) React-Native"
            allowsBackForwardNavigationGestures={true}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={true}
            automaticallyAdjustContentInsets={false}
            contentInset={{ top: 0, left: 0, bottom: 0, right: 0 }}
            bounces={false}
            scrollEnabled={true}
            nestedScrollEnabled={true}
          />
        </Animated.View>
      </View>

      {isLoading && <LoadingOverlay />}
    </SafeAreaView>
  );
}

export default function App(): JSX.Element {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  webviewContainer: {
    flex: 1,
    position: "relative",
  },
  webview: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
});
