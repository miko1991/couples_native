import * as Notifications from "expo-notifications";
import * as Permissions from "expo-permissions";
import HttpClient from "../Services/HttpClient";
import config from "../config";

export default class NotificationService {
  async getPermissions(setUser) {
    let statusObj = await Permissions.getAsync(Permissions.NOTIFICATIONS);
    if (statusObj.status !== "granted") {
      statusObj = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    }
    if (statusObj.status !== "granted") {
      return null;
    } else {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      await (await HttpClient()).post(
        config.SERVER_URL + "/api/user/set-push-token",
        { pushToken: token }
      );
      setUser((prevState) => {
        return { ...prevState, pushToken: token };
      });
    }
  }

  async handleNotificationHandler(show) {
    console.log(show);
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
