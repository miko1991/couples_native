import React, { useContext } from "react";
import {
  View,
  SafeAreaView,
  Button,
  Image,
  Text,
  Platform,
  AsyncStorage,
} from "react-native";
import {
  createDrawerNavigator,
  DrawerItemList,
} from "@react-navigation/drawer";
import Login from "../Screens/Login/Login";
import Dashboard from "../Screens/Dashboard";
import BrowseUsers from "../Screens/BrowseUsers/BrowseUsers";
import AppContext from "../Contexts/AppContext";
import Chat from "../Screens/Chat/Chat";
import config from "../config";
import Match from "../Screens/Match/Match";
import Favorites from "../Screens/Favorites/Favorites";
import Profile from "../Screens/Profile/Profile";
import Register from "../Screens/Register/Register";

const DrawerNavigator = createDrawerNavigator();

export const AppNavigator = () => {
  const { user, setUser } = useContext(AppContext);
  return (
    <DrawerNavigator.Navigator
      drawerContent={(props) => {
        const { state, ...rest } = props;
        const newState = { ...state };

        newState.routes = newState.routes.filter(
          (item) => item.name !== "Profile"
        );

        return (
          <SafeAreaView
            style={{ flex: 1, paddingTop: Platform.OS === "android" ? 50 : 20 }}
          >
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {!user ? (
                <View style={{ marginBottom: 20 }}>
                  <Image
                    source={require("../assets/logo.png")}
                    resizeMode="contain"
                    style={{ width: 75, height: 75 }}
                  />
                  <Text
                    style={{
                      textAlign: "center",
                      fontSize: 25,
                      color: "red",
                    }}
                  >
                    Couples.dk
                  </Text>
                </View>
              ) : (
                <View style={{ marginBottom: 20, alignItems: "center" }}>
                  <Image
                    source={
                      user.profileImagePath
                        ? { uri: config.SERVER_URL + user.profileImagePath }
                        : require("../assets/default_profile_image.jpg")
                    }
                    style={{
                      width: 75,
                      height: 75,
                      borderRadius: 50,
                      marginBottom: 10,
                    }}
                  />
                  <Text style={{ marginBottom: 10 }}>{user.displayName}</Text>
                  <Button
                    title="Se Profil"
                    color="#F44336"
                    onPress={() =>
                      props.navigation.navigate("Profile", { id: user._id })
                    }
                  />
                </View>
              )}
            </View>
            <DrawerItemList state={newState} {...rest} />
            <View style={{ flex: 1, justifyContent: "flex-end" }}>
              <Button
                onPress={async () => {
                  props.navigation.navigate("Søg Brugere");
                  props.navigation.closeDrawer();
                  await AsyncStorage.removeItem("token");
                  setUser(null);
                }}
                title="Log Ud"
                color="#F44336"
              />
            </View>
          </SafeAreaView>
        );
      }}
    >
      <DrawerNavigator.Screen name="Søg Brugere" component={BrowseUsers} />

      {!user && <DrawerNavigator.Screen name="Login" component={Login} />}
      {!user && <DrawerNavigator.Screen name="Register" component={Register} />}

      {user && <DrawerNavigator.Screen name="Match" component={Match} />}
      {user && <DrawerNavigator.Screen name="Chat" component={Chat} />}
      {user && (
        <DrawerNavigator.Screen name="Favoritter" component={Favorites} />
      )}
      {user && <DrawerNavigator.Screen name="Profile" component={Profile} />}
    </DrawerNavigator.Navigator>
  );
};
