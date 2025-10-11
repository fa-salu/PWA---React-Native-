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
  Linking,
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

// Production URL
// const ERP_URL = "https://web.goldensignaturetrading.com";
// Development URL
const ERP_URL = "https://goldensignature-one.vercel.app";

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
    setTimeout(() => setRefreshing(false), 2000);
  };

  const handleNavigationStateChange = (navState: WebViewNavigation): void => {
    setCanGoBack(navState.canGoBack);
  };

  const handleLoadEnd = (): void => {
    setIsLoading(false);
    setRefreshing(false);
    SplashScreen.hideAsync();

    if (authToken && webViewRef.current) {
      const setCookieScript = `
        (function() {
          try {
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            document.cookie = "auth_token=${authToken}; expires=" + expiryDate.toUTCString() + "; path=/; SameSite=Lax";
            
            console.log('Auth token injected into cookies');
            
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
    setRefreshing(false);
    setIsLoading(false);
  };

  const handleShouldStartLoadWithRequest = (request: any): boolean => {
    const { url } = request;

    if (url.startsWith("tel:")) {
      Linking.openURL(url).catch((err) => {
        console.error("Failed to open phone app:", err);
        Alert.alert("Error", "Could not open phone app");
      });
      return false;
    }

    if (
      url.startsWith("geo:") ||
      url.startsWith("maps:") ||
      url.includes("maps.google.com") ||
      url.includes("maps.apple.com") ||
      url.includes("goo.gl/maps")
    ) {
      let mapUrl = url;
      if (url.includes("maps.google.com") || url.includes("goo.gl/maps")) {
        if (Platform.OS === "ios") {
          mapUrl = url.replace(
            "https://maps.google.com",
            "maps://maps.google.com"
          );
        } else {
          const match = url.match(/(@|q=)([^&]+)/);
          if (match) {
            const coords = match[2];
            mapUrl = `geo:0,0?q=${coords}`;
          }
        }
      }

      Linking.openURL(mapUrl).catch((err) => {
        console.error("Failed to open maps app:", err);
        Linking.openURL(url).catch(() => {
          Alert.alert("Error", "Could not open maps app");
        });
      });
      return false;
    }

    const allowedDomains: string[] = [
      "goldensignature-one.vercel.app",
      "www.goldensignaturetrading.com",
      "goldensignaturetrading.com",
      "web.goldensignaturetrading.com",
    ];

    try {
      const urlObj = new URL(url);
      return allowedDomains.includes(urlObj.hostname);
    } catch (error) {
      console.warn("Invalid URL:", url);
      return false;
    }
  };

  const injectedJavaScript: string = `
  (function() {
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

    // Enhanced click handling for phone and map links
    document.addEventListener('click', function(e) {
      let target = e.target;
      
      // Find the actual link element
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }
      
      if (target && target.href) {
        const href = target.href;
        
        // Handle phone links
        if (href.startsWith('tel:')) {
          e.preventDefault();
          window.location.href = href;
          return false;
        }
        
        // Handle map links
        if (href.startsWith('geo:') || 
            href.startsWith('maps:') || 
            href.includes('maps.google.com') || 
            href.includes('maps.apple.com') ||
            href.includes('goo.gl/maps')) {
          e.preventDefault();
          window.location.href = href;
          return false;
        }
      }
    }, true);

    // Prevent context menu on long press
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
    });

    // Intercept cookie changes and sync to React Native
    const originalCookieSetter = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie').set;
    Object.defineProperty(document, 'cookie', {
      set: function(value) {
        originalCookieSetter.call(document, value);
        
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

    // Add touch feedback and styling
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

      /* Enhanced styling for phone and map links */
      a[href^="tel:"] {
        color: #007AFF !important;
        text-decoration: none !important;
        padding: 4px 8px;
        border-radius: 4px;
        background-color: rgba(0, 122, 255, 0.1);
        font-weight: 500;
      }
      
      a[href*="maps"], a[href^="geo:"] {
        color: #34C759 !important;
        text-decoration: none !important; 
        padding: 4px 8px;
        border-radius: 4px;
        background-color: rgba(52, 199, 89, 0.1);
        font-weight: 500;
      }

      /* Touch feedback */
      a[href^="tel:"]:active,
      a[href*="maps"]:active,
      a[href^="geo:"]:active,
      button:active,
      .btn:active,
      [role="button"]:active {
        transform: scale(0.95);
        transition: transform 0.1s;
        opacity: 0.7;
      }

      .pwa-install-button,
      .install-prompt {
        display: none !important;
      }
    \`;
    document.head.appendChild(style);

    // Send ready signal
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
          break;

        case "SAVE_AUTH_TOKEN":
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
          injectedJavaScript={injectedJavaScript}
          onMessage={handleMessage}
          userAgent="GoldensERP-Mobile/1.0 (Expo) React-Native"
          allowsBackForwardNavigationGestures={true}
          pullToRefreshEnabled={true}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          automaticallyAdjustContentInsets={false}
          contentInset={{ top: 0, left: 0, bottom: 0, right: 0 }}
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
