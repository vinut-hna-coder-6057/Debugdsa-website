import { useState } from "react";
import {
  useParams,
  useNavigate
} from "react-router-dom";

import axios from "axios";

function ResetPassword() {

  const { token } = useParams();

  const navigate = useNavigate();

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  ////////////////////////////////////////////////////////////
  // RESET PASSWORD
  ////////////////////////////////////////////////////////////

  const submitHandler = async (e) => {

    e.preventDefault();

    setError("");
    setMessage("");

    if (!password || !confirmPassword) {

      setError("Please fill all fields");

      return;

    }

    if (password.length < 6) {

      setError(
        "Password must be at least 6 characters"
      );

      return;

    }

    if (password !== confirmPassword) {

      setError("Passwords do not match");

      return;

    }

    try {

      setLoading(true);

const res = await axios.put(

`http://192.168.0.9:5000/api/auth/reset-password/${token}`,

        { password }

      );

      setMessage(res.data.message);

     setTimeout(() => {

navigate("/login", {
replace: true
});

}, 2500);

    } catch (err) {

      setError(

        err.response?.data?.message ||

        "Reset failed"

      );

    } finally {

      setLoading(false);

    }

  };

  ////////////////////////////////////////////////////////////
  // UI
  ////////////////////////////////////////////////////////////

  return (

    <div style={container}>

      <div style={glow1}></div>

      <div style={glow2}></div>

      <form style={card} onSubmit={submitHandler}>

        <h1 style={heading}>
          Reset Password
        </h1>

        <p style={subheading}>
          Enter your new password
        </p>

        <input
          style={input}
          type="password"
          placeholder="New Password"
          value={password}
          onChange={(e)=>
            setPassword(e.target.value)
          }
        />

        <input
          style={input}
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e)=>
            setConfirmPassword(e.target.value)
          }
        />

        <button
          type="submit"
          style={button}
          disabled={loading}
        >

          {loading
            ? "Resetting..."
            : "Reset Password"}

        </button>

        {message && (

          <p style={successText}>
            {message}
          </p>

        )}

        {error && (

          <p style={errorText}>
            {error}
          </p>

        )}

      </form>

    </div>

  );

}

////////////////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////////////////

const container = {

  height: "100vh",

  display: "flex",

  justifyContent: "center",

  alignItems: "center",

  background: "#0b0b11",

  overflow: "hidden",

  position: "relative"

};

const glow1 = {

  position: "absolute",

  width: "300px",

  height: "300px",

  background: "rgba(139,92,246,0.25)",

  borderRadius: "50%",

  filter: "blur(120px)",

  top: "-100px",

  left: "-100px"

};

const glow2 = {

  position: "absolute",

  width: "250px",

  height: "250px",

  background: "rgba(99,102,241,0.25)",

  borderRadius: "50%",

  filter: "blur(120px)",

  bottom: "-100px",

  right: "-100px"

};

const card = {

  width: "400px",

  maxWidth: "90%",

  background: "rgba(25,25,35,0.95)",

  padding: "40px",

  borderRadius: "24px",

  border: "1px solid rgba(139,92,246,0.25)",

  boxShadow: "0 0 40px rgba(139,92,246,0.18)",

  display: "flex",

  flexDirection: "column",

  gap: "18px",

  zIndex: 2

};

const heading = {

  color: "white",

  textAlign: "center",

  fontSize: "32px",

  marginBottom: "5px"

};

const subheading = {

  color: "#aaa",

  textAlign: "center",

  marginBottom: "15px"

};

const input = {

  padding: "14px",

  borderRadius: "12px",

  border: "1px solid rgba(255,255,255,0.08)",

  background: "#111118",

  color: "white",

  outline: "none",

  fontSize: "15px"

};

const button = {

  padding: "14px",

  borderRadius: "12px",

  border: "none",

  background:
    "linear-gradient(135deg,#8b5cf6,#6366f1)",

  color: "white",

  fontSize: "15px",

  fontWeight: "600",

  cursor: "pointer"

};

const successText = {

  color: "#22c55e",

  textAlign: "center",

  background: "rgba(34,197,94,0.1)",

  padding: "10px",

  borderRadius: "10px"

};

const errorText = {

  color: "#ef4444",

  textAlign: "center",

  background: "rgba(239,68,68,0.1)",

  padding: "10px",

  borderRadius: "10px"

};

export default ResetPassword;