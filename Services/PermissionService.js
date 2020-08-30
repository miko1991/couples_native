import * as Notifications from "expo-notifications";
import * as Permissions from "expo-permissions";

export default class PermissionService {
  static async getPermissions() {
    let statusObj;
    statusObj = await Permissions.askAsync(
      Permissions.CAMERA,
      Permissions.CAMERA_ROLL,
      Permissions.NOTIFICATIONS
    );
    if (statusObj.status !== "granted") {
      return null;
    }
  }
}
