import axios from "axios";
import { AsyncStorage } from "react-native";

export default async function () {
  const token = await AsyncStorage.getItem("token");
  const defaultOptions = {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
    },
  };

  return {
    get: (url, options = {}) =>
      axios.get(url, { ...defaultOptions, ...options }),
    post: (url, data, options = {}) =>
      axios.post(url, data, { ...defaultOptions, ...options }),
  };
}
