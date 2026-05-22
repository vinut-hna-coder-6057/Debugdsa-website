import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

function ProfilePoints() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPoints = async () => {
      try {
        const res = await axiosInstance.get("/users/points");
        setPoints(res.data);
      } catch (err) {
        console.error("Error fetching points:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPoints();
  }, []);

  if (loading)
    return (
      <div style={container}>
        <h2 style={{ color: "#8b5cf6" }}>Loading points history...</h2>
      </div>
    );

  if (points.length === 0)
    return (
      <div style={container}>
        <h2 style={{ color: "#8b5cf6" }}>No points recorded yet.</h2>
      </div>
    );

  return (
    <div style={container}>
      <h1 style={heading}>🎯 Points History</h1>

      {points.map((p, i) => (
        <div key={i} style={card}>
          <h3 style={bugTitle}>{p.bugTitle}</h3>
          <p style={info}><strong>Topic:</strong> {p.topic}</p>
          <p style={info}><strong>Difficulty:</strong> {p.difficulty || "N/A"}</p>
          <p style={pointsStyle}><strong>Points:</strong> {p.points}</p>
          <p style={dateStyle}>
            <strong>Earned At:</strong> {new Date(p.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ================================
   STYLES
================================= */

const container = {
  padding: "40px",
  minHeight: "100vh",
  background: "#0f0f12",
  color: "white",
  fontFamily: "Arial, sans-serif",
};

const heading = {
  fontSize: "32px",
  marginBottom: "25px",
  color: "#8b5cf6",
};

const card = {
  background: "#1a1a1f",
  padding: "20px",
  borderRadius: "12px",
  marginBottom: "20px",
  boxShadow: "0 0 15px rgba(139, 92, 246, 0.4)",
};

const bugTitle = {
  fontSize: "20px",
  marginBottom: "10px",
  color: "#d8b4fe",
};

const info = {
  marginBottom: "5px",
  color: "#e0d7f9",
};

const pointsStyle = {
  fontWeight: "bold",
  color: "#f0abfc",
  marginBottom: "5px",
};

const dateStyle = {
  fontSize: "12px",
  color: "#c4b5fd",
};

export default ProfilePoints;