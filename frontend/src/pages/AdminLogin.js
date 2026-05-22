import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminLogin() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const loginAdmin = async () => {

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    try {

      setLoading(true);

      const res = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
          body: JSON.stringify({ email, password })
        }
      );

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Login failed");
        return;
      }

      // check if admin
      if (data.user.role !== "admin") {
        alert("This account is not an admin");
        return;
      }

      // store admin info
      localStorage.setItem("admin", JSON.stringify(data.user));

      // redirect
      navigate("/admin/dashboard");

    } catch (error) {

      console.error(error);
      alert("Server error. Try again.");

    } finally {

      setLoading(false);

    }
  };

  return (
    <div style={container}>

      <div style={card}>

        <h2 style={title}>Admin Login</h2>

        <input
          style={input}
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          style={input}
          type="password"
          placeholder="Admin Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          style={button}
          onClick={loginAdmin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </div>

    </div>
  );
}

export default AdminLogin;


/* ================= STYLES ================= */

const container = {
  height: "100vh",
  background: "#0f0f12",
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
};

const card = {
  background: "#1a1a22",
  padding: "30px",
  borderRadius: "12px",
  width: "320px",
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
};

const title = {
  textAlign: "center",
  color: "#8b5cf6",
  marginBottom: "10px"
};

const input = {
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #333",
  background: "#0f0f12",
  color: "white"
};

const button = {
  padding: "10px",
  borderRadius: "6px",
  border: "none",
  background: "#8b5cf6",
  color: "white",
  cursor: "pointer"
};