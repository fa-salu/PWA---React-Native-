import { Platform } from "react-native";

export const getInjectedJavaScript = (): string => `
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

  // Add Override window.location.reload for offline page "Try Again" button
  const originalReload = window.location.reload;
  window.location.reload = function(forcedReload) {
    console.log('Reload intercepted in React Native WebView');
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'RETRY_CONNECTION'
      }));
    } else {
      originalReload.call(window.location, forcedReload);
    }
  };

  // Enhanced click handling for phone and map links
  document.addEventListener('click', function(e) {
    let target = e.target;
    
    while (target && target.tagName !== 'A') {
      target = target.parentElement;
    }
    
    if (target && target.href) {
      const href = target.href;
      
      if (href.startsWith('tel:')) {
        e.preventDefault();
        window.location.href = href;
        return false;
      }
      
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
