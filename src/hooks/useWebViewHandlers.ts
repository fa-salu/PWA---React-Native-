import { useState } from "react";
import { WebViewNavigation, WebViewMessageEvent } from "react-native-webview";
import { Linking, Alert, Platform } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { printHandler } from "../utils/printHandler";

export const useWebViewHandlers = (
  authToken: string | null,
  webViewRef: React.RefObject<any>,
  saveAuthToken: (token: string) => Promise<void>,
  setIsAtTop: (isAtTop: boolean) => void
) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [canGoBack, setCanGoBack] = useState<boolean>(false);

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

  const handleMessage = async (event: WebViewMessageEvent): Promise<void> => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case "APP_READY":
          console.log("ERP system loaded successfully");
          break;
        case "RETRY_CONNECTION":
          console.log("Try Again button clicked from offline page");
          webViewRef.current?.reload();
          break;
        case "SCROLL_POSITION":
          setIsAtTop(data.data?.isAtTop || false);
          break;
        case "SAVE_AUTH_TOKEN":
          if (data.data?.token) {
            await saveAuthToken(data.data.token);
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

  return {
    isLoading,
    canGoBack,
    handleNavigationStateChange,
    handleLoadEnd,
    handleError,
    handleShouldStartLoadWithRequest,
    handleMessage,
  };
};
