import * as Notifications from "expo-notifications";
import * as Permissions from "expo-permissions";

export default class PermissionService {
  async getPermissions() {
    let statusObj;
    statusObj = await Permissions.askAsync(
      Permissions.CAMERA,
      Permissions.CAMERA_ROLL
    );
    if (statusObj.status !== "granted") {
      return null;
    }
  }
}
