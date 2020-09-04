import React, { useState, useEffect, useContext } from "react";
import { View, Text, FlatList, Image, TouchableOpacity } from "react-native";
import ForumCategories from "../../../Data/ForumCategories";
import HttpClient from "../../../Services/HttpClient";
import AppContext from "../../../Contexts/AppContext";
import moment from "moment";
import { Button } from "react-native-elements";
import config from "../../../config";
import Header from "../../../Components/Header";
import Icon from "react-native-vector-icons/FontAwesome5";

export default function ({ route, navigation }) {
  const id = route?.params?.id;
  const { user } = useContext(AppContext);
  const [category, setCategory] = useState(null);
  const [threads, setThreads] = useState([]);

  useEffect(() => {
    const categoryExists = ForumCategories.find((cat) => cat.key === id);
    if (!categoryExists) {
      return navigation.navigate("Forum");
    } else {
      setCategory(categoryExists);
    }

    getThreads();
  }, [id]);

  const getThreads = async () => {
    const { data } = await (await HttpClient()).get(
      config.SERVER_URL + "/api/forum/get-threads/" + id
    );
    setThreads(data.threads);
  };

  return (
    <>
      <Header
        navigation={navigation}
        title={category ? category.title : "Vis Forum"}
        rightComponent={{
          icon: "arrow-back",
          onPress: () => navigation.goBack(),
          color: "white",
        }}
      />

      {!!user && (
        <Button
          title="Opret Tråd"
          onPress={() =>
            navigation.navigate(`Create Thread`, { id: category.key })
          }
        />
      )}

      <View style={{ flex: 1, marginTop: 10, padding: 10 }}>
        <FlatList
          data={threads}
          keyExtractor={(item) => item._id}
          renderItem={(thread) => (
            <TouchableOpacity
              style={{
                backgroundColor: "#ccc",
                padding: 5,
                borderRadius: 5,
                marginBottom: 5,
              }}
              onPress={() =>
                navigation.navigate("Show Thread", {
                  id: category.key,
                  key: thread.item._id,
                })
              }
            >
              <View
                style={{
                  flexDirection: "row",
                  marginBottom: 10,
                  alignItems: "center",
                }}
              >
                <Image
                  style={{
                    height: 50,
                    width: 50,
                    borderRadius: 50,
                    marginRight: 10,
                  }}
                  source={
                    thread.item.user.profileImagePath
                      ? {
                          uri:
                            config.SERVER_URL +
                            thread.item.user.profileImagePath,
                        }
                      : require("../../../assets/default_profile_image.jpg")
                  }
                />
                <View>
                  <Text>{thread.item.user.displayName}</Text>
                  <Text style={{ fontSize: 12, color: "white" }}>
                    {moment(thread.item.createdAt).format("DD-MM-YYYY kk:mm")}
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 18 }}>{thread.item.title}</Text>
              <Text>Visninger: {thread.item.threadView.count}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </>
  );
}
