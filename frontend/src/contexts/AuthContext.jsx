import axios from "axios";
import httpStatus from "http-status";
import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import server from "../environment";

// Create the AuthContext
export const AuthContext = createContext({});

// Create an Axios client with the base URL
const client = axios.create({
  baseURL: `${server}/api/v1/users/`, // Added trailing slash here
});

export const AuthProvider = ({ children }) => {
  const authContext = useContext(AuthContext);
  const [userData, setUserData] = useState(authContext);
  const router = useNavigate();

  const handleRegister = async (
    name,
    username,
    password,
    meetingCode,
    meetingPassword
  ) => {
    try {
      const request = await client.post("/register", {
        name,
        username,
        password,
        meeting_code: meetingCode, // Added meeting code
        meeting_password: meetingPassword, // Added meeting password
      });

      if (request.status === httpStatus.CREATED) {
        return request.data.message;
      }
    } catch (err) {
      console.error("Registration error:", err); // Improved error logging
      throw err;
    }
  };

  const handleLogin = async (username, password) => {
    try {
      const request = await client.post("/login", {
        username,
        password,
      });

      console.log(username, password);
      console.log(request.data);

      if (request.status === httpStatus.OK) {
        localStorage.setItem("token", request.data.token);
        router("/home");
      }
    } catch (err) {
      console.error("Login error:", err); // Improved error logging
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
      console.error("Error fetching user history:", err); // Improved error logging
      throw err;
    }
  };

  const addToUserHistory = async (meetingCode) => {
    try {
      const request = await client.post("/add_to_activity", {
        token: localStorage.getItem("token"),
        meeting_code: meetingCode,
      });
      return request;
    } catch (e) {
      console.error("Error adding to user history:", e); // Improved error logging
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
