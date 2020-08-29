import React, { useContext } from "react";
import { View, Text } from "react-native";
import AppContext from "../Contexts/AppContext";
import Header from "../Components/Header";

export default function ({ navigation }) {
  const { user } = useContext(AppContext);
  return (
    <>
      <Header navigation={navigation} title="Dashboard" />
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Hello, {user.displayName}</Text>
      </View>
    </>
  );
}
