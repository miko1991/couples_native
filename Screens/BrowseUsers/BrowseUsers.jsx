import React, { useContext, useState, useEffect } from "react";
import { View, Text, Button, Picker, Image } from "react-native";
import AppContext from "../../Contexts/AppContext";
import Header from "../../Components/Header";
import HttpClient from "../../Services/HttpClient";
import config from "../../config";
import moment from "moment";
import PlacesInput from "react-native-places-input";

export default function ({ navigation }) {
  const { user, onlineUsers } = useContext(AppContext);
  const [users, setUsers] = useState([]);
  const [city, setCity] = useState("");
  const [gender, setGender] = useState(
    user?.gender === "male" ? "female" : "male"
  );
  const [ageFrom, setAgeFrom] = useState(18);
  const [ageTo, setAgeTo] = useState(99);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    search(0);
  }, []);

  const search = async (skip) => {
    let data = {
      gender,
      ageFrom,
      ageTo,
      city,
    };

    const response = await (await HttpClient()).post(
      config.SERVER_URL + "/api/user/search?skip=" + skip,
      data
    );
    if (response.data.users.length) {
      setHasMore(true);
    } else {
      setHasMore(false);
    }

    if (!skip) {
      setUsers(response.data.users);
    } else {
      if (response.data.users.length) {
        setUsers([...users, ...response.data.users]);
      }
    }
  };

  function isUserOnline(_id) {
    const user = users.find((user) => user._id === _id);
    const onlineUser = onlineUsers.find((user) => user.userId === _id);

    return (
      user && onlineUser && user._id.toString() === onlineUser.userId.toString()
    );
  }

  return (
    <>
      <Header navigation={navigation} title="Søg Brugere" />
      <View style={{ marginBottom: 10, padding: 10 }}>
        <View>
          {!city ? (
            <View>
              <Text style={{ marginBottom: 5 }}>By</Text>
              <PlacesInput
                stylesContainer={{
                  position: "relative",
                  alignSelf: "stretch",
                  margin: 0,
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  shadowOpacity: 0,
                  borderColor: "#dedede",
                  borderWidth: 1,
                  marginBottom: 10,
                }}
                googleApiKey={config.GOOGLE_API_KEY}
                placeHolder={"Søg By"}
                language={"da"}
                onSelect={(place) => {
                  setCity(place.result.name);
                }}
                queryTypes="(cities)"
                queryCountries={["dk"]}
              />
            </View>
          ) : (
            <View>
              <Text>Valgt By: {city}</Text>
              <Button onPress={() => setCity(null)} title="Vælg By Igen" />
            </View>
          )}
        </View>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <View style={{ width: "33%" }}>
            <Text>Køn</Text>
            <Picker
              selectedValue={gender}
              onValueChange={(value) => setGender(value)}
            >
              <Picker.Item label="Mand" value="male" />
              <Picker.Item label="Kvinde" value="female" />
            </Picker>
          </View>
          <View style={{ width: "33%" }}>
            <Text>Alder Fra</Text>
            <Picker
              selectedValue={ageFrom}
              onValueChange={(value) => setAgeFrom(value)}
            >
              {(function () {
                const ages = [];
                for (let i = 18; i < 100; i++) {
                  ages.push(i);
                }

                return ages.map((age, index) => (
                  <Picker.Item
                    value={age}
                    label={age.toString()}
                    key={index}
                  ></Picker.Item>
                ));
              })()}
            </Picker>
          </View>
          <View style={{ width: "33%" }}>
            <Text>Alder Til</Text>
            <Picker
              selectedValue={ageTo}
              onValueChange={(value) => setAgeTo(value)}
            >
              {(function () {
                const ages = [];
                for (let i = 18; i < 100; i++) {
                  ages.push(i);
                }

                return ages.map((age, index) => (
                  <Picker.Item
                    value={age}
                    label={age.toString()}
                    key={index}
                  ></Picker.Item>
                ));
              })()}
            </Picker>
          </View>
        </View>
        <View>
          <Button title="Søg" onPress={() => search(0)} />
        </View>
      </View>

      <View style={{ flexDirection: "row", marginBottom: 10, padding: 10 }}>
        {users.map((user, index) => (
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              marginRight: 3,
              position: "relative",
            }}
            key={index}
          >
            {isUserOnline(user._id) && (
              <View
                style={{
                  position: "absolute",
                  top: 2,
                  left: 2,
                  backgroundColor: "green",
                  borderRadius: 50,
                  width: 10,
                  height: 10,
                }}
              ></View>
            )}
            <Text style={{ marginBottom: 5 }}>{user.displayName}</Text>
            <Text style={{ marginBottom: 5, fontSize: 12, color: "#ccc" }}>
              {moment().diff(user.age, "years")} &middot; {user.city}
            </Text>
            <Image
              source={
                user.profileImagePath
                  ? { uri: config.SERVER_URL + user.profileImagePath }
                  : require("../../assets/default_profile_image.jpg")
              }
              style={{ width: 100, height: 100, marginBottom: 5 }}
            />

            <View style={{ marginBottom: 5 }}>
              <Button
                title="Besøg"
                onPress={() => navigation.navigate("Profile", { id: user._id })}
              />
            </View>
          </View>
        ))}
      </View>

      <Button
        disabled={!hasMore}
        onPress={() => search(users.length)}
        title={!hasMore ? "Ikke flere brugere" : "Indlæs Flere Brugere"}
      />
    </>
  );
}
