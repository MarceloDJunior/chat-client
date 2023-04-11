export class NotificationHelper {
  public static async requestPermission() {
    if (!this.hasBrowserSupport()) {
      alert('This browser does not support desktop notifications');
    }

    if (this.hasPermission()) {
      return;
    }

    await Notification.requestPermission();
  }

  public static showNotification(
    title: string,
    message: string,
    onClick?: () => void,
  ) {
    if (!this.hasPermission()) {
      return;
    }
    const notification = new Notification(title, { body: message });
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
