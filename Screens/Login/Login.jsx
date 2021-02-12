import React, { useState, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  AsyncStorage,
  KeyboardAvoidingView,
} from "react-native";
import config from "../../config";
import Header from "../../Components/Header";
import HttpClient from "../../Services/HttpClient";
import AppContext from "../../Contexts/AppContext";
import io from "socket.io-client";
import NotificationService from "../../Services/NotificationService";

const Login = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { setUser, setSocket } = useContext(AppContext);

  const login = async () => {
    const data = {
      email,
      password,
    };
    let response = null;

    try {
      response = await (await HttpClient()).post(
        config.SERVER_URL + "/api/auth/login",
        data
      );
    } catch (e) {
      setError(e.response.data.message);
    }

    if (response) {
      await AsyncStorage.setItem("token", response.data.token);

      const userResponse = await (await HttpClient()).get(
        config.SERVER_URL + "/api/auth/init"
      );
      if (userResponse.data.user) {
        let token;
        if (!userResponse.data.user.pushToken) {
          //token = await NotificationService.getPushToken();
          // const data = {
          //   pushToken: token,
          // };
          // const response = await (await HttpClient()).post(
          //   config.SERVER_URL + "/api/user/set-push-token",
          //   data
          // );
        }
        setUser(userResponse.data.user);
        setSocket(
          io(config.SERVER_URL, {
            transports: ["websocket"],
            upgrade: false,
          })
        );
      }
    }
  };

  return (
    <>
      <Header navigation={navigation} title="Log Ind" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : null}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <Text style={styles.header}>Log Ind</Text>

          {!!error && <Text style={{ color: "red" }}>{error}</Text>}

          <View style={{ marginBottom: 10 }}>
            <Text>Email</Text>
            <TextInput
              value={email}
              onChangeText={(text) => setEmail(text)}
              autoFocus
              style={styles.input}
              autoCapitalize="none"
            />
          </View>
          <View style={{ marginBottom: 10 }}>
            <Text>Kodeord</Text>
            <TextInput
              value={password}
              onChangeText={(text) => setPassword(text)}
              style={styles.input}
              autoCapitalize="none"
              secureTextEntry={true}
            />
          </View>
          <Button title="Log Ind" onPress={() => login()} />
        </View>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 10,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    backgroundColor: "#ccc",
    width: 300,
    height: 40,
    paddingLeft: 5,
  },
});

export default Login;
