import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";

// Create the AuthContext
export const AuthContext = createContext({});

// Create an Axios client with the base URL
const client = axios.create({
  baseURL: `${server}/api/v1/users/`, // Ensure this is correct
});

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(null); // Initialize userData to null
  const router = useNavigate();

  // Log the server URL to ensure it's correct
  console.log("Server URL:", server);

  const handleRegister = async (name, username, password) => {
    try {
      const request = await client.post("/register", {
        name,
        username,
        password,
      });

      if (request.status === httpStatus.CREATED) {
        return request.data.message;
      }
    } catch (err) {
      console.error("Registration error:", err);
      throw err;
    }
  };

  const handleLogin = async (username, password) => {
    try {
      const request = await client.post("/login", {
        username,
        password,
      });

      if (request.status === httpStatus.OK) {
        localStorage.setItem("token", request.data.token);
        // Set user data in state if needed
        setUserData(request.data); // You might want to set userData here
        router("/home");
      }
    } catch (err) {
      console.error("Login error:", err);
      throw err;
    }
  };

  const getHistoryOfUser = async () => {
    try {
      const request = await client.get("/get_all_activity", {
        params: {
          token: localStorage.getItem("token"),
        },
      });
      return request.data;
    } catch (err) {
      console.error("Error fetching user history:", err);
      throw err;
    }
  };

 const addToUserHistory = async (meetingCode, password) => {
    try {
        const request = await client.post("/add_to_activity", {
            token: localStorage.getItem("token"), // Ensure the token is included
            meeting_code: meetingCode,
            password: password, // Include password if needed
        });
        return request.data; // Return the response data for further handling
    } catch (e) {
        console.error("Error adding to user history:", e);
        throw e;
    }
};


  const data = {
    userData,
    setUserData,
    addToUserHistory,
    getHistoryOfUser,
    handleRegister,
    handleLogin,
  };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
