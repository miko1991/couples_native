import React, { useEffect, useState, useContext } from "react";
import AppContext from "../../../Contexts/AppContext";
import ForumCategories from "../../../Data/ForumCategories";
import HttpClient from "../../../Services/HttpClient";
import { Input, Button } from "react-native-elements";
import { View } from "react-native";
import config from "../../../config";
import Header from "../../../Components/Header";

export default function ({ route, navigation }) {
  const id = route?.params?.id;
  const [category, setCategory] = useState(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState({});
  const { user } = useContext(AppContext);

  useEffect(() => {
    const categoryExists = ForumCategories.find((cat) => cat.key === id);
    if (!categoryExists) {
      return navigation.navigate("Forum");
    } else {
      setCategory(categoryExists);
    }
  }, [id]);

  const onSubmit = async () => {
    setError({});
    const _error = {};
    if (!title.trim()) _error.title = "Titel er påkrævet";
    if (!content.trim()) _error.content = "Indhold er påkrævet";
    if (Object.keys(_error).length) return setError(_error);

    const data = {
      category: category.key,
      title,
      content,
      user: user?._id,
    };

    const response = await (await HttpClient()).post(
      config.SERVER_URL + "/api/forum/create-thread",
      data
    );
    navigation.navigate("Show Thread", {
      id: category.key,
      key: response.data.thread._id,
    });
  };

  return (
    <>
      <Header
        navigation={navigation}
        title="Opret Tråd"
        rightComponent={{
          icon: "arrow-back",
          onPress: () => navigation.goBack(),
          color: "white",
        }}
      />
      <View style={{ padding: 10 }}>
        <Input
          value={title}
          onChangeText={(value) => setTitle(value)}
          label="Titel"
          errorMessage={error.title}
        />

        <Input
          multiline={true}
          value={content}
          onChangeText={(value) => setContent(value)}
          label="Indhold"
          errorMessage={error.content}
        />

        <Button title="Opret Tråd" onPress={onSubmit} />
      </View>
    </>
  );
}
