import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  AsyncStorage,
  Button,
  Picker,
  KeyboardAvoidingView,
} from "react-native";
import validator from "validator";
import HttpClient from "../../Services/HttpClient";
import AppContext from "../../Contexts/AppContext";
import moment from "moment";
import config from "../../config";
import DatePicker from "react-native-datepicker";
import { ScrollView } from "react-native-gesture-handler";
import { Input } from "react-native-elements";
import PlacesInput from "react-native-places-input";
import Header from "../../Components/Header";
import { Snackbar } from "react-native-paper";

const Register = ({ navigation }) => {
  const { user, setUser, setSocket } = useContext(AppContext);
  const [newUser, setNewUser] = useState({
    displayName: "",
    chosenDisplayName: null,
    email: "",
    chosenEmail: null,
    password: "",
    passwordAgain: "",
    age: null,
    gender: "male",
    city: "",
  });
  const [error, setError] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [visibleElements, setVisibleElements] = useState([]);
  const [isSnackBarVisible, setSnackbarVisible] = useState(false);
  const [snackBarText, setSnackBarText] = useState("");

  const showSnackbar = (text) => {
    setSnackbarVisible(true);
    setSnackBarText(text);
  };

  const createUser = async () => {
    let _error = {};

    if (!newUser.city) _error.city = "By er påkrævet";
    if (!newUser.displayName.trim())
      _error.displayName = "Displaynavn er påkrævet";
    if (!newUser.email.trim()) _error.email = "Email er påkrævet";
    else if (!validator.isEmail(newUser.email))
      _error.email = "Email skal være i korrekt format";
    if (!newUser.password) _error.password = "Kodeord er påkrævet";
    if (!newUser.passwordAgain)
      _error.passwordAgain = "Kodeord bekræftelse er påkrævet";
    else if (newUser.password !== newUser.passwordAgain)
      _error.passwordAgain = "Kodeord skal være ens";

    if (Object.keys(_error).length) {
      showSnackbar("Der var nogle fejl i din indtastning");
      return setError(_error);
    }

    try {
      const response = await (await HttpClient()).post(
        config.SERVER_URL + "/api/auth/register",
        newUser
      );
      await AsyncStorage.setItem("token", response.data.token);
      setNewUser({
        displayName: "",
        chosenDisplayName: null,
        email: "",
        chosenEmail: null,
        password: "",
        passwordAgain: "",
        age: null,
        gender: "male",
        city: "",
      });
      setVisibleElements([]);
      navigation.navigate("Login");
    } catch (e) {
      setError(e.response.data);
    }
  };

  const chooseCity = (value) => {
    handleAttributeOnChange("city", value);
  };

  function handleAttributeFinished(key) {
    let _error = {};

    switch (key) {
      case "city":
        if (!newUser.city) {
          _error.city = "By er påkrævet";
        }
        break;
    }
    if (Object.keys(_error).length) return setError(_error);

    setVisibleElements([...visibleElements, key]);
  }

  const handleAttributeOnChange = (key, value) => {
    const user = { ...newUser };
    user[key] = value;
    setNewUser(user);
  };

  const checkDisplayNameExists = async () => {
    console.log(newUser.displayName.length);
    if (!newUser.displayName) {
      return;
    } else if (
      newUser.displayName.length < 3 ||
      newUser.displayName.length > 8
    ) {
      return setError({
        ...error,
        displayName: "Displaynavn skal være mellem 3 og 8 tegn",
      });
    }

    setError({ ...error, displayName: undefined });

    const data = {
      displayName: newUser.displayName,
    };

    const response = await (await HttpClient()).post(
      config.SERVER_URL + "/api/user/check-display-name-exists",
      data
    );
    if (response.data.exists) {
      setError({ ...error, displayName: "Dette Displaynavn findes allerede" });
    } else {
      setNewUser({ ...newUser, chosenDisplayName: newUser.displayName });
    }
  };

  const checkEmailExists = async () => {
    if (!newUser.email) {
      return;
    }

    setError({ ...error, email: undefined });

    const data = {
      email: newUser.email,
    };

    const response = await (await HttpClient()).post(
      config.SERVER_URL + "/api/user/check-email-exists",
      data
    );
    if (response.data.exists) {
      setError({ ...error, email: "Denne Email findes allerede" });
    } else {
      setNewUser({ ...newUser, chosenEmail: newUser.email });
    }
  };

  function selectAge(date) {
    setNewUser({ ...newUser, age: date });
  }

  function getAge() {
    if (!newUser.age) return "";
    return moment().diff(moment(newUser.age), "years");
  }

  const checkFieldExists = (key) => {
    return !!newUser[key];
  };

  return (
    <>
      <Header navigation={navigation} title="Register" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : null}
        style={{ flex: 1 }}
      >
        <View style={{ marginBottom: 10, padding: 10 }}>
          {!newUser.city ? (
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
                chooseCity(place.result.name);
              }}
              queryTypes="(cities)"
              queryCountries={["dk"]}
            />
          ) : (
            <View>
              <Text style={{ marginBottom: 10 }}>Valgt By: {newUser.city}</Text>
              <Button
                onPress={() => handleAttributeOnChange("city", "")}
                title="Vælg By Igen"
              />
            </View>
          )}
          {!!newUser.city && visibleElements.length < 1 && (
            <View style={{ marginTop: 10 }}>
              <Button
                disabled={!newUser.city || error.city}
                onPress={() => handleAttributeFinished("city")}
                title="Næste"
              />
            </View>
          )}
        </View>
        <ScrollView style={{ flex: 1, padding: 10, marginBottom: 20 }}>
          {visibleElements.length > 0 && (
            <View style={{ marginBottom: 10 }}>
              <Text style={{ marginBottom: 10 }}>Alder: {getAge()}</Text>
              <DatePicker
                date={newUser.age}
                onDateChange={(date) => selectAge(date)}
                minDate={moment().subtract(100, "years").toDate()}
                maxDate={moment().subtract(18, "years").toDate()}
                confirmBtnText="OK"
                cancelBtnText="Annullér"
              />

              {visibleElements.length < 2 && (
                <View style={{ marginTop: 10 }}>
                  <Button
                    disabled={!newUser.age}
                    onPress={() => handleAttributeFinished("age")}
                    title="Næste"
                  />
                </View>
              )}
            </View>
          )}

          {visibleElements.length > 1 && (
            <View style={{ marginBottom: 20 }}>
              <Picker
                selectedValue={newUser.gender}
                onValueChange={(value) =>
                  handleAttributeOnChange("gender", value)
                }
              >
                <Picker.Item label="Mand" value="male" />
                <Picker.Item label="Kvinde" value="female" />
              </Picker>
              {visibleElements.length < 3 && (
                <View style={{ marginTop: 10 }}>
                  <Button
                    onPress={() => handleAttributeFinished("name")}
                    title="Næste"
                  />
                </View>
              )}
            </View>
          )}

          {visibleElements.length > 2 && (
            <View style={{ marginTop: 10 }}>
              <View style={{ marginBottom: 10 }}>
                {!newUser.chosenDisplayName ? (
                  <Input
                    value={newUser.displayName}
                    onBlur={() => checkDisplayNameExists()}
                    onChangeText={(value) =>
                      handleAttributeOnChange("displayName", value)
                    }
                    label="Displaynavn"
                    errorMessage={error.displayName}
                  />
                ) : (
                  <>
                    <Text style={{ marginBottom: 10 }}>
                      Valgt Display Navn: {newUser.chosenDisplayName}
                    </Text>
                    <Button
                      onPress={() =>
                        setNewUser({
                          ...newUser,
                          chosenDisplayName: null,
                        })
                      }
                      title="Vælg Displaynavn Igen"
                    />
                  </>
                )}
              </View>
              <View style={{ marginBottom: 10 }}>
                {!newUser.chosenEmail ? (
                  <Input
                    value={newUser.email}
                    onBlur={() => checkEmailExists()}
                    onChangeText={(value) =>
                      handleAttributeOnChange("email", value)
                    }
                    label="Email"
                    errorMessage={error.email}
                  />
                ) : (
                  <>
                    <Text style={{ marginBottom: 10 }}>
                      Valgt Email: {newUser.chosenEmail}
                    </Text>
                    <Button
                      title="Vælg Email Igen"
                      onPress={() =>
                        setNewUser({
                          ...newUser,
                          chosenEmail: null,
                        })
                      }
                    />
                  </>
                )}
              </View>

              <View style={{ marginBottom: 10 }}>
                <Input
                  value={newUser.password}
                  leftIcon={
                    checkFieldExists("password")
                      ? { type: "font-awesome-5", name: "check" }
                      : error.password
                      ? { type: "font-awesome-5", name: "times" }
                      : { type: "font-awesome-5", name: "key" }
                  }
                  onBlur={() => {
                    const exists = checkFieldExists("password");
                    if (exists) {
                      setError({ ...error, password: undefined });
                    } else {
                      setError({ ...error, password: "Kodeord er påkrævet" });
                    }
                  }}
                  onChangeText={(value) =>
                    handleAttributeOnChange("password", value)
                  }
                  label="Kodeord"
                  secureTextEntry={true}
                  errorMessage={error.password}
                />
              </View>
              <View style={{ marginBottom: 10 }}>
                <Input
                  value={newUser.passwordAgain}
                  leftIcon={
                    checkFieldExists("passwordAgain")
                      ? { type: "font-awesome-5", name: "check" }
                      : error.passwordAgain
                      ? { type: "font-awesome-5", name: "times" }
                      : { type: "font-awesome-5", name: "key" }
                  }
                  onBlur={() => {
                    const exists = checkFieldExists("passwordAgain");
                    if (exists) {
                      if (newUser.password !== newUser.passwordAgain) {
                        return setError({
                          ...error,
                          passwordAgain: "Kodeordskal være ens",
                        });
                      }
                      setError({ ...error, passwordAgain: undefined });
                    } else {
                      setError({
                        ...error,
                        passwordAgain: "Kodeord bekræftelse er påkrævet",
                      });
                    }
                  }}
                  onChangeText={(value) =>
                    handleAttributeOnChange("passwordAgain", value)
                  }
                  label="Kodeord Igen"
                  secureTextEntry={true}
                  errorMessage={error.passwordAgain}
                />
              </View>
            </View>
          )}
        </ScrollView>
        <Button onPress={() => createUser()} title="Opret Konto" />
      </KeyboardAvoidingView>
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
  );
};

export default Register;
