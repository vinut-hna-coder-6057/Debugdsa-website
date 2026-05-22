
import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";

function ProfileBugs() {
  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBugs = async () => {
      try {
        const res = await axiosInstance.get("/users/bugs");
        setBugs(res.data);
      } catch (err) {
        console.error("Error fetching bugs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBugs();
  }, []);

  if (loading)
    return (
      <div style={container}>
        <h2 style={heading}>Loading bugs...</h2>
      </div>
    );

  if (bugs.length === 0)
    return (
      <div style={container}>
        <h1 style={heading}>🐞 Bugs Solved</h1>
        <p style={emptyText}>No bugs solved yet.</p>
      </div>
    );

  const handleBugClick = (bugId) => {
    navigate(`/bugs/${bugId}/solution`);
  };

  return (
    <div style={container}>
      <h1 style={heading}>🐞 Bugs Solved</h1>
      <div style={grid}>
        {bugs.map((b) => (
          <div
            key={b._id}
            style={card}
            onClick={() => handleBugClick(b._id)}
          >
            <h3 style={title}>{b.title}</h3>
            <p style={info}>
              <span style={label}>Topic:</span> {b.topic}
            </p>
            <p style={info}>
              <span style={label}>Difficulty:</span> {b.difficulty}
            </p>
            <p style={info}>
              <span style={label}>Points:</span> {b.points}
            </p>
            <p style={info}>
              <span style={label}>Solved At:</span>{" "}
              {new Date(b.solvedAt || b.createdAt).toLocaleString()}
            </p>
            <p style={hint}>Click to view your solution</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const container = {
  padding: "40px",
  minHeight: "100vh",
  background: "#0f0f12",
  color: "#ffffff",
  fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
};

const heading = {
  fontSize: "2rem",
  color: "#8b5cf6", // violet
  marginBottom: "25px",
};

const emptyText = {
  fontSize: "1.2rem",
  color: "#ccc",
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
  gap: "20px",
};

const card = {
  background: "#1a1a1f",
  padding: "20px",
  borderRadius: "12px",
  boxShadow: "0 4px 12px rgba(139,92,246,0.3)",
  transition: "transform 0.2s, box-shadow 0.2s",
  cursor: "pointer",
  color: "#fff",
};

card[":hover"] = {
  transform: "translateY(-5px)",
  boxShadow: "0 8px 20px rgba(139,92,246,0.6)",
};

const title = {
  fontSize: "1.4rem",
  color: "#e0d7ff", // light violet
  marginBottom: "10px",
};

const info = {
  marginBottom: "5px",
  color: "#ccc",
};

const label = {
  fontWeight: "600",
  color: "#8b5cf6",
};

const hint = {
  marginTop: "10px",
  fontStyle: "italic",
  color: "#aaa",
  fontSize: "0.9rem",
};

export default ProfileBugs;