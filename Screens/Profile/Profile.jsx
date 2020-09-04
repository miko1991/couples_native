import React, { useContext, useEffect, useState } from "react";
import AppContext from "../../Contexts/AppContext";
import HttpClient from "../../Services/HttpClient";
import moment from "moment";
import config from "../../config";
import {
  Text,
  Image,
  View,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Overlay, Input, Button } from "react-native-elements";
import Header from "../../Components/Header";
import uuid from "react-native-uuid";
import { Snackbar } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import { Icon } from "react-native-elements";

const Profile = ({ route, navigation }) => {
  const id = route?.params?.id;
  const { user, setUser, socket, onlineUsers } = useContext(AppContext);
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");
  const [initiated, setInitiated] = useState(false);
  const [match, setMatch] = useState(null);
  const [isMessageOverlayVisible, setMessageOverlayVisible] = useState(false);
  const [isSnackBarVisible, setSnackbarVisible] = useState(false);
  const [snackBarText, setSnackBarText] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [image, setImage] = useState(null);
  const [
    isProfileImageUploadOverlayVisible,
    setProfileImageUploadOverlayVisible,
  ] = useState(false);
  const [isImageUploadOverlayVisible, setImageUploadOverlayVisible] = useState(
    false
  );
  const [isRefreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const actions = [
    {
      icon: <Icon type="font-awesome-5" name="envelope" />,
      onClick: () => setMessageOverlayVisible(true),
    },
    {
      icon: <Icon type="font-awesome-5" name="heart" />,
      onClick: () => giveAction("Kærlighed"),
    },
    {
      icon: <Icon type="ionicon" name="ios-flower" />,
      onClick: () => giveAction("Blomst"),
    },
    {
      icon: <Icon type="font-awesome-5" name="star" />,
      onClick: () => giveAction("Stjerne"),
    },
  ];

  useEffect(() => {
    if (!route) {
      return navigation.navigate("Søg Brugere");
    }
    getUser();
  }, [route]);

  useEffect(() => {
    if (isOwnProfile() && user) {
      setProfile(user);
    }
  }, [user]);

  useEffect(() => {
    let blockHandler;
    let unblockHandler;

    if (profile) {
      blockHandler = (data) => {
        const _profile = { ...profile };
        _profile.blockedUsers.push(data.blockedUserId);
        setProfile(_profile);
      };

      unblockHandler = (data) => {
        const _profile = { ...profile };
        const blockedIndex = _profile.blockedUsers.findIndex(
          (u) => u === data.blockedUserId
        );
        if (blockedIndex >= 0) {
          _profile.blockedUsers.splice(blockedIndex, 1);
          setProfile(_profile);
        }
      };

      socket.on("block-user", blockHandler);
      socket.on("unblock-user", unblockHandler);
    }

    return () => {
      if (profile) {
        socket.off("block-user", blockHandler);
        socket.off("unblock-user", unblockHandler);
      }
    };
  }, [profile]);

  async function uploadProfileImage() {
    let filename = profileImage.split("/").pop();

    // Infer the type of the image
    let match = /\.(\w+)$/.exec(filename);
    let type = match ? `image/${match[1]}` : `image`;

    // Upload the image using the fetch and FormData APIs
    let formData = new FormData();
    // Assume "photo" is the name of the form field the server expects
    formData.append("image", { uri: profileImage, name: filename, type });

    setLoading(true);
    const response = await (await HttpClient()).post(
      config.SERVER_URL + "/api/user/upload-profile-image",
      formData
    );
    setLoading(false);
    setUser({ ...user, profileImagePath: response.data });
    setProfileImageUploadOverlayVisible(false);
  }

  async function uploadImage() {
    let filename = image.split("/").pop();

    // Infer the type of the image
    let match = /\.(\w+)$/.exec(filename);
    let type = match ? `image/${match[1]}` : `image`;

    // Upload the image using the fetch and FormData APIs
    let formData = new FormData();
    // Assume "photo" is the name of the form field the server expects
    formData.append("image", { uri: image, name: filename, type });

    setLoading(true);
    const response = await (await HttpClient()).post(
      config.SERVER_URL + "/api/user/upload-image",
      formData
    );
    setLoading(false);
    const _user = { ...user };
    _user.images.push(response.data.image);
    setUser(_user);
    setImageUploadOverlayVisible(false);
  }

  async function takeProfileImage() {
    // Display the camera to the user and wait for them to take a photo or to cancel
    // the action
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (result.cancelled) {
      return;
    }

    // ImagePicker saves the taken photo to disk and returns a local URI to it
    let localUri = result.uri;
    setProfileImage(localUri);
  }

  async function takeImage() {
    // Display the camera to the user and wait for them to take a photo or to cancel
    // the action
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (result.cancelled) {
      return;
    }

    // ImagePicker saves the taken photo to disk and returns a local URI to it
    let localUri = result.uri;
    setImage(localUri);
  }

  function isUserOnline() {
    if (!route) return false;
    const onlineUser = onlineUsers.find((u) => u.userId === id);
    return !!onlineUser;
  }

  const getUser = async () => {
    if (!route) return;
    try {
      if (!route) return false;
      setRefreshing(true);
      const { data } = await (await HttpClient()).get(
        config.SERVER_URL + "/api/user/get-user-by-id/" + id
      );
      setRefreshing(false);
      setProfile(data.user);
      setMatch(data.match);
      setInitiated(true);

      if (socket && user) {
        const notificationData = {
          url: `/profile/${user._id}`,
          type: "new-visit",
          text: `Nyt besøg fra ${user.displayName}`,
          user: data.user,
          resourceId: user._id,
        };

        socket.emit("notification", notificationData);
      }
    } catch (e) {
      navigation.navigate("Søg Brugere");
    }
  };

  const isOwnProfile = () => {
    if (!route) return false;
    return user && id === user._id;
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    const v4 = uuid.v4();

    const data = {
      fromUserId: user._id,
      toUserId: profile._id,
      text: message,
      uuid: v4,
    };

    showSnackbar("Du har sendt en besked");
    setMessage("");
    setMessageOverlayVisible(false);
    const response = await (await HttpClient()).post(
      config.SERVER_URL + "/api/message/send",
      data
    );

    socket.emit("conversation", {
      userId: profile._id,
      conversation: response.data.message.conversation,
      message: response.data.message,
    });
  };

  async function giveAction(gift) {
    if (!route) return;
    const newGift = {
      type: gift,
      fromUser: user?._id,
      toUser: profile._id,
    };
    showSnackbar(`Du har sendt ${gift}`);
    const response = await (await HttpClient()).post(
      config.SERVER_URL + "/api/user/give-gift",
      {
        gift: newGift,
      }
    );
    if (user) {
      const notification = {
        resourceId: response.data.gift._id,
        url: `/profile/${user._id}`,
        type: "new-gift",
        user: profile,
        text: `Modtaget ${gift} fra ${user?.displayName}`,
      };
      socket.emit("notification", notification);
    }
  }

  function handleChangeProp(key, value) {
    if (user) {
      const _user = { ...user };
      _user[key] = value;
      setUser(_user);
    }
  }

  const chooseCity = (value) => {
    handleChangeProp("city", value);
  };

  async function editGender() {
    setError({});
    if (!user?.gender) return setError({ gender: true });

    await (await HttpClient()).post(
      config.SERVER_URL + "/api/user/edit-gender",
      { gender: user.gender }
    );
    setEditingProp("");
    setProfile(user);
  }

  async function editAge() {
    setError({});
    if (!user?.age) return setError({ age: true });

    await (await HttpClient()).post(config.SERVER_URL + "/api/user/edit-age", {
      age: user.age,
    });
    setEditingProp("");
    setProfile(user);
  }

  async function editCity() {
    setError({});
    if (!user?.city) return setError({ city: true });

    await (await HttpClient()).post(config.SERVER_URL + "/api/user/edit-city", {
      city: user.city,
    });
    config.SERVER_URL + setEditingProp("");
    setProfile(user);
  }

  const isMatch = () => {
    if (!match) return false;
    if (match.userOneMatched && match.userTwoMatched) return true;

    return false;
  };

  async function removeMatch() {
    const data = {
      id: match?._id,
    };

    await (await HttpClient()).post(
      config.SERVER_URL + "/api/user/remove-match",
      data
    );
    setMatch(null);
  }

  const isUserBlocked = () => {
    if (!user) return false;
    return !!profile.blockedUsers.find((u) => u === user._id);
  };

  const isProfileBlocked = () => {
    return !!user?.blockedUsers.find((u) => u === profile._id);
  };

  async function blockProfile() {
    const data = {
      blockedUserId: profile._id,
    };

    const response = await (await HttpClient()).post(
      config.SERVER_URL + "/api/user/block-user",
      data
    );
    setUser(response.data.user);
    socket.emit("block-user", {
      blockedUserId: profile._id,
    });
  }

  async function unblockProfile() {
    const data = {
      blockedUserId: profile._id,
    };

    const response = await (await HttpClient()).post(
      config.SERVER_URL + "/api/user/unblock-user",
      data
    );
    setUser(response.data.user);

    socket.emit("unblock-user", {
      blockedUserId: profile._id,
    });
  }

  function selectImage(filepath) {
    setBigPictureModalOpen(true);
    setBigImage(filepath);
  }

  const isProfileFavorite = () => {
    if (!user) return false;
    return !!user.favoriteUsers.find((u) => u._id === profile._id);
  };

  async function removeFavorite() {
    const data = {
      profileId: profile._id,
    };

    await (await HttpClient()).post(
      config.SERVER_URL + "/api/user/remove-favorite",
      data
    );
    if (user) {
      const _user = { ...user };
      const index = _user.favoriteUsers.findIndex(
        (user) => user._id === profile._id
      );
      _user.favoriteUsers.splice(index, 1);
      setUser(_user);
    }
  }

  async function makeFavorite() {
    const data = {
      profileId: profile._id,
    };

    await (await HttpClient()).post(
      config.SERVER_URL + "/api/user/make-favorite",
      data
    );
    if (user) {
      const _user = { ...user };
      _user.favoriteUsers.push(profile);
      setUser(_user);
    }
  }

  function selectAge(date) {
    console.log(date);
    const formattedDate = moment(date).format("DD-MM-YYYY");
    if (user) {
      const _user = { ...user };
      _user.age = date;
      setUser(_user);
    }
  }

  function getAge() {
    return moment().diff(moment(profile.age), "years");
  }

  const showSnackbar = (text) => {
    setSnackbarVisible(true);
    setSnackBarText(text);
  };

  return (
    profile && (
      <>
        <Header navigation={navigation} title={profile.displayName} />
        {initiated && !isUserBlocked() && (
          <ScrollView
            style={{ flex: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => getUser()}
              />
            }
          >
            <View style={{ padding: 10 }}>
              {!isOwnProfile() && isProfileBlocked() ? (
                <>
                  <Text style={{ fontSize: 40, textAlign: "center" }}>
                    Du har blokeret denne bruger!
                  </Text>
                  <Button
                    title="Fjern blokering"
                    color="red"
                    onPress={() => unblockProfile()}
                  />
                </>
              ) : (
                <>
                  <View style={{ alignItems: "center" }}>
                    <Image
                      style={{ width: 200, height: 200, marginBottom: 10 }}
                      source={
                        profile.profileImagePath
                          ? {
                              uri: config.SERVER_URL + profile.profileImagePath,
                            }
                          : require("../../assets/default_profile_image.jpg")
                      }
                    />
                    {isOwnProfile() && (
                      <View style={{ marginBottom: 10 }}>
                        <Button
                          title="Skift Profilbillede"
                          onPress={() =>
                            setProfileImageUploadOverlayVisible(true)
                          }
                        />
                      </View>
                    )}
                  </View>
                  {isMatch() && !isOwnProfile() && (
                    <Text
                      style={{
                        color: "#1976D2",
                        fontSize: 25,
                        textAlign: "center",
                      }}
                    >
                      Match!
                    </Text>
                  )}
                  {isUserOnline() && (
                    <Text
                      style={{
                        color: "green",
                        marginBottom: 10,
                        textAlign: "center",
                      }}
                    >
                      ONLINE
                    </Text>
                  )}
                  <View style={{ marginBottom: 10, alignItems: "center" }}>
                    <Text style={{ marginBottom: 5 }}>
                      Køn:{" "}
                      {profile.gender
                        ? profile.gender === "female"
                          ? "Kvinde"
                          : "Mand"
                        : ""}
                    </Text>
                    <Text style={{ marginBottom: 5 }}>
                      Alder: {profile.age && getAge()}
                    </Text>
                    <Text style={{ marginBottom: 5 }}>By: {profile.city}</Text>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      marginBottom: 10,
                      justifyContent: "center",
                    }}
                  >
                    {isMatch() && !isOwnProfile() && (
                      <View style={{ marginRight: 5 }}>
                        <Button
                          title="Slet Match"
                          color="red"
                          onPress={() => removeMatch()}
                        />
                      </View>
                    )}
                    {!isOwnProfile() && isProfileFavorite() ? (
                      <View style={{ marginRight: 5 }}>
                        <Button
                          title="Fjern favorit"
                          color="red"
                          onPress={() => removeFavorite()}
                        />
                      </View>
                    ) : (
                      !isOwnProfile() &&
                      !isProfileFavorite() && (
                        <View style={{ marginRight: 5 }}>
                          <Button
                            title="Gør til favorit"
                            color="red"
                            onPress={() => makeFavorite()}
                          />
                        </View>
                      )
                    )}
                    {!isOwnProfile() && (
                      <Button
                        title="Blokér"
                        color="red"
                        onPress={() => blockProfile()}
                      />
                    )}
                  </View>
                  {!isOwnProfile() && (
                    <View style={{ alignItems: "center" }}>
                      <Text style={{ marginBottom: 5 }}>Send Noget</Text>
                      <View style={{ flexDirection: "row" }}>
                        {actions.map((action, index) => (
                          <TouchableOpacity
                            onPress={() => action.onClick()}
                            key={index}
                            style={{
                              padding: 5,
                              borderWidth: 1,
                              marginRight: 10,
                            }}
                          >
                            {action.icon}
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  <View>
                    <Text style={{ fontSize: 25, marginBottom: 10 }}>
                      Galleri
                    </Text>
                    {isOwnProfile() && (
                      <View
                        style={{ marginBottom: 10, alignItems: "flex-start" }}
                      >
                        <Button
                          title="Upload Billede"
                          onPress={() => setImageUploadOverlayVisible(true)}
                        />
                      </View>
                    )}
                    {profile.images.length ? (
                      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                        {profile.images.map((image, index) => (
                          <View
                            style={{
                              borderWidth: 1,
                              padding: 2,
                              marginRight: 5,
                              marginBottom: 5,
                            }}
                            key={index}
                          >
                            <Image
                              source={{
                                uri: config.SERVER_URL + image.filepath,
                              }}
                              style={{ width: 100, height: 100 }}
                            />
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text>Ingen billeder i galleriet</Text>
                    )}
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        )}

        <Overlay
          overlayStyle={{ width: 300, height: 200 }}
          isVisible={isMessageOverlayVisible}
          onBackdropPress={() => setMessageOverlayVisible(false)}
        >
          <View style={{ flex: 1, padding: 10 }}>
            <Text
              style={{ fontSize: 20, textAlign: "center", marginBottom: 20 }}
            >
              Ny Besked
            </Text>
            <Input
              placeholder="Skriv besked her"
              value={message}
              onChangeText={(value) => setMessage(value)}
            />
            <Button title="Send" onPress={() => sendMessage()} />
          </View>
        </Overlay>

        <Overlay
          overlayStyle={{ width: 300, height: 350 }}
          isVisible={isImageUploadOverlayVisible}
          onBackdropPress={() => setImageUploadOverlayVisible(false)}
        >
          <View style={{ alignItems: "center" }}>
            {image && (
              <View style={{ marginBottom: 30 }}>
                <Image
                  source={{ uri: image }}
                  style={{ width: 150, height: 150, marginBottom: 10 }}
                />
                <Button
                  onPress={uploadImage}
                  title="Upload"
                  loading={loading}
                />
              </View>
            )}
            <Button title="Vælg Profilbillede" onPress={takeImage} />
          </View>
        </Overlay>

        <Overlay
          overlayStyle={{ width: 300, height: 350 }}
          isVisible={isProfileImageUploadOverlayVisible}
          onBackdropPress={() => setProfileImageUploadOverlayVisible(false)}
        >
          <View style={{ alignItems: "center" }}>
            {profileImage && (
              <View style={{ marginBottom: 30 }}>
                <Image
                  source={{ uri: profileImage }}
                  style={{ width: 150, height: 150, marginBottom: 10 }}
                />
                <Button
                  onPress={uploadProfileImage}
                  title="Upload"
                  loading={loading}
                />
              </View>
            )}
            <Button title="Vælg Profilbillede" onPress={takeProfileImage} />
          </View>
        </Overlay>

        {initiated && isUserBlocked() && (
          <Text style={{ textAlign: "center", fontSize: 40 }}>
            Du er blokeret
          </Text>
        )}

        <Snackbar
          visible={isSnackBarVisible}
          duration={Snackbar.DURATION_SHORT}
          onDismiss={() => setSnackbarVisible(false)}
          action={{
            label: "OK",
            onPress: () => setSnackbarVisible(false),
          }}
        >
          {snackBarText}
        </Snackbar>
      </>
    )
  );
};

export default Profile;
