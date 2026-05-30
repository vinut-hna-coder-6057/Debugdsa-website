import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function OAuthSuccess() {

  const navigate = useNavigate();

  useEffect(() => {

    const verifyOAuth = async () => {
  try {

    const res = await axios.get(
      `${process.env.REACT_APP_API}/auth/me`,
      { withCredentials: true }
    );

    if (res.data.user) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }

  } catch (err) {
    navigate("/login");
  }
};

verifyOAuth();

  }, []);

  return <p>Signing you in...</p>;
}

export default OAuthSuccess;
