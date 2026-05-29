import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { resolveResource } from '@tauri-apps/api/path';

const iconCache = new Map<string, string | undefined>();

const resolveIcon = async (name: string): Promise<string | undefined> => {
  if (iconCache.has(name)) return iconCache.get(name);
  try {
    const path = await resolveResource(name);
    iconCache.set(name, path);
    return path;
  } catch {
    iconCache.set(name, undefined);
    return undefined;
  }
};

export const sendNativeNotification = async (title: string, body: string, iconName?: string) => {
  try {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === 'granted';
    }

    if (permissionGranted) {
      const icon = iconName ? await resolveIcon(iconName) : undefined;
      sendNotification({ title, body, icon });
    }
  } catch (error) {
    console.error("Tauri Native Notification failed, falling back to Web", error);

    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, { body });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
          if (permission === "granted") {
            new Notification(title, { body });
          }
        });
      }
    }
  }
};
