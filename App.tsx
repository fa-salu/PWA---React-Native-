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
  Image,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  WebView,
  WebViewNavigation,
  WebViewMessageEvent,
} from "react-native-webview";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { printHandler } from "./src/utils/printHandler";

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

const ERP_URL = "https://web.goldensignaturetrading.com";

interface WebViewMessage {
  type: string;
  timestamp?: string;
  data?: any;
}

function AppContent(): JSX.Element {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [canGoBack, setCanGoBack] = useState<boolean>(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Load auth token from AsyncStorage on mount
  useEffect(() => {
    const loadAuthToken = async () => {
      try {
        const token = await AsyncStorage.getItem("auth_token");
        setAuthToken(token);
        console.log(
          "Loaded auth token from storage:",
          token ? "exists" : "none"
        );
      } catch (error) {
        console.error("Failed to load auth token:", error);
      }
    };

    loadAuthToken();
  }, []);

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

  const handleRefresh = (): void => {
    setRefreshing(true);
    webViewRef.current?.reload();
    // Auto-stop refreshing after 2 seconds
    setTimeout(() => setRefreshing(false), 2000);
  };

  const handleNavigationStateChange = (navState: WebViewNavigation): void => {
    setCanGoBack(navState.canGoBack);
  };

  const handleLoadEnd = (): void => {
    setIsLoading(false);
    setRefreshing(false);
    SplashScreen.hideAsync();

    // Inject saved auth token into WebView cookies after load
    if (authToken && webViewRef.current) {
      const setCookieScript = `
        (function() {
          try {
            // Set cookie with long expiration
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            document.cookie = "auth_token=${authToken}; expires=" + expiryDate.toUTCString() + "; path=/; SameSite=Lax";
            
            console.log('Auth token injected into cookies');
            
            // Notify that token is set
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'TOKEN_INJECTED',
                success: true
              }));
            }
          } catch (error) {
            console.error('Failed to inject token:', error);
          }
        })();
        true;
      `;

      webViewRef.current.injectJavaScript(setCookieScript);
    }
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
      "web.goldensignaturetrading.com",
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

    // Intercept cookie changes and sync to React Native
    const originalCookieSetter = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie').set;
    Object.defineProperty(document, 'cookie', {
      set: function(value) {
        originalCookieSetter.call(document, value);
        
        // Check if it's the auth_token cookie
        if (value.includes('auth_token=')) {
          const match = value.match(/auth_token=([^;]+)/);
          if (match && match[1] && window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SAVE_AUTH_TOKEN',
              token: match[1]
            }));
          }
        }
      },
      get: function() {
        return Object.getOwnPropertyDescriptor(Document.prototype, 'cookie').get.call(document);
      }
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
          userAgent: navigator.userAgent,
          cookies: document.cookie
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

  const handleMessage = async (event: WebViewMessageEvent): Promise<void> => {
    try {
      const data: WebViewMessage = JSON.parse(event.nativeEvent.data);
      console.log("Message from WebView:", data);

      switch (data.type) {
        case "APP_READY":
          console.log("ERP system loaded successfully");
          console.log("Current cookies:", data.data?.cookies);
          break;

        case "SAVE_AUTH_TOKEN":
          // Save token to AsyncStorage when user logs in
          if (data.data?.token) {
            await AsyncStorage.setItem("auth_token", data.data.token);
            setAuthToken(data.data.token);
            console.log("Auth token saved to AsyncStorage");
          }
          break;

        case "TOKEN_INJECTED":
          console.log("Token injection confirmed");
          break;

        case "ORIENTATION_CHANGED":
          console.log("Orientation changed:", data.data);
          break;

        case "PRINT_DATA":
        case "SHARE_DATA":
        case "DOWNLOAD_DATA":
        case "THERMAL_PRINT_DATA":
        case "DOWNLOAD_PDF":
        case "DOWNLOAD_EXCEL":
          printHandler.handleMessage(event);
          break;

        default:
          console.log("Unknown message type:", data.type);
      }
    } catch (error) {
      console.warn("Message parsing error:", error);
    }
  };

  // const handleRefresh = (): void => {
  //   webViewRef.current?.reload();
  // };

  // const LoadingComponent = (): JSX.Element => (
  //   <View style={styles.loadingContainer}>
  //     <View style={styles.loadingContent}>
  //       <ActivityIndicator size="large" color="#000" />
  //     </View>

  //     <View style={styles.logoContainer}>
  //       <Image
  //         source={require("./assets/adaptive-icon.png")}
  //         style={styles.companyLogo}
  //         resizeMode="contain"
  //       />
  //       <Text style={styles.companyText}>Golden Signature Trading</Text>
  //     </View>
  //   </View>
  // );

  const ErrorComponent = (
    errorDomain: string | undefined,
    errorCode: number,
    errorDesc: string
  ): JSX.Element => (
    <View style={styles.errorContainer}>
      <View style={styles.errorContent}>
        <Text style={styles.errorText}>Connection Error</Text>
        <Text style={styles.errorDesc}>{errorDesc}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.logoContainer}>
        <Image
          source={require("./assets/adaptive-icon.png")}
          style={styles.companyLogo}
          resizeMode="contain"
        />
        <Text style={styles.companyText}>Golden Signature Trading</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#FEFAF1"
        translucent={false}
      />
      <ScrollView
        style={styles.webview}
        contentContainerStyle={{ flex: 1 }}
        scrollEnabled={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#000"
            title="Refreshing..."
            titleColor="#000"
            colors={["#1976D2"]}
          />
        }
      >
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
          // renderLoading={LoadingComponent}
          renderError={ErrorComponent}
        />
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#000" />
            <Text style={styles.loadingSubtext}>Connecting to server...</Text>
          </View>

          <View style={styles.logoContainer}>
            <Image
              source={require("./assets/adaptive-icon.png")}
              style={styles.companyLogo}
              resizeMode="contain"
            />
            <Text style={styles.companyText}>Golden Signature Trading</Text>
          </View>
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
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  errorContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  logoContainer: {
    alignItems: "center",
    paddingBottom: 20,
  },
  companyLogo: {
    width: 50,
    height: 50,
    marginBottom: 8,
  },
  companyText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
  },
});
