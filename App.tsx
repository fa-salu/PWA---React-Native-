// import React, { useRef, useState, useEffect, JSX } from "react";
// import {
//   StyleSheet,
//   StatusBar,
//   View,
//   Text,
//   TouchableOpacity,
//   Alert,
//   BackHandler,
//   Platform,
//   Image,
//   ActivityIndicator,
//   ScrollView,
//   RefreshControl,
//   Linking,
// } from "react-native";
// import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
// import {
//   WebView,
//   WebViewNavigation,
//   WebViewMessageEvent,
// } from "react-native-webview";
// import * as SplashScreen from "expo-splash-screen";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { printHandler } from "./src/utils/printHandler";

// // Keep splash screen visible while loading
// SplashScreen.preventAutoHideAsync();

// // Production URL
// // const ERP_URL = "https://web.goldensignaturetrading.com";
// // Development URL
// const ERP_URL = "https://goldensignature-one.vercel.app";

// interface WebViewMessage {
//   type: string;
//   timestamp?: string;
//   data?: any;
// }

// function AppContent(): JSX.Element {
//   const webViewRef = useRef<WebView>(null);
//   const [isLoading, setIsLoading] = useState<boolean>(true);
//   const [canGoBack, setCanGoBack] = useState<boolean>(false);
//   const [authToken, setAuthToken] = useState<string | null>(null);
//   const [refreshing, setRefreshing] = useState<boolean>(false);

//   // Load auth token from AsyncStorage on mount
//   useEffect(() => {
//     const loadAuthToken = async () => {
//       try {
//         const token = await AsyncStorage.getItem("auth_token");
//         setAuthToken(token);
//       } catch (error) {
//         console.error("Failed to load auth token:", error);
//       }
//     };

//     loadAuthToken();
//   }, []);

//   useEffect(() => {
//     if (Platform.OS === "android") {
//       const backAction = (): boolean => {
//         if (canGoBack && webViewRef.current) {
//           webViewRef.current.goBack();
//           return true;
//         }
//         Alert.alert("Exit App", "Are you sure you want to exit?", [
//           { text: "Cancel", style: "cancel" },
//           { text: "Exit", onPress: () => BackHandler.exitApp() },
//         ]);
//         return true;
//       };

//       const backHandler = BackHandler.addEventListener(
//         "hardwareBackPress",
//         backAction
//       );
//       return () => backHandler.remove();
//     }
//   }, [canGoBack]);

//   const handleRefresh = (): void => {
//     setRefreshing(true);
//     webViewRef.current?.reload();
//     setTimeout(() => setRefreshing(false), 2000);
//   };

//   const handleNavigationStateChange = (navState: WebViewNavigation): void => {
//     setCanGoBack(navState.canGoBack);
//   };

//   const handleLoadEnd = (): void => {
//     setIsLoading(false);
//     setRefreshing(false);
//     SplashScreen.hideAsync();

//     if (authToken && webViewRef.current) {
//       const setCookieScript = `
//         (function() {
//           try {
//             const expiryDate = new Date();
//             expiryDate.setDate(expiryDate.getDate() + 30);
//             document.cookie = "auth_token=${authToken}; expires=" + expiryDate.toUTCString() + "; path=/; SameSite=Lax";

//             console.log('Auth token injected into cookies');

//             if (window.ReactNativeWebView) {
//               window.ReactNativeWebView.postMessage(JSON.stringify({
//                 type: 'TOKEN_INJECTED',
//                 success: true
//               }));
//             }
//           } catch (error) {
//             console.error('Failed to inject token:', error);
//           }
//         })();
//         true;
//       `;

//       webViewRef.current.injectJavaScript(setCookieScript);
//     }
//   };

//   const handleError = (error: any): void => {
//     console.error("WebView Error:", error);
//     setRefreshing(false);
//     setIsLoading(false);
//   };

//   const handleShouldStartLoadWithRequest = (request: any): boolean => {
//     const { url } = request;

//     if (url.startsWith("tel:")) {
//       Linking.openURL(url).catch((err) => {
//         console.error("Failed to open phone app:", err);
//         Alert.alert("Error", "Could not open phone app");
//       });
//       return false;
//     }

//     if (
//       url.startsWith("geo:") ||
//       url.startsWith("maps:") ||
//       url.includes("maps.google.com") ||
//       url.includes("maps.apple.com") ||
//       url.includes("goo.gl/maps")
//     ) {
//       let mapUrl = url;
//       if (url.includes("maps.google.com") || url.includes("goo.gl/maps")) {
//         if (Platform.OS === "ios") {
//           mapUrl = url.replace(
//             "https://maps.google.com",
//             "maps://maps.google.com"
//           );
//         } else {
//           const match = url.match(/(@|q=)([^&]+)/);
//           if (match) {
//             const coords = match[2];
//             mapUrl = `geo:0,0?q=${coords}`;
//           }
//         }
//       }

