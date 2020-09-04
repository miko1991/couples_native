import React, { useContext, useEffect } from "react";
import ForumCategories from "../../../Data/ForumCategories";
import { View, Text, TouchableOpacity } from "react-native";
import { Button } from "react-native-elements";
import Header from "../../../Components/Header";

export default function ({ navigation }) {
  return (
    <>
      <Header navigation={navigation} title="Forum" />
      <View style={{ flex: 1, flexWrap: "wrap" }}>
        {ForumCategories.map((category, index) => (
          <View
            key={index}
            style={{
              marginRight: 10,
              marginBottom: 10,
              justifyContent: "center",
              alignItems: "center",
            }}
            className="shadow-md mr-2 mb-2 p-8 rounded flex flex-col justify-center items-center"
          >
            <Text style={{ marginBottom: 10, fontSize: 25 }}>
              {category.title}
            </Text>
            <Button
              title="Besøg"
              onPress={() =>
                navigation.navigate(`Show Category`, { id: category.key })
              }
            >
              Besøg
            </Button>
          </View>
        ))}
      </View>
    </>
  );
}
