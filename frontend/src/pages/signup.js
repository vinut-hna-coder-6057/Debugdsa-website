import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";
import { useAuth } from "../context/Authcontext";

function Signup() {

  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const API = "http://localhost:5000/api";

  //////////////////////////////////////////////////////
  // GOOGLE SIGNUP
  //////////////////////////////////////////////////////

  const handleGoogleSignup = async () => {

    try {

      setGoogleLoading(true);
      setError("");

      const result = await signInWithPopup(auth, provider);

      const token = await result.user.getIdToken();

      const res = await axios.post(
        `${API}/auth/firebase-login`,
        { token },
        { withCredentials: true }
      );

  console.log("Google login success:", res.data);

localStorage.setItem(
  "token",
  res.data.token
);

localStorage.setItem(
  "user",
  JSON.stringify(res.data.user)
);

setUser(res.data.user);

navigate("/", { replace: true });

    } catch (err) {

      console.error("GOOGLE LOGIN ERROR:", err);

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Google signup failed"
      );

    } finally {

      setGoogleLoading(false);

    }

  };

  //////////////////////////////////////////////////////
  // NORMAL SIGNUP
  //////////////////////////////////////////////////////

  const handleSignup = async (e) => {

    e.preventDefault();

    if (!name || !email || !password) {
      setError("Please fill all fields");
      return;
    }

    try {

      setLoading(true);
      setError("");

      await axios.post(
        `${API}/auth/register`,
        { name, email, password },
        { withCredentials: true }
      );

      navigate("/login");

    } catch (err) {

      setError(
        err?.response?.data?.message ||
        "Signup failed"
      );

    } finally {

      setLoading(false);

    }

  };

  return (
    <div style={container}>

      <motion.div
        style={card}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
      >

        <h2 style={heading}>Create Account</h2>

        <motion.button
          style={googleButton}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={googleLoading}
          onClick={handleGoogleSignup}
        >
         <>
<FcGoogle size={22} />

<span style={{marginLeft:"10px"}}>
  {googleLoading ? "Connecting..." : "Continue with Google"}
</span>
</>
        </motion.button>

        <div style={divider}>
          <span>OR</span>
        </div>

        <form
          onSubmit={handleSignup}
          style={{ display: "flex", flexDirection: "column", gap: "15px" }}
        >

          <input
            style={input}
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            style={input}
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            style={input}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <motion.button
            type="submit"
            style={button}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={loading}
          >
            {loading ? "Creating..." : "Signup"}
          </motion.button>

          {error && <p style={errorText}>{error}</p>}

        </form>

        <p style={loginText}>
          Already have account?
          <Link to="/login" style={loginLink}>
            Login
          </Link>
        </p>

      </motion.div>

    </div>
  );
}

export default Signup;

////////////////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////////////////

const container = {
  height: "100vh",
  background: "#0f0f14",
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
};

const card = {
  background: "#1a1a22",
  padding: "35px",
  borderRadius: "14px",
  width: "360px",
  display: "flex",
  flexDirection: "column",
  gap: "15px"
};

const heading = {
  color: "white",
  textAlign: "center"
};

const input = {
  padding: "12px",
  borderRadius: "8px",
  border: "none",
  background: "#2a2a35",
  color: "white"
};

const button = {
  padding: "12px",
  borderRadius: "8px",
  border: "none",
  background: "#7c3aed",
  color: "white"
};

const googleButton = {

padding: "14px",
borderRadius: "10px",
border: "none",
background: "white",
color: "#333",
display:"flex",
justifyContent:"center",
alignItems:"center",
fontWeight:"600",
cursor:"pointer",
boxShadow:"0 0 20px rgba(255,255,255,0.08)"

};

const divider = {
  textAlign: "center",
  color: "#aaa"
};

const errorText = {
  color: "#ff4d4f",
  textAlign: "center"
};

const loginText = {
  color: "#aaa",
  textAlign: "center"
};

const loginLink = {
  color: "#a78bfa",
  textDecoration: "none"
};