import React, { useContext, useEffect } from "react";
import AppContext from "../../Contexts/AppContext";
import { View, Text, FlatList, Image } from "react-native";
import Header from "../../Components/Header";
import config from "../../config";

export default function ({ navigation }) {
  const { user } = useContext(AppContext);

  return (
    <>
      <Header navigation={navigation} title="Favoritter" />

      {user.favoriteUsers.length ? (
        <View style={{ flex: 1, padding: 10 }}>
          <FlatList
            data={user.favoriteUsers}
            keyExtractor={(item) => item._id}
            renderItem={(item) => (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 10,
                  borderWidth: 1,
                  padding: 10,
                }}
              >
                <Image
                  style={{ width: 50, height: 50, marginRight: 10 }}
                  source={
                    item.item.profileImagePath
                      ? { uri: config.SERVER_URL + item.item.profileImagePath }
                      : require("../../assets/default_profile_image.jpg")
                  }
                />
                <Text>{item.item.displayName}</Text>
              </View>
            )}
          />
        </View>
      ) : (
        <Text>Ingen favoritter endnu.</Text>
      )}
    </>
  );
}
