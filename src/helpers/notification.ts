type Notification = {
  title: string;
  message: string;
  icon?: string;
  onClick?: () => void;
};

export class NotificationHelper {
  public static async requestPermission() {
    if (!this.hasBrowserSupport()) {
      return;
    }

    if (this.hasPermission()) {
      return;
    }

    await Notification.requestPermission();
  }

  public static showNotification({
    title,
    message,
    icon,
    onClick,
  }: Notification) {
    if (!this.hasPermission()) {
      return;
    }
    const notification = new Notification(title, { body: message, icon });
    if (onClick) {
      notification.onclick = onClick;
    }
  }

  private static hasPermission(): boolean {
    if (!this.hasBrowserSupport()) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    return false;
  }

  private static hasBrowserSupport(): boolean {
    if ('Notification' in window) {
      return true;
    }
    return false;
  }
}
