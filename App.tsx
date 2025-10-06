import React, { useRef, useState, useEffect, JSX } from "react";
import {
  StyleSheet,
  StatusBar,
  View,
  Text,
  TouchableOpacity,
  Alert,
  BackHandler,
  Platform,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  WebView,
  WebViewNavigation,
  WebViewMessageEvent,
} from "react-native-webview";
import * as SplashScreen from "expo-splash-screen";
import { printHandler } from "./src/utils/printHandler";

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

const ERP_URL = "https://goldensignature-one.vercel.app";
// const ERP_URL = "https://web.goldensignaturetrading.com";

interface WebViewMessage {
  type: string;
  timestamp?: string;
  data?: any;
}

function AppContent(): JSX.Element {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [canGoBack, setCanGoBack] = useState<boolean>(false);

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
  }, [canGoBack]);

  const handleNavigationStateChange = (navState: WebViewNavigation): void => {
    setCanGoBack(navState.canGoBack);
  };

  const handleLoadEnd = (): void => {
    setIsLoading(false);
    SplashScreen.hideAsync();
  };

  const handleError = (error: any): void => {
    console.error("WebView Error:", error);
    Alert.alert(
      "Connection Error",
      "Failed to load the ERP system. Please check your internet connection.",
      [
        { text: "Retry", onPress: () => webViewRef.current?.reload() },
        { text: "Cancel" },
      ]
    );
  };

  const handleShouldStartLoadWithRequest = (request: any): boolean => {
    const allowedDomains: string[] = [
      "goldensignature-one.vercel.app",
      "www.goldensignaturetrading.com",
      "goldensignaturetrading.com",
    ];

    try {
      const url = new URL(request.url);
      return allowedDomains.includes(url.hostname);
    } catch (error) {
      console.warn("Invalid URL:", request.url);
      return false;
    }
  };

  const injectedJavaScript: string = `
  (function() {
    // Prevent multiple executions
    if (window.goldensAppInitialized) {
      return;
    }
    window.goldensAppInitialized = true;
    
    // Add mobile-specific viewport meta tag
    const existingMeta = document.querySelector('meta[name="viewport"]');
    if (existingMeta) {
      existingMeta.remove();
    }
    
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    document.getElementsByTagName('head')[0].appendChild(meta);
    
    // Add mobile app identifier
    window.isMobileApp = true;
    window.appVersion = '1.0.0';
    window.platform = '${Platform.OS}';
    
    // Prevent context menu on long press
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
    });
    
    // Add touch feedback for better mobile experience
    const style = document.createElement('style');
    style.innerHTML = \`
      * {
        -webkit-tap-highlight-color: rgba(0,0,0,0);
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        user-select: none;
      }
      
      input, button, select, textarea {
        -webkit-user-select: text;
        user-select: text;
        touch-action: manipulation;
      }
      
      button:active, 
      .btn:active,
      [role="button"]:active {
        transform: scale(0.98);
        transition: transform 0.1s;
      }
      
      /* Hide any desktop PWA install prompts */
      .pwa-install-button,
      .install-prompt {
        display: none !important;
      }
    \`;
    document.head.appendChild(style);
    
    // Send ready signal only once
    setTimeout(() => {
      if (window.ReactNativeWebView && !window.appReadySent) {
        window.appReadySent = true;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'APP_READY',
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent
        }));
      }
    }, 1000);
    
    // Handle orientation changes
    window.addEventListener('orientationchange', function() {
      setTimeout(() => {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'ORIENTATION_CHANGED',
            orientation: screen.orientation?.angle || 0
          }));
        }
      }, 100);
    });
  })();
  true;
`;

  // Updated message handler to use print handler
  const handleMessage = (event: WebViewMessageEvent): void => {
    console.log("eventtt", event);

    try {
      const data: WebViewMessage = JSON.parse(event.nativeEvent.data);
      console.log("Message from WebView:", data);

      switch (data.type) {
        case "APP_READY":
          console.log("ERP system loaded successfully");
          break;
        case "ORIENTATION_CHANGED":
          console.log("Orientation changed:", data.data);
          break;
        // Handle print-related messages
        case "PRINT_DATA":
        case "SHARE_DATA":
        case "DOWNLOAD_DATA":
        case "THERMAL_PRINT_DATA":
          printHandler.handleMessage(event);
          break;
        default:
          console.log("Unknown message type:", data.type);
      }
    } catch (error) {
      console.warn("Message parsing error:", error);
    }
  };

  const handleRefresh = (): void => {
    webViewRef.current?.reload();
  };

  const LoadingComponent = (): JSX.Element => (
    <View style={styles.loadingContainer}>
      <Text style={styles.loadingText}>Loading Golden ERP...</Text>
      <Text style={styles.loadingSubtext}>Please wait</Text>
    </View>
  );

  const ErrorComponent = (
    errorDomain: string | undefined,
    errorCode: number,
    errorDesc: string
  ): JSX.Element => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>Connection Error</Text>
      <Text style={styles.errorDesc}>{errorDesc}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FEFAF1"
        translucent={false}
      />

      <WebView
        ref={webViewRef}
        source={{ uri: ERP_URL }}
        style={styles.webview}
        cacheEnabled={true}
        cacheMode="LOAD_CACHE_ELSE_NETWORK"
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
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
        injectedJavaScript={injectedJavaScript}
        onMessage={handleMessage}
        userAgent="GoldensERP-Mobile/1.0 (Expo) React-Native"
        originWhitelist={["https://*"]}
        allowsBackForwardNavigationGestures={true}
        pullToRefreshEnabled={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustContentInsets={false}
        contentInset={{ top: 0, left: 0, bottom: 0, right: 0 }}
        renderLoading={LoadingComponent}
        renderError={ErrorComponent}
      />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading Goldens ERP...</Text>
          <Text style={styles.loadingSubtext}>Connecting to server...</Text>
        </View>
      )}
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
  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    marginRight: 16,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    borderRadius: 4,
  },
  backButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  refreshButton: {
    padding: 8,
    borderRadius: 4,
  },
  refreshButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1976D2",
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#d32f2f",
    marginBottom: 10,
  },
  errorDesc: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: "#1976D2",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
