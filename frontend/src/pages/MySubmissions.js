import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axiosInstance from "../api/axiosInstance";

const MySubmissions = () => {
  const [myBugs, setMyBugs] = useState([]);
  const [mySolutions, setMySolutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bugsRes, solutionsRes] = await Promise.all([
          axiosInstance.get("/bugs/my"),
          axiosInstance.get("/solutions/my"),
        ]);

        setMyBugs(bugsRes.data);
        setMySolutions(solutionsRes.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load submissions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={container}>
        <h2>Loading your submissions...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={container}>
        <h2 style={{ color: "red" }}>{error}</h2>
      </div>
    );
  }

  return (
    <div style={container}>
      <h1 style={heading}>📂 My Submissions</h1>

      {/* ================= MY BUGS ================= */}
      <section style={section}>
        <h2 style={subHeading}>🐞 My Bugs</h2>

        {myBugs.length === 0 ? (
          <p style={empty}>You haven't reported any bugs yet.</p>
        ) : (
          myBugs.map((bug, index) => (
            <motion.div
              key={bug._id}
              style={card}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <h3 style={bugTitle}>{bug.title}</h3>
              <p style={bugDesc}>{bug.description}</p>
            </motion.div>
          ))
        )}
      </section>

      {/* ================= MY SOLUTIONS ================= */}
      <section style={section}>
        <h2 style={subHeading}>💡 My Solutions</h2>

        {mySolutions.length === 0 ? (
          <p style={empty}>You haven't submitted any solutions yet.</p>
        ) : (
          mySolutions.map((sol, index) => (
            <motion.div
              key={sol._id}
              style={card}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <h3 style={solutionTitle}>
                {sol.bugId?.title || "Bug"}
              </h3>

              <pre style={codeBlock}>
                {sol.fixedCode}
              </pre>
            </motion.div>
          ))
        )}
      </section>
    </div>
  );
};

/* ================= STYLES ================= */

const container = {
  padding: "100px 20px",
  minHeight: "100vh",
  background: "#0f0f12",
  color: "#e2e8f0",
};

const heading = {
  textAlign: "center",
  marginBottom: "50px",
  fontSize: "36px",
  background: "linear-gradient(to right,#c084fc,#8b5cf6)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

const section = {
  maxWidth: "800px",
  margin: "0 auto 60px auto",
};

const subHeading = {
  marginBottom: "20px",
  fontSize: "24px",
  color: "#c084fc",
};

const card = {
  background: "#16161a",
  padding: "20px",
  borderRadius: "16px",
  border: "1px solid #2d2d39",
  marginBottom: "20px",
};

const bugTitle = {
  fontSize: "20px",
  fontWeight: "600",
};

const bugDesc = {
  fontSize: "14px",
  color: "#a1a1aa",
};

const solutionTitle = {
  fontSize: "18px",
  marginBottom: "10px",
};

const codeBlock = {
  background: "#0f172a",
  padding: "15px",
  borderRadius: "10px",
  overflowX: "auto",
  fontSize: "14px",
  color: "#22c55e",
};

const empty = {
  color: "#888",
};

export default MySubmissions;