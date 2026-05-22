import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import axios from "axios";

import { signOut } from "firebase/auth";
import { auth } from "../firebase";

////////////////////////////////////////////////////////////
// AXIOS CONFIG
////////////////////////////////////////////////////////////

axios.defaults.withCredentials = true;

////////////////////////////////////////////////////////////

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);

  const API = "http://localhost:5000/api";

  ////////////////////////////////////////////////////////////
  // LOAD USER
  ////////////////////////////////////////////////////////////

  useEffect(() => {

    const storedUser = localStorage.getItem("user");

    if (storedUser) {

      setUser(JSON.parse(storedUser));

      setLoading(false);

      return;

    }

    const loadUser = async () => {

      try {

        const token = localStorage.getItem("token");

        if (!token) {

          setLoading(false);

          return;

        }

        const res = await axios.get(
          `${API}/users/me`
        );

        setUser(res.data.user);

        localStorage.setItem(
          "user",
          JSON.stringify(res.data.user)
        );

      } catch (err) {

        console.log("User not logged in");

        localStorage.removeItem("token");

        localStorage.removeItem("user");

        setUser(null);

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

      const res = await axios.post(
        `${API}/auth/login`,
        {
          email,
          password
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      localStorage.setItem(
        "token",
        res.data.token
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

      const res = await axios.get(
        `${API}/users/me`
      );

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