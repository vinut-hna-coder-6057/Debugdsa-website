import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/Authcontext";

function OAuthSuccess() {

  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {

    const verifyOAuth = async () => {
  try {

    const res = await axiosInstance.get("/users/me");

    if (res.data.user) {
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setUser(res.data.user);
      navigate("/profile");
    } else {
      navigate("/login");
    }

  } catch (err) {
    navigate("/login");
  }
};

verifyOAuth();

  }, [navigate, setUser]);

  return <p>Signing you in...</p>;
}

export default OAuthSuccess;
