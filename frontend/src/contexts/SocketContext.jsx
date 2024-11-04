import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import server from "../environment";

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
const socket = io(server);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("Connected to WebSocket");
    });

    socket.on("message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from WebSocket");
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = (message) => {
    socket.emit("message", message);
  };

  const data = {
    messages,
    sendMessage,
  };

  return (
    <SocketContext.Provider value={data}>{children}</SocketContext.Provider>
  );
};

// Hook to use the socket context
export const useSocket = () => {
  return useContext(SocketContext);
};
