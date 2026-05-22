import { useEffect, useState, useContext } from "react";
import { motion } from "framer-motion";
import { AuthContext } from "../context/Authcontext";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";

function Leaderboard() {

  const { user, loading: authLoading } = useContext(AuthContext);

  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {

    const fetchLeaders = async () => {

      try {

        const res = await axiosInstance.get("/users/leaderboard");
        setLeaders(res.data);

      } catch (err) {

        setError(
          err.response?.data?.error ||
          "Failed to load leaderboard."
        );

      } finally {

        setLoading(false);

      }

    };

    fetchLeaders();

  }, []);

  const getMedal = (index) => {

    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return null;

  };

  /////////////////////////////////////////////////////////
  // OPEN USER PROFILE
  /////////////////////////////////////////////////////////

  const openProfile = (id) => {

   navigate(`/profile/${id}`)

  };

  if (authLoading)
    return <p style={center}>Checking authentication...</p>;

  return (

    <div style={container}>

      <h1 style={heading}>🏆 Leaderboard</h1>

      {loading ? (

        <p style={center}>Loading...</p>

      ) : error ? (

        <p style={errorText}>{error}</p>

      ) : leaders.length === 0 ? (

        <p style={center}>No leaderboard data available.</p>

      ) : (

        <div style={list}>

          {leaders.map((l, i) => (

            <motion.div
              key={l._id || i}
              style={{
                ...card,
                ...(i === 0 ? first : {})
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >

              <div style={rank}>
                {getMedal(i) && `${getMedal(i)} `}#{i + 1}
              </div>

              <div
                style={name}
                onClick={() => openProfile(l._id)}
              >
                {l.name}
              </div>

              <div style={{
                ...score,
                ...(i === 0 ? { color: "white" } : {})
              }}>
                🔥 {l.points} pts
              </div>

            </motion.div>

          ))}

        </div>

      )}

    </div>

  );

}

export default Leaderboard;

///////////////////////////////////////////////////////////
//////////////////// STYLES ///////////////////////////////
///////////////////////////////////////////////////////////

const container = {
  padding: "100px 20px",
  minHeight: "100vh",
  background: "#0f0f12",
  color: "#e2e8f0"
};

const heading = {
  textAlign: "center",
  marginBottom: "40px",
  fontSize: "40px",
  background: "linear-gradient(to right,#c084fc,#8b5cf6)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent"
};

const list = {
  maxWidth: "700px",
  margin: "auto",
  display: "flex",
  flexDirection: "column",
  gap: "20px"
};

const card = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "#16161a",
  padding: "20px",
  borderRadius: "16px",
  border: "1px solid #2d2d39"
};

const first = {
  background: "linear-gradient(90deg,#8b5cf6,#c084fc)",
  color: "white",
  fontWeight: "bold"
};

const rank = {
  fontSize: "18px"
};

const name = {
  fontSize: "18px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "0.2s",
  color: "#c084fc"
};

const score = {
  fontSize: "16px",
  color: "#c084fc"
};

const center = {
  textAlign: "center",
  marginTop: "40px"
};

const errorText = {
  color: "#ff4d4f",
  textAlign: "center"
};