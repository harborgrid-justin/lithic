/**
 * Device Features for PWA
 * Provides access to device capabilities for healthcare workflows
 *
 * Features:
 * - Camera access for document scanning
 * - Geolocation for facility check-in
 * - Biometric authentication wrapper
 * - Web Share API
 * - File System Access API
 */

// ============================================================================
// Types
// ============================================================================

export interface CameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
}

export interface CapturedImage {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
}

export interface GeolocationPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

export interface ShareData {
  title?: string;
  text?: string;
  url?: string;
  files?: File[];
}

// ============================================================================
// Camera Access
// ============================================================================

/**
 * Check if camera is available
 */
export function isCameraAvailable(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'mediaDevices' in navigator &&
    'getUserMedia' in navigator.mediaDevices
  );
}

/**
 * Request camera permission and access
 */
export async function requestCameraAccess(
  options: CameraOptions = {}
): Promise<MediaStream> {
  if (!isCameraAvailable()) {
    throw new Error('Camera not available on this device');
  }

  try {
    const constraints: MediaStreamConstraints = {
      video: {
        facingMode: options.facingMode || 'environment',
        width: options.width ? { ideal: options.width } : { ideal: 1920 },
        height: options.height ? { ideal: options.height } : { ideal: 1080 },
      },
      audio: false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('[DeviceFeatures] Camera access granted');
    return stream;
  } catch (error) {
    console.error('[DeviceFeatures] Camera access denied:', error);
    throw new Error('Camera access denied');
  }
}

/**
 * Capture image from camera
 */
export async function captureImage(
  options: CameraOptions = {}
): Promise<CapturedImage> {
  const stream = await requestCameraAccess(options);

  try {
    // Create video element
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;

    // Wait for video to be ready
    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });

    // Create canvas to capture frame
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Draw current frame
    ctx.drawImage(video, 0, 0);

    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b);
        else reject(new Error('Failed to create blob'));
      }, 'image/jpeg', 0.9);
    });

    // Get data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    return {
      blob,
      dataUrl,
      width: canvas.width,
      height: canvas.height,
    };
  } finally {
    // Stop camera
    stream.getTracks().forEach((track) => track.stop());
  }
}

/**
 * Stop camera stream
 */
export function stopCameraStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => {
    track.stop();
    console.log('[DeviceFeatures] Camera track stopped');
  });
}

// ============================================================================
// Geolocation
// ============================================================================

/**
 * Check if geolocation is available
 */
export function isGeolocationAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'geolocation' in navigator;
}

/**
 * Get current position
 */
export async function getCurrentPosition(
  options?: PositionOptions
): Promise<GeolocationPosition> {
  if (!isGeolocationAvailable()) {
    throw new Error('Geolocation not available on this device');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        console.error('[DeviceFeatures] Geolocation error:', error);
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        ...options,
      }
    );
  });
}

/**
 * Watch position changes
 */
export function watchPosition(
  callback: (position: GeolocationPosition) => void,
  errorCallback?: (error: Error) => void,
  options?: PositionOptions
): number {
  if (!isGeolocationAvailable()) {
    throw new Error('Geolocation not available on this device');
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined,
        timestamp: position.timestamp,
      });
    },
    (error) => {
      console.error('[DeviceFeatures] Geolocation watch error:', error);
      errorCallback?.(new Error(`Geolocation error: ${error.message}`));
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options,
    }
  );
}

/**
 * Clear position watch
 */
export function clearWatch(watchId: number): void {
  if (isGeolocationAvailable()) {
    navigator.geolocation.clearWatch(watchId);
  }
}

/**
 * Calculate distance between two points (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// ============================================================================
// Biometric Authentication
// ============================================================================

/**
 * Check if biometric authentication is available
 */
export function isBiometricAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    'PublicKeyCredential' in window &&
    'credentials' in navigator
  );
}

/**
 * Register biometric authentication
 */
export async function registerBiometric(userId: string): Promise<BiometricAuthResult> {
  if (!isBiometricAvailable()) {
    return { success: false, error: 'Biometric authentication not available' };
  }

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Lithic Healthcare',
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(userId),
          name: userId,
          displayName: 'User',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 }, // ES256
          { type: 'public-key', alg: -257 }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      },
    } as any);

    if (credential) {
      console.log('[DeviceFeatures] Biometric registered');
      return { success: true };
    }

    return { success: false, error: 'Failed to create credential' };
  } catch (error) {
    console.error('[DeviceFeatures] Biometric registration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    };
  }
}

/**
 * Authenticate with biometrics
 */
