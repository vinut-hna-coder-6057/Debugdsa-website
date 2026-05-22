
import { motion } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/Authcontext";
import {
GoogleLogin
} from "@react-oauth/google";
import {
useState,
useEffect
} from "react";
import axios from "axios";
function Login() {

  const { login } = useAuth();
  const navigate = useNavigate();
  
useEffect(()=>{

const token = localStorage.getItem("token");

if(token){

navigate("/");

}

},[]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  ////////////////////////////////////////////////////////////
const handleGoogleSuccess = async (
credentialResponse
) => {

try {

const res = await axios.post(

"http://localhost:5000/api/auth/firebase-login",

{
credential:
credentialResponse.credential
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

window.location.href = "/";

} catch (err) {

console.log(err);

alert("Google login failed");

}

};

const handleGoogleResponse = async (
response
) => {

try {

const res = await axios.post(

"http://localhost:5000/api/auth/firebase-login",

{
credential:
response.credential
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

window.location.href = "/";

} catch (err) {

console.log(err);

alert("Google login failed");

}

};

  const handleLogin = async (e) => {

    e.preventDefault();

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    try {

      setLoading(true);
      setError("");

      const user = await login(email, password);

      console.log("Logged in user:", user);

      if (user?.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }

    } catch (err) {

      console.error("Login error:", err);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Login failed. Please try again.";

      setError(message);

    } finally {

      setLoading(false);

    }

  };

  ////////////////////////////////////////////////////////////

  return (

    <div style={container}>

      {/* Background Glow */}
      <motion.div
        style={glow1}
        animate={{
          x: [0, 30, 0],
          y: [0, -30, 0]
        }}
        transition={{
          duration: 8,
          repeat: Infinity
        }}
      />

      <motion.div
        style={glow2}
        animate={{
          x: [0, -20, 0],
          y: [0, 20, 0]
        }}
        transition={{
          duration: 10,
          repeat: Infinity
        }}
      />

      {/* Card */}
      <motion.div
        style={card}
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        whileHover={{
          y: -5,
          boxShadow: "0 0 40px rgba(139,92,246,0.35)"
        }}
      >

        <motion.h2
          style={title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Debug Login
        </motion.h2>

        <p style={subtitle}>
          Welcome back! Login to continue
        </p>

        <form onSubmit={handleLogin}>

          {/* EMAIL */}
          <motion.div
            style={inputWrapper}
            whileFocus={{ scale: 1.02 }}
          >

            <span style={icon}>✉</span>

            <input
              type="email"
              placeholder="Email Address"
              style={input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

          </motion.div>

          {/* PASSWORD */}
          <motion.div
            style={inputWrapper}
            whileFocus={{ scale: 1.02 }}
          >

            <span style={icon}>🔒</span>

            <input
              type="password"
              placeholder="Password"
              style={input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

          </motion.div>

          {/* OPTIONS */}
          <div style={optionsRow}>

            <label style={remember}>
              <input type="checkbox" />
              Remember me
            </label>

            <span style={forgot}>
             <Link to="/forgot-password" style={forgot}>
Forgot Password?
</Link>
            </span>

          </div>

          {/* BUTTON */}
          <motion.button
            type="submit"
            style={button}
            disabled={loading}
            whileHover={{
              scale: 1.03,
              boxShadow: "0 0 25px rgba(139,92,246,0.5)"
            }}
            whileTap={{ scale: 0.97 }}
          >

            {loading ? "Logging in..." : "Login"}

          </motion.button>

{/* GOOGLE LOGIN BUTTON */}


        </form>

        {/* ERROR */}
        {error && (
          <motion.p
            style={errorText}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}

        {/* SIGNUP */}
        <p style={text}>
          New here?
          <Link to="/signup" style={link}>
            Create account
          </Link>
        </p>

      </motion.div>

    </div>

  );
}


export default Login;

////////////////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////////////////

const container = {
  height: "100vh",
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#0b0b11",
  overflow: "hidden",
  position: "relative",
  fontFamily: "Arial, sans-serif"
};

const glow1 = {
  position: "absolute",
  width: "300px",
  height: "300px",
  background: "rgba(139,92,246,0.25)",
  borderRadius: "50%",
  filter: "blur(100px)",
  top: "-100px",
  left: "-100px"
};

const glow2 = {
  position: "absolute",
  width: "250px",
  height: "250px",
  background: "rgba(99,102,241,0.25)",
  borderRadius: "50%",
  filter: "blur(100px)",
  bottom: "-100px",
  right: "-100px"
};

const card = {
  width: "380px",
  maxWidth: "90%",
  padding: "40px",
  borderRadius: "24px",
  background: "rgba(26,26,36,0.92)",
  border: "1px solid rgba(139,92,246,0.25)",
  boxShadow: "0 0 30px rgba(139,92,246,0.15)",
  textAlign: "center",
  position: "relative",
  zIndex: 10
};

const title = {
  fontSize: "34px",
  fontWeight: "700",
  marginBottom: "10px",
  background: "linear-gradient(135deg,#8b5cf6,#6366f1)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent"
};

const subtitle = {
  color: "#9ca3af",
  marginBottom: "28px",
  fontSize: "14px"
};

const inputWrapper = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  background: "#111118",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "14px",
  marginBottom: "18px",
  padding: "0 14px"
};

const icon = {
  color: "#8b5cf6",
  fontSize: "16px",
  marginRight: "10px"
};

const input = {
  width: "100%",
  padding: "15px 0",
  background: "transparent",
  border: "none",
  outline: "none",
  color: "white",
  fontSize: "15px"
};

const optionsRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
  fontSize: "13px",
  color: "#aaa"
};

const remember = {
  display: "flex",
  alignItems: "center",
  gap: "6px"
};

const forgot = {
  color: "#8b5cf6",
  cursor: "pointer"
};

const button = {
  width: "100%",
  padding: "14px",
  borderRadius: "14px",
  border: "none",
  background: "linear-gradient(135deg,#8b5cf6,#6366f1)",
  color: "white",
  fontSize: "15px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "0.3s"
};

const errorText = {
  marginTop: "15px",
  color: "#ff4d4f",
  background: "rgba(255,77,79,0.1)",
  padding: "10px",
  borderRadius: "10px",
  fontSize: "14px"
};

const text = {
  marginTop: "20px",
  color: "#aaa",
  fontSize: "14px"
};

const link = {
  color: "#8b5cf6",
  textDecoration: "none",
  marginLeft: "5px",
  fontWeight: "600"
};