//       Linking.openURL(mapUrl).catch((err) => {
//         console.error("Failed to open maps app:", err);
//         Linking.openURL(url).catch(() => {
//           Alert.alert("Error", "Could not open maps app");
//         });
//       });
//       return false;
//     }

//     const allowedDomains: string[] = [
//       "goldensignature-one.vercel.app",
//       "www.goldensignaturetrading.com",
//       "goldensignaturetrading.com",
//       "web.goldensignaturetrading.com",
//     ];

//     try {
//       const urlObj = new URL(url);
//       return allowedDomains.includes(urlObj.hostname);
//     } catch (error) {
//       console.warn("Invalid URL:", url);
//       return false;
//     }
//   };

//   const injectedJavaScript: string = `
//   (function() {
//     if (window.goldensAppInitialized) {
//       return;
//     }
//     window.goldensAppInitialized = true;

//     // Add mobile-specific viewport meta tag
//     const existingMeta = document.querySelector('meta[name="viewport"]');
//     if (existingMeta) {
//       existingMeta.remove();
//     }

//     const meta = document.createElement('meta');
//     meta.name = 'viewport';
//     meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
//     document.getElementsByTagName('head')[0].appendChild(meta);

//     // Add mobile app identifier
//     window.isMobileApp = true;
//     window.appVersion = '1.0.0';
//     window.platform = '${Platform.OS}';

//     // Enhanced click handling for phone and map links
//     document.addEventListener('click', function(e) {
//       let target = e.target;

//       // Find the actual link element
//       while (target && target.tagName !== 'A') {
//         target = target.parentElement;
//       }

//       if (target && target.href) {
//         const href = target.href;

//         // Handle phone links
//         if (href.startsWith('tel:')) {
//           e.preventDefault();
//           window.location.href = href;
//           return false;
//         }

//         // Handle map links
//         if (href.startsWith('geo:') ||
//             href.startsWith('maps:') ||
//             href.includes('maps.google.com') ||
//             href.includes('maps.apple.com') ||
//             href.includes('goo.gl/maps')) {
//           e.preventDefault();
//           window.location.href = href;
//           return false;
//         }
//       }
//     }, true);

//     // Prevent context menu on long press
//     document.addEventListener('contextmenu', function(e) {
//       e.preventDefault();
//     });

//     // Intercept cookie changes and sync to React Native
//     const originalCookieSetter = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie').set;
//     Object.defineProperty(document, 'cookie', {
//       set: function(value) {
//         originalCookieSetter.call(document, value);

//         if (value.includes('auth_token=')) {
//           const match = value.match(/auth_token=([^;]+)/);
//           if (match && match[1] && window.ReactNativeWebView) {
//             window.ReactNativeWebView.postMessage(JSON.stringify({
//               type: 'SAVE_AUTH_TOKEN',
//               token: match[1]
//             }));
//           }
//         }
//       },
//       get: function() {
//         return Object.getOwnPropertyDescriptor(Document.prototype, 'cookie').get.call(document);
//       }
//     });

//     // Add touch feedback and styling
//     const style = document.createElement('style');
//     style.innerHTML = \`
//       * {
//         -webkit-tap-highlight-color: rgba(0,0,0,0);
//         -webkit-touch-callout: none;
//         -webkit-user-select: none;
//         user-select: none;
//       }

//       input, button, select, textarea {
//         -webkit-user-select: text;
//         user-select: text;
//         touch-action: manipulation;
//       }

//       /* Enhanced styling for phone and map links */
//       a[href^="tel:"] {
//         color: #007AFF !important;
//         text-decoration: none !important;
//         padding: 4px 8px;
//         border-radius: 4px;
//         background-color: rgba(0, 122, 255, 0.1);
//         font-weight: 500;
//       }

//       a[href*="maps"], a[href^="geo:"] {
//         color: #34C759 !important;
//         text-decoration: none !important;
//         padding: 4px 8px;
//         border-radius: 4px;
//         background-color: rgba(52, 199, 89, 0.1);
//         font-weight: 500;
//       }

