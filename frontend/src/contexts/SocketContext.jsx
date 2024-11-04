import { createContext, useContext, useEffect, useState } from "react";
import io from "socket.io-client";
import server from "../environment";

export const SocketContext = createContext();

const socket = io(`${server}/api/v1/socket`); // Adjust the endpoint as needed

export const SocketProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on("message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off("message");
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
