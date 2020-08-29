import React, { useContext, useEffect, useState } from "react";
import HttpClient from "../../Services/HttpClient";
import AppContext from "../../Contexts/AppContext";
import moment from "moment";
import uuid from "react-native-uuid";
import Header from "../../Components/Header";
import {
  View,
  Button,
  TextInput,
  FlatList,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import config from "../../config";

const Chat = ({ navigation }) => {
  const {
    user,
    setUser,
    socket,
    onlineUsers,
    pushToken,
    setActiveConversation,
  } = useContext(AppContext);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [rightPaneActive, setRightPaneActive] = useState(false);
  const [search, setSearch] = useState("");
  const [isRefreshing, setRefreshing] = useState(false);
  const [defaultConversations, setDefaultConversations] = useState([]);

  useEffect(() => {
    const unsubscribeFocus = navigation.addListener("focus", () => {
      getConversations();
    });

    const unsubscribeBlur = navigation.addListener("blur", () => {
      console.log("leaving chat screen");
      setActiveConversation(null);
      setRightPaneActive(false);
      setCurrentConversation(null);
    });

    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, []);

  useEffect(() => {
    if (currentConversation) {
      getMessages(currentConversation, 0);
    }
  }, [currentConversation]);

  useEffect(() => {
    const handler = (message) => {
      const conversationIndex = conversations.findIndex(
        (c) => c._id === message.conversation._id
      );
      if (conversationIndex >= 0) {
        const _conversations = [...conversations];
        message.conversation.latestMessage = message.text;
        _conversations.splice(conversationIndex, 1);
        _conversations.unshift(message.conversation);
        setConversations(_conversations);
        setDefaultConversations(_conversations);
      }
      if (message.conversation._id !== currentConversation._id) return;

      setMessages([{ ...message }, ...messages]);
    };

    if (socket) {
      socket.on("message", handler);
    }

    return () => {
      if (socket) {
        socket.off("message", handler);
      }
    };
  }, [messages, socket]);

  useEffect(() => {
    let blockHandler;
    let unblockHandler;

    blockHandler = (data) => {
      const _conversations = [...defaultConversations];

      _conversations.forEach((conversation, index) => {
        const recipient = getRecipient(conversation);

        if (
          user &&
          user._id === data.blockedUserId &&
          recipient._id === data.fromUserId
        ) {
          recipient.blockedUsers.push(data.blockedUserId);
          if (_conversations[index].userOne._id === recipient._id) {
            _conversations[index].userOne.blockedUsers = recipient.blockedUsers;
          } else {
            _conversations[index].userTwo.blockedUsers = recipient.blockedUsers;
          }
          setConversations(_conversations);
          setDefaultConversations(_conversations);
        }
      });
    };

    unblockHandler = (data) => {
      const _conversations = [...defaultConversations];

      _conversations.forEach((c, index) => {
        const recipient = getRecipient(c);
        if (recipient) {
          const blockedIndex = recipient.blockedUsers.findIndex(
            (u) => u === data.blockedUserId
          );
          if (blockedIndex >= 0) {
            recipient.blockedUsers.splice(blockedIndex, 1);
            if (_conversations[index].userOne._id === recipient._id) {
              _conversations[index].userOne.blockedUsers =
                recipient.blockedUsers;
            } else {
              _conversations[index].userTwo.blockedUsers =
                recipient.blockedUsers;
            }
            setConversations(_conversations);
            setDefaultConversations(_conversations);
          }
        }
      });
    };

    if (socket) {
      socket.on("block-user", blockHandler);
      socket.on("unblock-user", unblockHandler);
    }

    return () => {
      if (socket) {
        socket.off("block-user", blockHandler);
        socket.off("unblock-user", unblockHandler);
      }
    };
  }, [conversations, defaultConversations, socket]);

  function isUserOnline(conversation) {
    const user = getRecipient(conversation);
    const onlineUser = onlineUsers.find((u) => u.userId === user._id);

    return (
      user && onlineUser && user._id.toString() === onlineUser.userId.toString()
    );
  }

  const selectConversation = async (conversation) => {
    if (conversation._id === currentConversation?._id) return;
    if (currentConversation) {
      socket.emit("leave-conversation", currentConversation._id);
    }

    setHasMore(true);
    setMessages([]);
    socket.emit("join-conversation", conversation._id);
    setCurrentConversation(conversation);
    setActiveConversation(conversation);
    setRightPaneActive(true);
  };

  const resetConversation = () => {
    setCurrentConversation(null);
    setRightPaneActive(false);
    setActiveConversation(null);
  };

  const getConversations = async () => {
    const {
      data: { conversations },
    } = await (await HttpClient()).get(
      config.SERVER_URL + "/api/message/get-conversations"
    );
    setConversations(conversations);
    setDefaultConversations(conversations);
  };

  const getRecipient = (conversation) => {
    if (conversation.userOne._id === user._id) {
      return conversation.userTwo;
    }

    return conversation.userOne;
  };

  const getMessages = async (convo, skip) => {
    if (hasMore) {
      setRefreshing(true);
      const response = await (await HttpClient()).get(
        config.SERVER_URL +
          "/api/message/get-messages/" +
          convo._id +
          "?skip=" +
          skip
      );
      setRefreshing(false);
      if (response.data.messages && response.data.messages.length) {
        if (skip === 0) {
          setMessages(response.data.messages);
        } else {
          setMessages([...messages, ...response.data.messages]);
        }
        setHasMore(true);
      } else {
        setHasMore(false);
      }
    }
  };

  const sendMessage = async () => {
    if (!currentConversation) return;
    if (isUserBlocked(getRecipient(currentConversation))) return;
    if (isRecipientBlocked(getRecipient(currentConversation)._id)) return;

    if (!newMessage.trim()) return;

    if (user && currentConversation) {
      const v4 = uuid.v4();
      const message = {
        text: newMessage,
        user,
        uuid: v4,
      };

      socket.emit("message", {
        message: { ...message, conversation: currentConversation },
      });

      socket.emit("conversation", {
        userId: getRecipient(currentConversation)._id,
        message: { ...message, conversation: currentConversation },
      });

      setNewMessage("");

      await (await HttpClient()).post(config.SERVER_URL + "/api/message/send", {
        fromUserId: user._id,
        toUserId: getRecipient(currentConversation)._id,
        ...message,
        conversationId: currentConversation._id,
        pushToken,
      });
    }
  };

  const isOwnMessage = (message) => {
    return message.user._id === user?._id;
  };

  const handleSearch = (value) => {
    setSearch(value);

    if (!value) {
      setConversations(defaultConversations);
    } else {
      const _conversations = [...conversations];
      const matchingConversations = _conversations.filter((c) => {
        const recipient = getRecipient(c);
        const pattern = new RegExp(value, "i");
        return pattern.test(recipient.displayName);
      });
      setConversations(matchingConversations);
    }
  };

  const isRecipientBlocked = (recipientId) => {
    if (!user) return false;
    return !!user.blockedUsers.find((u) => u === recipientId);
  };

  const isUserBlocked = (recipient) => {
    return !!recipient.blockedUsers.find((u) => u === user?._id);
  };

  async function blockUser(userId) {
    const data = {
      blockedUserId: userId,
    };

    const response = await (await HttpClient()).post(
      config.SERVER_URL + "/api/user/block-user",
      data
    );
    setUser(response.data.user);
    socket.emit("block-user", {
      blockedUserId: userId,
      fromUserId: user?._id,
    });
  }

  async function unblockUser(userId) {
    const data = {
      blockedUserId: userId,
    };

    const response = await (await HttpClient()).post(
      config.SERVER_URL + "/api/user/unblock-user",
      data
    );
    setUser(response.data.user);

    socket.emit("unblock-user", {
      blockedUserId: userId,
    });
  }

  function resetSearch() {
    setSearch("");
    setConversations(defaultConversations);
  }

  return (
    <>
      <Header navigation={navigation} title="Chat" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : null}
        style={{ flex: 1 }}
      >
        {!rightPaneActive && (
          <View style={{ padding: 10 }}>
            <TextInput
              placeholder="Søg i samtaler"
              value={search}
              onChangeText={(text) => handleSearch(text)}
              style={{
                borderBottomWidth: 2,
                borderBottomColor: "#ccc",
                marginBottom: 10,
                padding: 10,
              }}
            />
            <FlatList
              data={conversations}
              extraData={onlineUsers}
              renderItem={(conversation) => (
                <TouchableOpacity
                  onPress={() => selectConversation(conversation.item)}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottomWidth: 1,
                    padding: 5,
                    marginBottom: 5,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Image
                      style={{
                        width: 30,
                        height: 30,
                        marginRight: 10,
                        borderRadius: 50,
                      }}
                      source={
                        getRecipient(conversation.item).profileImagePath
                          ? {
                              uri: `${config.SERVER_URL}${
                                getRecipient(conversation.item).profileImagePath
                              }`,
                            }
                          : require("../../assets/default_profile_image.jpg")
                      }
                    />
                    <View>
                      <Text>{getRecipient(conversation.item).displayName}</Text>
                      <Text>{conversation.item.latestMessage}</Text>
                    </View>
                  </View>
                  {isUserOnline(conversation.item) && (
                    <Text style={{ color: "green" }}>ONLINE</Text>
                  )}
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item._id}
            />
            {!conversations.length && <Text>Ingen samtaler</Text>}
          </View>
        )}
        {currentConversation && (
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                padding: 5,
              }}
            >
              <Button onPress={() => resetConversation()} title="Tilbage" />
              <Button
                onPress={() => {}}
                title={getRecipient(currentConversation).displayName}
              />
              {!isUserBlocked(getRecipient(currentConversation)) ? (
                <>
                  {!isRecipientBlocked(
                    getRecipient(currentConversation)._id
                  ) ? (
                    <Button
                      title="Blokér"
                      color="#F44336"
                      onPress={() =>
                        blockUser(getRecipient(currentConversation)._id)
                      }
                    />
                  ) : (
                    <Button
                      title="Fjern Blokering"
                      color="#F44336"
                      onPress={() =>
                        unblockUser(getRecipient(currentConversation)._id)
                      }
                    />
                  )}
                </>
              ) : (
                <Text>Du er blokeret</Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <FlatList
                onEndReached={() =>
                  getMessages(currentConversation, messages.length)
                }
                onEndReachedThreshold={0.8}
                inverted
                data={messages}
                renderItem={(message) => (
                  <View
                    style={{
                      flexDirection: "row",
                      padding: 5,
                      justifyContent: isOwnMessage(message.item)
                        ? "flex-end"
                        : "flex-start",
                    }}
                  >
                    <View
                      style={{
                        padding: 10,
                        backgroundColor: "#2196F3",
                        marginBottom: 5,
                        borderRadius: 5,
                        maxWidth: "50%",
                      }}
                    >
                      <Text style={{ fontWeight: "bold" }}>
                        {message.item.user.displayName}
                      </Text>
                      <Text>{message.item.text}</Text>
                      <Text style={{ fontSize: 10 }}>
                        {moment(message.item.createdAt).fromNow()}
                      </Text>
                    </View>
                  </View>
                )}
                keyExtractor={(item) => item.uuid}
              />
            </View>

            <View style={{ flexDirection: "row", padding: 2 }}>
              <TextInput
                placeholder="Skriv besked"
                value={newMessage}
                onChangeText={(text) => setNewMessage(text)}
                style={{ padding: 10, flex: 1, borderWidth: 1 }}
              />
              <TouchableOpacity
                style={{
                  padding: 10,
                  borderWidth: 1,
                  justifyContent: "center",
                  borderLeftWidth: 0,
                }}
                onPress={sendMessage}
              >
                <Text>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </>
  );
};

export default Chat;