//       /* Touch feedback */
//       a[href^="tel:"]:active,
//       a[href*="maps"]:active,
//       a[href^="geo:"]:active,
//       button:active,
//       .btn:active,
//       [role="button"]:active {
//         transform: scale(0.95);
//         transition: transform 0.1s;
//         opacity: 0.7;
//       }

//       .pwa-install-button,
//       .install-prompt {
//         display: none !important;
//       }
//     \`;
//     document.head.appendChild(style);

//     // Send ready signal
//     setTimeout(() => {
//       if (window.ReactNativeWebView && !window.appReadySent) {
//         window.appReadySent = true;
//         window.ReactNativeWebView.postMessage(JSON.stringify({
//           type: 'APP_READY',
//           timestamp: new Date().toISOString(),
//           userAgent: navigator.userAgent,
//           cookies: document.cookie
//         }));
//       }
//     }, 1000);

//     // Handle orientation changes
//     window.addEventListener('orientationchange', function() {
//       setTimeout(() => {
//         if (window.ReactNativeWebView) {
//           window.ReactNativeWebView.postMessage(JSON.stringify({
//             type: 'ORIENTATION_CHANGED',
//             orientation: screen.orientation?.angle || 0
//           }));
//         }
//       }, 100);
//     });
//   })();
//   true;
// `;

//   const handleMessage = async (event: WebViewMessageEvent): Promise<void> => {
//     try {
//       const data: WebViewMessage = JSON.parse(event.nativeEvent.data);
//       console.log("Message from WebView:", data);

//       switch (data.type) {
//         case "APP_READY":
//           console.log("ERP system loaded successfully");
//           break;

//         case "SAVE_AUTH_TOKEN":
//           if (data.data?.token) {
//             await AsyncStorage.setItem("auth_token", data.data.token);
//             setAuthToken(data.data.token);
//             console.log("Auth token saved to AsyncStorage");
//           }
//           break;

//         case "TOKEN_INJECTED":
//           console.log("Token injection confirmed");
//           break;

//         case "ORIENTATION_CHANGED":
//           console.log("Orientation changed:", data.data);
//           break;

//         case "PRINT_DATA":
//         case "SHARE_DATA":
//         case "DOWNLOAD_DATA":
//         case "THERMAL_PRINT_DATA":
//         case "DOWNLOAD_PDF":
//         case "DOWNLOAD_EXCEL":
//           printHandler.handleMessage(event);
//           break;

//         default:
//           console.log("Unknown message type:", data.type);
//       }
//     } catch (error) {
//       console.warn("Message parsing error:", error);
//     }
//   };

//   return (
//     <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
//       <StatusBar
//         barStyle="dark-content"
//         backgroundColor="#FEFAF1"
//         translucent={false}
//       />
//       <ScrollView
//         style={styles.webview}
//         contentContainerStyle={{ flex: 1 }}
//         scrollEnabled={false}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={handleRefresh}
//             tintColor="#000"
//             title="Refreshing..."
//             titleColor="#000"
//             colors={["#1976D2"]}
//           />
//         }
//       >
//         <WebView
//           ref={webViewRef}
//           source={{ uri: ERP_URL }}
//           style={styles.webview}
//           originWhitelist={[
//             "https://*",
//             "http://*",
//             "tel:*",
//             "geo:*",
//             "maps:*",
//           ]}
//           cacheEnabled={true}
//           cacheMode="LOAD_CACHE_ELSE_NETWORK"
//           javaScriptEnabled={true}
//           domStorageEnabled={true}
//           sharedCookiesEnabled={true}
//           thirdPartyCookiesEnabled={true}
//           incognito={false}
//           allowsInlineMediaPlayback={true}
//           mediaPlaybackRequiresUserAction={false}
//           mixedContentMode="compatibility"
//           startInLoadingState={true}
//           onLoadEnd={handleLoadEnd}
//           onError={handleError}
//           onHttpError={(syntheticEvent) => {
//             const { nativeEvent } = syntheticEvent;
//             console.warn(
//               "HTTP Error:",
//               nativeEvent.statusCode,
//               nativeEvent.description
//             );
//           }}
//           onNavigationStateChange={handleNavigationStateChange}
//           onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
//           injectedJavaScript={injectedJavaScript}
//           onMessage={handleMessage}
//           userAgent="GoldensERP-Mobile/1.0 (Expo) React-Native"
//           allowsBackForwardNavigationGestures={true}
//           pullToRefreshEnabled={true}
//           showsHorizontalScrollIndicator={false}
//           showsVerticalScrollIndicator={false}
//           automaticallyAdjustContentInsets={false}
//           contentInset={{ top: 0, left: 0, bottom: 0, right: 0 }}
//         />
//       </ScrollView>

