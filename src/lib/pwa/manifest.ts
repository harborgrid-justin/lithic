/**
 * PWA Manifest Configuration for Lithic Healthcare Platform
 * Enables installation on iOS and Android devices
 */

export interface PWAManifestConfig {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: "standalone" | "fullscreen" | "minimal-ui" | "browser";
  orientation: "any" | "portrait" | "landscape";
  theme_color: string;
  background_color: string;
  scope: string;
  icons: PWAIcon[];
  categories: string[];
  screenshots?: PWAScreenshot[];
  shortcuts?: PWAShortcut[];
  related_applications?: PWARelatedApp[];
  prefer_related_applications: boolean;
}

export interface PWAIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: "any" | "maskable" | "monochrome";
}

export interface PWAScreenshot {
  src: string;
  sizes: string;
  type: string;
  label?: string;
}

export interface PWAShortcut {
  name: string;
  short_name?: string;
  description?: string;
  url: string;
  icons?: PWAIcon[];
}

export interface PWARelatedApp {
  platform: "play" | "itunes" | "windows";
  url: string;
  id?: string;
}

/**
 * Generate PWA manifest configuration
 * Can be customized per organization
 */
export function generateManifest(
  organizationName?: string,
  themeColor?: string,
  backgroundColor?: string
): PWAManifestConfig {
  const appName = organizationName
    ? `Lithic - ${organizationName}`
    : "Lithic Healthcare";

  return {
    name: appName,
    short_name: "Lithic",
    description:
      "Enterprise Healthcare Platform - Complete EHR, Practice Management, and Clinical Workflow System",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: themeColor || "#0066cc",
    background_color: backgroundColor || "#ffffff",
    scope: "/",
    icons: [
      {
        src: "/icons/icon-72x72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-96x96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-128x128.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-144x144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-152x152.png",
        sizes: "152x152",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-384x384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["medical", "healthcare", "productivity", "business"],
    screenshots: [
      {
        src: "/screenshots/desktop-dashboard.png",
        sizes: "1280x720",
        type: "image/png",
        label: "Dashboard view showing patient overview and vital statistics",
      },
      {
        src: "/screenshots/mobile-patient-list.png",
        sizes: "750x1334",
        type: "image/png",
        label: "Mobile patient list with quick actions",
      },
    ],
    shortcuts: [
      {
        name: "New Patient",
        short_name: "New Patient",
        description: "Register a new patient",
        url: "/patients/new",
        icons: [
          {
            src: "/icons/shortcut-new-patient.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
      },
      {
        name: "Schedule Appointment",
        short_name: "Schedule",
        description: "Schedule a new appointment",
        url: "/appointments/new",
        icons: [
          {
            src: "/icons/shortcut-schedule.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
      },
      {
        name: "Clinical Notes",
        short_name: "Notes",
        description: "Create clinical notes",
        url: "/clinical/notes/new",
        icons: [
          {
            src: "/icons/shortcut-notes.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
      },
      {
        name: "Lab Orders",
        short_name: "Lab",
        description: "Order laboratory tests",
        url: "/laboratory/orders/new",
        icons: [
          {
            src: "/icons/shortcut-lab.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
      },
    ],
    related_applications: [],
    prefer_related_applications: false,
  };
}

/**
 * Get manifest JSON string
 */
export function getManifestJSON(
  organizationName?: string,
  themeColor?: string,
  backgroundColor?: string
): string {
  const manifest = generateManifest(
    organizationName,
    themeColor,
    backgroundColor
  );
  return JSON.stringify(manifest, null, 2);
}

/**
 * iOS-specific meta tags for PWA
 */
export const iosMetaTags = [
  { name: "apple-mobile-web-app-capable", content: "yes" },
  { name: "apple-mobile-web-app-status-bar-style", content: "default" },
  { name: "apple-mobile-web-app-title", content: "Lithic" },
  { name: "format-detection", content: "telephone=no" },
];

/**
 * iOS splash screen configurations
 */
export const iosSplashScreens = [
  {
    href: "/splash/iphone5_splash.png",
    media:
      "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
    rel: "apple-touch-startup-image",
  },
  {
    href: "/splash/iphone6_splash.png",
    media:
      "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
    rel: "apple-touch-startup-image",
  },
  {
    href: "/splash/iphoneplus_splash.png",
    media:
      "(device-width: 621px) and (device-height: 1104px) and (-webkit-device-pixel-ratio: 3)",
    rel: "apple-touch-startup-image",
  },
  {
    href: "/splash/iphonex_splash.png",
    media:
      "(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)",
    rel: "apple-touch-startup-image",
  },
  {
    href: "/splash/iphonexr_splash.png",
    media:
      "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)",
    rel: "apple-touch-startup-image",
  },
  {
    href: "/splash/iphonexsmax_splash.png",
    media:
      "(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3)",
    rel: "apple-touch-startup-image",
  },
  {
    href: "/splash/ipad_splash.png",
    media:
      "(device-width: 768px) and (device-height: 1024px) and (-webkit-device-pixel-ratio: 2)",
    rel: "apple-touch-startup-image",
  },
  {
    href: "/splash/ipadpro1_splash.png",
    media:
      "(device-width: 834px) and (device-height: 1112px) and (-webkit-device-pixel-ratio: 2)",
    rel: "apple-touch-startup-image",
  },
  {
    href: "/splash/ipadpro3_splash.png",
    media:
      "(device-width: 834px) and (device-height: 1194px) and (-webkit-device-pixel-ratio: 2)",
    rel: "apple-touch-startup-image",
  },
  {
    href: "/splash/ipadpro2_splash.png",
    media:
      "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)",
    rel: "apple-touch-startup-image",
  },
];

/**
 * Get iOS app icon links
 */
export const iosAppIcons = [
  { rel: "apple-touch-icon", href: "/icons/apple-icon-180x180.png" },
  {
    rel: "apple-touch-icon",
    sizes: "57x57",
    href: "/icons/apple-icon-57x57.png",
  },
  {
    rel: "apple-touch-icon",
    sizes: "60x60",
    href: "/icons/apple-icon-60x60.png",
  },
  {
    rel: "apple-touch-icon",
    sizes: "72x72",
    href: "/icons/apple-icon-72x72.png",
  },
  {
    rel: "apple-touch-icon",
    sizes: "76x76",
    href: "/icons/apple-icon-76x76.png",
  },
  {
    rel: "apple-touch-icon",
    sizes: "114x114",
    href: "/icons/apple-icon-114x114.png",
  },
  {
    rel: "apple-touch-icon",
    sizes: "120x120",
    href: "/icons/apple-icon-120x120.png",
  },
  {
    rel: "apple-touch-icon",
    sizes: "144x144",
    href: "/icons/apple-icon-144x144.png",
  },
  {
    rel: "apple-touch-icon",
    sizes: "152x152",
    href: "/icons/apple-icon-152x152.png",
  },
  {
    rel: "apple-touch-icon",
    sizes: "180x180",
    href: "/icons/apple-icon-180x180.png",
  },
];

/**
 * Check if device supports PWA installation
 */
export function isPWAInstallable(): boolean {
  if (typeof window === "undefined") return false;

  // Check for beforeinstallprompt event support
  return "BeforeInstallPromptEvent" in window;
}

/**
 * Check if app is running in standalone mode (installed PWA)
 */
export function isPWAInstalled(): boolean {
  if (typeof window === "undefined") return false;

  // Check if running in standalone mode
  const isStandalone = window.matchMedia(
    "(display-mode: standalone)"
  ).matches;

  // Check iOS standalone
  const isIOSStandalone =
    (window.navigator as any).standalone === true;

  return isStandalone || isIOSStandalone;
}

/**
 * Get device type
 */
export function getDeviceType(): "ios" | "android" | "desktop" | "unknown" {
  if (typeof window === "undefined") return "unknown";

  const userAgent = window.navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(userAgent)) {
    return "ios";
  }

  if (/android/.test(userAgent)) {
    return "android";
  }

  if (
    /windows|macintosh|linux/.test(userAgent) &&
    !/mobile/.test(userAgent)
  ) {
    return "desktop";
  }

  return "unknown";
}

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  const deviceType = getDeviceType();
  return deviceType === "ios" || deviceType === "android";
}
