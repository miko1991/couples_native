import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  SafeAreaView,
  Image,
  ScrollView,
  RefreshControl,
} from "react-native";
import HttpClient from "../../Services/HttpClient";
import AppContext from "../../Contexts/AppContext";
import moment from "moment";
import config from "../../config";
import Header from "../../Components/Header";

const Match = ({ navigation }) => {
  const { user, socket } = useContext(AppContext);
  const [profile, setProfile] = useState(null);
  const [isRefreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getMatch();
  }, []);

  const getMatch = async () => {
    setRefreshing(true);
    const { data } = await (await HttpClient()).get(
      config.SERVER_URL + "/api/user/match"
    );
    setRefreshing(false);
    setProfile(data.profile);
  };

  const makeMatch = async (matched) => {
    const data = {
      profileId: profile?._id,
      matched,
    };

    const response = await (await HttpClient()).post(
      config.SERVER_URL + "/api/user/make-match",
      data
    );
    if (response.data.matched && profile && user) {
      const userOneNotification = {
        url: "/profile/" + profile._id,
        text: `Nyt match med ${profile.displayName}!`,
        type: "new-match",
        user,
        resourceId: response.data.match._id,
      };

      const userTwoNotification = {
        url: "/profile/" + user._id,
        text: `Nyt match med ${user.displayName}!`,
        type: "new-match",
        user: profile,
        resourceId: response.data.match._id,
      };

      socket.emit("notification", userOneNotification);
      socket.emit("notification", userTwoNotification);
    }
    getMatch();
  };

  return (
    <>
      <Header navigation={navigation} title="Match" />
      {profile ? (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => getMatch()}
            />
          }
          contentContainerStyle={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              borderWidth: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: 5,
            }}
          >
            <Text>{profile.displayName}</Text>
            <Text style={{ marginBottom: 10 }}>
              {moment().diff(profile.age, "years")} &middot; {profile.city}
            </Text>
            <Image
              style={{ width: 150, height: 150, marginBottom: 10 }}
              source={
                profile.profileImagePath
                  ? { uri: config.SERVER_URL + profile.profileImagePath }
                  : require("../../assets/default_profile_image.jpg")
              }
            />
            <View
              style={{
                width: 100,
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <Button
                color="green"
                onPress={() => makeMatch(true)}
                title="Ja"
              />
              <Button
                color="red"
                onPress={() => makeMatch(false)}
                title="Nej"
              />
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => getMatch()}
            />
          }
          contentContainerStyle={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "gray" }}>Ikke flere matches</Text>
        </ScrollView>
      )}
    </>
  );
};

export default Match;
