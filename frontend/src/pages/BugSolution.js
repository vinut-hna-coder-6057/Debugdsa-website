import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";

function BugSolution() {
  const { bugId } = useParams();
  const [solution, setSolution] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSolution = async () => {
      try {
        const res = await axiosInstance.get(`/users/bug/${bugId}/solution`);
        setSolution(res.data);
      } catch (err) {
        console.error("Error fetching solution:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSolution();
  }, [bugId]);

  if (loading)
    return (
      <div style={container}>
        <h2 style={{ color: "#8b5cf6" }}>Loading your solution...</h2>
      </div>
    );

  if (!solution)
    return (
      <div style={container}>
        <h2 style={{ color: "#8b5cf6" }}>No solution found for this bug.</h2>
      </div>
    );

  return (
    <div style={container}>
      <h1 style={heading}>💡 Your Solution</h1>

      <div style={card}>
        <h2 style={subHeading}>Solution Code</h2>
        <pre style={codeBlock}>{solution.fixedCode}</pre>

        <div style={infoRow}>
          <div style={infoItem}>
            <strong>Time Complexity:</strong> {solution.timeComplexity}
          </div>
          <div style={infoItem}>
            <strong>Space Complexity:</strong> {solution.spaceComplexity}
          </div>
        </div>

        <div style={infoRow}>
          <div style={infoItem}>
            <strong>Upvotes:</strong> {solution.upvoteCount}
          </div>
          <div style={infoItem}>
            <strong>Accepted:</strong> {solution.accepted ? "Yes" : "No"}
          </div>
        </div>
      </div>
    </div>
  );
}

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

const subHeading = {
  fontSize: "20px",
  marginBottom: "15px",
  color: "#e0d7f9",
};

const card = {
  background: "#1a1a1f",
  padding: "25px",
  borderRadius: "12px",
  boxShadow: "0 0 15px rgba(139, 92, 246, 0.4)",
};

const codeBlock = {
  background: "#2a2a35",
  padding: "15px",
  borderRadius: "8px",
  overflowX: "auto",
  fontFamily: "'Fira Code', monospace",
  color: "#f5f5f5",
  marginBottom: "20px",
};

const infoRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "10px",
  flexWrap: "wrap",
};

const infoItem = {
  background: "#2a2a35",
  padding: "10px 15px",
  borderRadius: "8px",
  marginBottom: "10px",
  flex: "1 1 45%",
  color: "#d8d8ff",
};

export default BugSolution;