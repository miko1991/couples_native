import { createContext } from "react";

const AppContext = createContext({
  user: null,
  setUser: () => {},
  socket: null,
  setSocket: () => {},
  onlineUsers: [],
  setOnlineUsers: () => {},
  pushToken: null,
  setPushToken: () => {},
  activeConversation: null,
  setActiveConversation: () => {},
});

export default AppContext;
