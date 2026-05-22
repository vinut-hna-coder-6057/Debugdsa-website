import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/Authcontext";
import axiosInstance from "../api/axiosInstance";

const AllSubmissions = () => {
  const { user, loading: authLoading } = useContext(AuthContext);

  const [bugs, setBugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchBugs = async () => {
      try {
        const res = await axiosInstance.get("/bugs");
        setBugs(res.data);
      } catch (err) {
        setError(
          err.response?.data?.error ||
          "Failed to fetch submissions."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBugs();
  }, [user]);

  if (authLoading) return <p style={center}>Checking authentication...</p>;
  if (!user) return <p style={center}>Please login to view submissions.</p>;

  return (
    <div style={container}>
      <h2 style={heading}>All Bug Submissions</h2>

      {loading ? (
        <p style={center}>Loading...</p>
      ) : error ? (
        <p style={errorText}>{error}</p>
      ) : bugs.length === 0 ? (
        <p style={center}>No bugs found</p>
      ) : (
        bugs.map((bug) => (
          <div key={bug._id} style={card}>
            <h3 style={title}>{bug.title}</h3>

            <div style={meta}>
              <span><strong>Language:</strong> {bug.language}</span>
              <span><strong>Topic:</strong> {bug.topic}</span>
            </div>

            <p><strong>Description:</strong> {bug.description}</p>
            <p><strong>Error:</strong> {bug.error}</p>
            <p><strong>Expected Output:</strong> {bug.expectedOutput}</p>

            <p style={postedBy}>
              <strong>Posted By:</strong>{" "}
              {bug.postedBy?.name || "Unknown User"}
            </p>

            <pre style={codeBlock}>
              {bug.code}
            </pre>
          </div>
        ))
      )}
    </div>
  );
};

export default AllSubmissions;

/* ================= STYLES ================= */

const container = {
  padding: "40px",
  background: "#0f0f14",
  minHeight: "100vh",
  color: "white"
};

const heading = {
  marginBottom: "30px",
  textAlign: "center"
};

const card = {
  background: "#1a1a22",
  padding: "20px",
  marginBottom: "20px",
  borderRadius: "12px",
  boxShadow: "0 0 20px rgba(124,58,237,0.15)"
};

const title = {
  color: "#a78bfa"
};

const meta = {
  display: "flex",
  gap: "20px",
  marginBottom: "10px",
  fontSize: "14px",
  color: "#bbb"
};

const postedBy = {
  marginTop: "10px",
  fontSize: "14px",
  color: "#aaa"
};

const codeBlock = {
  background: "#111",
  color: "#0f0",
  padding: "15px",
  borderRadius: "8px",
  overflowX: "auto",
  marginTop: "15px"
};

const center = {
  textAlign: "center",
  marginTop: "50px"
};

const errorText = {
  color: "#ff4d4f",
  textAlign: "center"
};