export async function authenticateWithBiometric(): Promise<BiometricAuthResult> {
  if (!isBiometricAvailable()) {
    return { success: false, error: 'Biometric authentication not available' };
  }

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'required',
      },
    } as any);

    if (credential) {
      console.log('[DeviceFeatures] Biometric authentication successful');
      return { success: true };
    }

    return { success: false, error: 'Authentication failed' };
  } catch (error) {
    console.error('[DeviceFeatures] Biometric authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

// ============================================================================
// Web Share API
// ============================================================================

/**
 * Check if Web Share API is available
 */
export function isShareAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'share' in navigator;
}

/**
 * Share content using Web Share API
 */
export async function shareContent(data: ShareData): Promise<boolean> {
  if (!isShareAvailable()) {
    console.warn('[DeviceFeatures] Web Share API not available');
    return false;
  }

  try {
    await navigator.share(data as any);
    console.log('[DeviceFeatures] Content shared successfully');
    return true;
  } catch (error) {
    // User cancelled share or share failed
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('[DeviceFeatures] Share error:', error);
    }
    return false;
  }
}

/**
 * Share patient report
 */
export async function sharePatientReport(
  patientName: string,
  reportUrl: string
): Promise<boolean> {
  return shareContent({
    title: `Patient Report - ${patientName}`,
    text: `View patient report for ${patientName}`,
    url: reportUrl,
  });
}

/**
 * Share medical image
 */
export async function shareMedicalImage(file: File, description: string): Promise<boolean> {
  return shareContent({
    title: 'Medical Image',
    text: description,
    files: [file],
  });
}

// ============================================================================
// File System Access API
// ============================================================================

/**
 * Check if File System Access API is available
 */
export function isFileSystemAccessAvailable(): boolean {
  return typeof window !== 'undefined' && 'showOpenFilePicker' in window;
}

/**
 * Pick files from device
 */
export async function pickFiles(
  options?: {
    multiple?: boolean;
    accept?: string[];
  }
): Promise<File[]> {
  if (!isFileSystemAccessAvailable()) {
    // Fallback to input element
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = options?.multiple || false;

      if (options?.accept) {
        input.accept = options.accept.join(',');
      }

      input.onchange = () => {
        if (input.files) {
          resolve(Array.from(input.files));
        } else {
          resolve([]);
        }
      };

      input.oncancel = () => resolve([]);

      input.click();
    });
  }

  try {
    const handles = await (window as any).showOpenFilePicker({
      multiple: options?.multiple || false,
      types: options?.accept
        ? [
            {
              description: 'Files',
              accept: options.accept.reduce((acc, type) => {
                acc[type] = [];
                return acc;
              }, {} as Record<string, string[]>),
            },
          ]
        : undefined,
    });

    const files = await Promise.all(
      handles.map((handle: any) => handle.getFile())
    );

    return files;
  } catch (error) {
    console.error('[DeviceFeatures] File picker error:', error);
    return [];
  }
}

/**
 * Save file to device
 */
export async function saveFile(
  blob: Blob,
  suggestedName: string
): Promise<boolean> {
  if (!isFileSystemAccessAvailable()) {
    // Fallback to download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedName;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  }

  try {
    const handle = await (window as any).showSaveFilePicker({
      suggestedName,
    });

    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();

    console.log('[DeviceFeatures] File saved successfully');
    return true;
  } catch (error) {
    console.error('[DeviceFeatures] Save file error:', error);
    return false;
  }
}

// ============================================================================
// Battery Status API
// ============================================================================

/**
 * Check if Battery Status API is available
 */
export function isBatteryStatusAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'getBattery' in navigator;
}

/**
 * Get battery status
 */
export async function getBatteryStatus(): Promise<{
  level: number;
  charging: boolean;
  chargingTime?: number;
  dischargingTime?: number;
} | null> {
  if (!isBatteryStatusAvailable()) {
    return null;
  }

  try {
    const battery = await (navigator as any).getBattery();
    return {
      level: battery.level,
      charging: battery.charging,
      chargingTime: battery.chargingTime,
      dischargingTime: battery.dischargingTime,
    };
  } catch (error) {
    console.error('[DeviceFeatures] Battery status error:', error);
    return null;
  }
}

// ============================================================================
// Vibration API
// ============================================================================

/**
 * Check if Vibration API is available
 */
export function isVibrationAvailable(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Vibrate device
 */
export function vibrate(pattern: number | number[]): boolean {
  if (!isVibrationAvailable()) {
    return false;
  }

  try {
    navigator.vibrate(pattern);
    return true;
  } catch (error) {
    console.error('[DeviceFeatures] Vibration error:', error);
    return false;
  }
}

/**
 * Vibrate for success feedback
 */
export function vibrateSuccess(): boolean {
  return vibrate([100, 50, 100]);
}

/**
 * Vibrate for error feedback
 */
export function vibrateError(): boolean {
  return vibrate([200]);
}

/**
 * Vibrate for warning feedback
 */
export function vibrateWarning(): boolean {
  return vibrate([100, 100, 100]);
}
