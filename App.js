import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { AppNavigator } from "./Navigators/AppNavigator";
import AppContext from "./Contexts/AppContext";
import HttpClient from "./Services/HttpClient";
import config from "./config";
import io from "socket.io-client";
import NotificationService from "./Services/NotificationService";
import PermissionService from "./Services/PermissionService";

export default function App() {
  const [user, setUser] = useState(null);
  const [initiated, setInitiated] = useState(false);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [pushToken, setPushToken] = useState(null);
  const [activeConversation, setActiveConversation] = useState(null);

  useEffect(() => {
    PermissionService.getPermissions();
    init();
  }, []);

  useEffect(() => {
    let handler;

    if (socket) {
      handler = async (data) => {
        let showPushNotification = false;

        if (
          !activeConversation ||
          data.conversation._id !== activeConversation._id
        ) {
          if (!user) return;
          showPushNotification = true;

          const notificationData = {
            url: "/chat?conversationId=" + data.conversation._id,
            type: "new-message",
            text: `Ny besked fra ${data.message.user.displayName}`,
            user,
            resourceId: data.conversation._id,
          };

          socket.emit("notification", notificationData);
        }

        NotificationService.handleNotificationHandler(showPushNotification);
      };

      socket.on("conversation", handler);
    }

    return () => {
      if (socket) {
        socket.off("conversation", handler);
      }

      NotificationService.handleNotificationHandler(true);
    };
  }, [socket, activeConversation]);

  useEffect(() => {
    let handler = (data) => {
      setOnlineUsers(data);
    };

    if (user && socket) {
      socket.emit("join-online-users", { userId: user._id });
      socket.on("online-users-data", handler);
    }

    return () => {
      if (socket) {
        socket.emit("leave-online-users");
        socket.off("online-users-data", handler);
      }
    };
  }, [user, socket, setUser]);

  useEffect(() => {
    let intervalId;
    let intervalHandler = () => {
      socket.emit("refresh-online-user");
    };
    if (socket && user) {
      socket.emit("join-user", user._id);

      intervalId = setInterval(intervalHandler, 1000 * 10);
    }

    return () => {
      if (socket && user) {
        clearInterval(intervalId);
      }
    };
  }, [socket, user]);

  const init = async () => {
    try {
      console.log(config.SERVER_URL);
      const { data } = await (await HttpClient()).get(
        config.SERVER_URL + "/api/auth/init"
      );

      if (data.user) {
        setUser(data.user);
        setSocket(
          io(config.SERVER_URL, {
            transports: ["websocket"],
            upgrade: false,
          })
        );
      }
      setInitiated(true);
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        socket,
        setSocket,
        onlineUsers,
        setOnlineUsers,
        pushToken,
        setPushToken,
        activeConversation,
        setActiveConversation,
      }}
    >
      {initiated && (
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      )}
    </AppContext.Provider>
  );
}
