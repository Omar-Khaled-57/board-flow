import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';

export const sendNativeNotification = async (title: string, body: string) => {
  try {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === 'granted';
    }
    
    if (permissionGranted) {
      sendNotification({ title, body });
    }
  } catch (error) {
    console.error("Tauri Native Notification failed, falling back to Web", error);
    
    // Fallback to web notifications
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
