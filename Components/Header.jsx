import React from "react";
import { Header } from "react-native-elements";

export default function ({ navigation, title }) {
  return (
    <Header
      leftComponent={{
        icon: "menu",
        onPress: () => navigation.toggleDrawer(),
        color: "white",
      }}
      centerComponent={{ text: title, style: { color: "white" } }}
      containerStyle={{ backgroundColor: "red" }}
    ></Header>
  );
}
