import React, { useEffect, useState, useContext } from "react";
import AppContext from "../../../Contexts/AppContext";
import ForumCategories from "../../../Data/ForumCategories";
import HttpClient from "../../../Services/HttpClient";
import moment from "moment";
import config from "../../../config";
import {
  View,
  Text,
  Image,
  FlatList,
  KeyboardAvoidingView,
} from "react-native";
import { Input, Overlay } from "react-native-elements";
import { Button } from "react-native-elements";
import Header from "../../../Components/Header";

export default function ({ route, navigation }) {
  const id = route?.params?.id;
  const key = route?.params?.key;
  const [category, setCategory] = useState(null);
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [countPosts, setCountPosts] = useState(0);
  const [createPostOverlayVisible, setCreatePostOverlayVisible] = useState(
    false
  );
  const [newPost, setNewPost] = useState("");
  const { user } = useContext(AppContext);

  useEffect(() => {
    const categoryExists = ForumCategories.find((cat) => cat.key === id);
    if (!categoryExists) {
      return navigation.navigate("Forum");
    } else {
      setCategory(categoryExists);
    }

    getThread(0);
  }, [id, key]);

  const getThread = async (skip) => {
    const { data } = await (await HttpClient()).get(
      config.SERVER_URL + "/api/forum/get-thread-by-id/" + key
    );
    setThread(data.thread);

    await getPosts(skip);
  };

  const createPost = async () => {
    if (!newPost.trim()) return;

    const data = {
      content: newPost,
      threadId: thread?._id,
      user: user?._id,
    };

    await (await HttpClient()).post(
      config.SERVER_URL + "/api/forum/create-post",
      data
    );
    const lastPage = Math.ceil((countPosts + 1) / 10);
    await getPosts((lastPage - 1) * 10);
    setNewPost("");
    setCreatePostOverlayVisible(false);
  };

  const getPosts = async (skip) => {
    const response = await (await HttpClient()).get(
      config.SERVER_URL + "/api/forum/get-posts/" + key + "?skip=" + skip
    );
    if (skip === 0) {
      setPosts(response.data.posts);
    } else {
      setPosts([...posts, ...response.data.posts]);
    }
    setCountPosts(response.data.count);
  };

  return (
    <>
      <Header
        navigation={navigation}
        title={category ? category.title : "Vis Forum"}
        rightComponent={{
          icon: "arrow-back",
          onPress: () =>
            navigation.navigate("Show Category", { id: category.key }),
          color: "white",
        }}
      />
      {category && !!thread && (
        <View style={{ padding: 5, flex: 1 }}>
          <View
            style={{
              backgroundColor: "#ccc",
              flexDirection: "row",
              padding: 10,
              marginBottom: 5,
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
                thread.user.profileImagePath
                  ? {
                      uri: config.SERVER_URL + thread.user.profileImagePath,
                    }
                  : require("../../../assets/default_profile_image.jpg")
              }
            />
            <View style={{ padding: 10, flex: 1 }}>
              <Text style={{ fontSize: 20 }}>{thread.title}</Text>
              <View
                style={{
                  whiteSpace: "pre-line",
                  marginTop: 10,
                  marginBottom: 10,
                  borderRadius: 5,
                }}
              >
                <Text>{thread.content}</Text>
              </View>
              <Text style={{ fontSize: 12, color: "white" }}>
                {thread.user.displayName} &middot;{" "}
                {moment(thread.createdAt).format("DD-MM-YYYY kk:mm")}
              </Text>
            </View>
          </View>

          <Button
            title="Svar"
            onPress={() => setCreatePostOverlayVisible(true)}
          />

          <FlatList
            style={{ marginTop: 5 }}
            data={posts}
            keyExtractor={(item) => item._id}
            onEndReached={() => getPosts(posts.length)}
            renderItem={(post) => (
              <View
                style={{
                  padding: 10,
                  backgroundColor: "#ccc",
                  marginBottom: 5,
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
                    post.item.user.profileImagePath
                      ? {
                          uri:
                            config.SERVER_URL + post.item.user.profileImagePath,
                        }
                      : require("../../../assets/default_profile_image.jpg")
                  }
                />
                <View style={{ padding: 10, flex: 1 }}>
                  <View
                    style={{
                      whiteSpace: "pre-line",
                      borderRadius: 5,
                      marginBottom: 10,
                    }}
                  >
                    <Text>{post.item.content}</Text>
                  </View>
                  <Text style={{ fontSize: 12, color: "white" }}>
                    {post.item.user.displayName} &middot;{" "}
                    {moment(post.item.createdAt).format("DD-MM-YYYY kk:mm")}
                  </Text>
                </View>
              </View>
            )}
          />
        </View>
      )}

      <Overlay
        isVisible={createPostOverlayVisible}
        onBackdropPress={() => setCreatePostOverlayVisible(false)}
        overlayStyle={{ width: "80%", height: "auto" }}
      >
        <KeyboardAvoidingView
          style={{ padding: 10 }}
          behavior={Platform.OS === "ios" ? "padding" : null}
        >
          <Text style={{ fontSize: 20, marginBottom: 10 }}>Skriv et svar</Text>
          <Input
            multiline={true}
            value={newPost}
            onChangeText={(value) => setNewPost(value)}
            label="Indhold"
            error={""}
          />
          <Button title="Gem Svar" onPress={createPost} />
        </KeyboardAvoidingView>
      </Overlay>
    </>
  );
}