//       {isLoading && (
//         <View style={styles.loadingOverlay}>
//           <View style={styles.loadingContent}>
//             <ActivityIndicator size="large" color="#000" />
//             <Text style={styles.loadingSubtext}>Connecting to server...</Text>
//           </View>

//           <View style={styles.logoContainer}>
//             <Image
//               source={require("./assets/adaptive-icon.png")}
//               style={styles.companyLogo}
//               resizeMode="contain"
//             />
//             <Text style={styles.companyText}>Golden Signature Trading</Text>
//           </View>
//         </View>
//       )}
//     </SafeAreaView>
//   );
// }

// export default function App(): JSX.Element {
//   return (
//     <SafeAreaProvider>
//       <AppContent />
//     </SafeAreaProvider>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#ffffff",
//   },
//   webview: {
//     flex: 1,
//   },
//   loadingContent: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   loadingOverlay: {
//     position: "absolute",
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: "rgba(255, 255, 255, 0.95)",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 40,
//   },
//   loadingSubtext: {
//     fontSize: 14,
//     color: "#666",
//     marginTop: 10,
//   },
//   logoContainer: {
//     alignItems: "center",
//     paddingBottom: 20,
//   },
//   companyLogo: {
//     width: 50,
//     height: 50,
//     marginBottom: 8,
//   },
//   companyText: {
//     fontSize: 12,
//     color: "#666",
//     fontWeight: "500",
//     textAlign: "center",
//   },
// });

import React, { useRef, useState, useEffect, JSX } from "react";
import {
  StyleSheet,
  StatusBar,
  View,
  Text,
  Alert,
  BackHandler,
  Platform,
  Image,
  ActivityIndicator,
  Linking,
  PanResponder,
  Animated,
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
const ERP_URL = "https://web.goldensignaturetrading.com";
// Development URL
// const ERP_URL = "https://goldensignature-one.vercel.app";

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
  const [isAtTop, setIsAtTop] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const refreshOffset = useRef(new Animated.Value(0)).current;

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

  const REFRESH_ZONE_HEIGHT = 80; // Top 80px is the refresh zone
  const pullStartY = useRef<number>(0);
  const isPulling = useRef<boolean>(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        const touchY = evt.nativeEvent.pageY;
        // Only capture if: at top + in refresh zone + pulling down significantly
        if (isAtTop && touchY <= REFRESH_ZONE_HEIGHT && gestureState.dy > 20) {
          pullStartY.current = touchY;
          isPulling.current = true;
          return true;
        }
        return false;
      },
      onPanResponderMove: (evt, gestureState) => {
        if (!isPulling.current) return;

        // Only allow pull down when pulling positively
        if (gestureState.dy > 0 && gestureState.dy < 150) {
          refreshOffset.setValue(gestureState.dy * 0.4);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (!isPulling.current) {
          return;
        }

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

  const handleNavigationStateChange = (navState: WebViewNavigation): void => {
    setCanGoBack(navState.canGoBack);
  };

  const handleLoadEnd = (): void => {
    setIsLoading(false);
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

    // Inject scroll position tracker
    const scrollTrackerScript = `
      (function() {
        let lastScrollY = 0;
        const checkScrollPosition = () => {
          const scrollY = window.pageYOffset || document.documentElement.scrollTop;
          const isAtTop = scrollY <= 5;
          
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'SCROLL_POSITION',
              isAtTop: isAtTop,
              scrollY: scrollY
            }));
          }
          lastScrollY = scrollY;
        };

        window.addEventListener('scroll', checkScrollPosition, { passive: true });
        checkScrollPosition();
      })();
      true;
    `;

    webViewRef.current?.injectJavaScript(scrollTrackerScript);
  };

  const handleError = (error: any): void => {
    console.error("WebView Error:", error);
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
      html, body {
        overflow-x: hidden !important;
        overflow-y: auto !important;
        -webkit-overflow-scrolling: touch !important;
        height: 100%;
        overscroll-behavior-y: none;
      }

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

      switch (data.type) {
        case "APP_READY":
          console.log("ERP system loaded successfully");
          break;

        case "SCROLL_POSITION":
          setIsAtTop(data.data?.isAtTop || false);
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

      <View style={styles.webviewContainer} {...panResponder.panHandlers}>
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
            injectedJavaScript={injectedJavaScript}
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
  webviewContainer: {
    flex: 1,
    position: "relative",
  },
  webview: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  refreshIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
    flexDirection: "row",
    gap: 10,
  },
  refreshText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 10,
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
