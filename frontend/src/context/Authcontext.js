import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import axiosInstance from "../api/axiosInstance";
import { restoreSessionUser } from "../api/authSession";

////////////////////////////////////////////////////////////

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  ////////////////////////////////////////////////////////////
  // LOAD USER
  ////////////////////////////////////////////////////////////

  useEffect(() => {
    const loadUser = async () => {
      try {
        let cachedUser = null;
        try {
          cachedUser = JSON.parse(localStorage.getItem("user") || "null");
        } catch {
          localStorage.removeItem("user");
        }
        const restoredUser = await restoreSessionUser(cachedUser, axiosInstance, localStorage);
        setUser(restoredUser);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  ////////////////////////////////////////////////////////////
  // LOGIN
  ////////////////////////////////////////////////////////////

  const login = async (email, password) => {

    try {

      const res = await axiosInstance.post(
        "/auth/login",
        {
          email,
          password
        }
      );

      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );

      setUser(res.data.user);

      return res.data.user;

    } catch (error) {

      console.error("Login error:", error);

      throw (
        error?.response?.data?.message ||
        "Login failed"
      );

    }

  };

  ////////////////////////////////////////////////////////////
  // REFRESH USER
  ////////////////////////////////////////////////////////////

  const refreshUser = async () => {

    try {

      const res = await axiosInstance.get("/users/me");

      setUser(res.data.user);

      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );

    } catch (err) {

      console.log(err);

    }

  };

  ////////////////////////////////////////////////////////////
  // LOGOUT
  ////////////////////////////////////////////////////////////

  const logout = async () => {

    try {
      await axiosInstance.post("/auth/logout");
    } catch (err) {
      console.log("Backend session logout could not be confirmed");
    }

    try {

      // Firebase logout
      await signOut(auth);

    } catch (err) {

      console.log("Firebase logout skipped");

    }

    // Clear local auth
    localStorage.removeItem("token");

    localStorage.removeItem("user");

    setUser(null);

    // Redirect
    window.location.href = "/login";

  };

  ////////////////////////////////////////////////////////////

  return (

    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        loading,
        refreshUser
      }}
    >

      {children}

    </AuthContext.Provider>

  );

};

////////////////////////////////////////////////////////////

export const useAuth = () =>
  useContext(AuthContext);
