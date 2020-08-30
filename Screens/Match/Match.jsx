import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  Button,
  Image,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import HttpClient from "../../Services/HttpClient";
import AppContext from "../../Contexts/AppContext";
import moment from "moment";
import config from "../../config";
import Header from "../../Components/Header";
import { Icon } from "react-native-elements";
import SwipeGesture from "../../Components/SwipeGesture";

const Match = ({ navigation }) => {
  const { user, socket } = useContext(AppContext);
  const [profile, setProfile] = useState(null);
  const [isRefreshing, setRefreshing] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [images, setImages] = useState([]);
  const [matchedProfile, setMatchedProfile] = useState(null);

  useEffect(() => {
    getMatch();
  }, []);

  const onSwipePerformed = (action) => {
    /// action : 'left' for left swipe
    /// action : 'right' for right swipe
    /// action : 'up' for up swipe
    /// action : 'down' for down swipe

    switch (action) {
      case "left": {
        console.log("left swipe performed");
        const previousImageExists = !!images[images.length - 1];
        if (!previousImageExists) {
          console.log("no next image found");
          return;
        }
        setCurrentImage(currentImage + 1);
        break;

        break;
      }
      case "right": {
        console.log("right Swipe performed");
        const nextImageExists = !!images[currentImage - 1];
        if (!nextImageExists) {
          console.log("no previous image found");
          return;
        }
        setCurrentImage(currentImage - 1);
      }
      default: {
        console.log("Undeteceted action");
      }
    }
  };

  const getMatch = async () => {
    setRefreshing(true);
    const { data } = await (await HttpClient()).get(
      config.SERVER_URL + "/api/user/match"
    );
    if (data.profile) {
      setCurrentImage(0);
      setProfile(data.profile);
      if (data.profile.profileImagePath) {
        setImages(() => {
          return [
            data.profile.profileImagePath,
            ...data.profile.images.map((image) => image.filepath),
          ];
        });
      }
    } else {
      setProfile(null);
    }
    setRefreshing(false);
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
      setMatchedProfile(profile);
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
              justifyContent: "center",
              alignItems: "center",
              padding: 5,
            }}
          >
            <SwipeGesture onSwipePerformed={onSwipePerformed}>
              <Image
                style={{ width: 250, height: 250, marginBottom: 10 }}
                source={
                  profile.profileImagePath
                    ? { uri: config.SERVER_URL + images[currentImage] }
                    : require("../../assets/default_profile_image.jpg")
                }
              />
            </SwipeGesture>

            <View style={{ alignItems: "center" }}>
              <Text style={{ fontSize: 40, fontWeight: "normal" }}>
                {profile.displayName}
              </Text>
              <Text style={{ marginBottom: 10 }}>
                {moment().diff(profile.age, "years")} &middot; {profile.city}
              </Text>

              <View
                style={{
                  width: 100,
                  flexDirection: "row",
                  justifyContent: "center",
                }}
              >
                <TouchableOpacity
                  onPress={() => makeMatch(true)}
                  style={{
                    backgroundColor: "green",
                    padding: 20,
                    borderRadius: 50,
                    marginRight: 20,
                    width: 70,
                    height: 70,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View>
                    <Icon type="font-awesome-5" name="check" color="#fff" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => makeMatch(false)}
                  style={{
                    backgroundColor: "red",
                    padding: 20,
                    borderRadius: 50,
                    width: 70,
                    height: 70,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <View>
                    <Icon type="font-awesome-5" name="times" color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>
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
