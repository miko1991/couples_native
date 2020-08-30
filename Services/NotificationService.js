import * as Notifications from "expo-notifications";
import * as Permissions from "expo-permissions";
import HttpClient from "../Services/HttpClient";
import config from "../config";

export default class NotificationService {
  static async getPushToken() {
    let statusObj = await Permissions.getAsync(Permissions.NOTIFICATIONS);
    if (statusObj.status !== "granted") {
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  }

  static async handleNotificationHandler(show) {
    Notifications.setNotificationHandler({
      handleNotification: async (data) => {
        if (!show) {
          return Promise.reject();
        }

        return { shouldShowAlert: true };
      },
    });
  }
}
