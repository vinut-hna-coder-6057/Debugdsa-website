import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/Authcontext";
import axiosInstance from "../api/axiosInstance";
import CodeEditor from "../components/CodeEditor";

/* ================= DATA ================= */

const LANGUAGES = ["JavaScript", "Python", "Java", "C++"];

const TOPIC_PATTERNS = {
  Arrays: ["Two Pointer", "Sliding Window", "Prefix Sum", "Kadane"],
  Strings: ["Palindrome", "Anagram", "Substring", "Pattern Matching"],
  "Linked List": [
    "Reverse Linked List",
    "Detect Cycle",
    "Middle Node",
    "Merge Two Lists",
    "Remove Nth Node"
  ],
  "Stack & Queue": ["Valid Parentheses", "Monotonic Stack", "Queue Using Stack"],
  Trees: ["DFS", "BFS", "Height of Tree", "Diameter"],
  Graphs: ["DFS", "BFS", "Topological Sort", "Dijkstra"],
  "Dynamic Programming": ["Memoization", "Tabulation", "Knapsack", "LIS"],
  Greedy: ["Interval Scheduling", "Activity Selection"],
  Backtracking: ["Subsets", "Permutations", "N-Queens"],
  Heap: ["Top K Elements", "Merge K Lists"],
  Hashing: ["Two Sum", "Frequency Count"]
};

function PostBug() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    title: "",
    language: "",
    topic: "",
    pattern: "",
    code: "",
    description: "",
    error: "",
    difficulty:"easy",
    expectedOutput: ""
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const postBug = async () => {
    if (loading) return;

    if (!user) {
      navigate("/login");
      return;
    }

    const {
      title,
      language,
      topic,
      pattern,
      code,
      description,
      error,
      expectedOutput
    } = form;

    if (!title || !language || !topic || !pattern || !code || !description || !error || !expectedOutput) {
      setErrorMsg("Please fill all required fields.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg("");

      await axiosInstance.post("/bugs", form);

      navigate("/view");

    } catch (err) {
      setErrorMsg(
        err.response?.data?.message ||
        "Failed to post bug. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const patterns = form.topic ? TOPIC_PATTERNS[form.topic] : [];

  return (
    <div style={container}>
      <motion.div
        style={card}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 style={heading}>🐞 Post Debugging Challenge</h2>

        {errorMsg && <p style={errorStyle}>{errorMsg}</p>}

        {/* Title */}
        <input
          style={input}
          placeholder="Bug Title *"
          value={form.title}
          onChange={e => handleChange("title", e.target.value)}
        />

        {/* Language */}
        <select
          style={input}
          value={form.language}
          onChange={e => handleChange("language", e.target.value)}
        >
          <option value="">Select Language *</option>
          {LANGUAGES.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>

        <select
style={input}
value={form.difficulty}
onChange={(e)=>
setForm({
...form,
difficulty:e.target.value
})
}
>

<option value="easy">Easy</option>

<option value="medium">Medium</option>

<option value="hard">Hard</option>

</select>

        {/* Topic */}
        <select
          style={input}
          value={form.topic}
          onChange={e => {
            handleChange("topic", e.target.value);
            handleChange("pattern", "");
          }}
        >
          <option value="">Select Topic *</option>
          {Object.keys(TOPIC_PATTERNS).map(topic => (
            <option key={topic} value={topic}>{topic}</option>
          ))}
        </select>

        {/* Pattern appears dynamically */}
        {patterns.length > 0 && (
          <select
            style={input}
            value={form.pattern}
            onChange={e => handleChange("pattern", e.target.value)}
          >
            <option value="">Select Pattern *</option>
            {patterns.map(pattern => (
              <option key={pattern} value={pattern}>{pattern}</option>
            ))}
          </select>
        )}

        {/* Monaco Editor */}
        <div style={{ marginTop: "15px" }}>
          <CodeEditor
            language={form.language}
            code={form.code}
            setCode={(value) => handleChange("code", value)}
          />
        </div>

        {/* Description */}
        <textarea
          style={input}
          placeholder="Describe the problem *"
          value={form.description}
          onChange={e => handleChange("description", e.target.value)}
        />

        {/* Error */}
        <textarea
          style={input}
          placeholder="What error are you getting? *"
          value={form.error}
          onChange={e => handleChange("error", e.target.value)}
        />

        {/* Expected Output */}
        <textarea
          style={input}
          placeholder="Expected output *"
          value={form.expectedOutput}
          onChange={e => handleChange("expectedOutput", e.target.value)}
        />

        <motion.button
          style={{ ...button, opacity: loading ? 0.7 : 1 }}
          whileHover={{ scale: loading ? 1 : 1.03 }}
          onClick={postBug}
          disabled={loading}
        >
          {loading ? "Posting..." : "Post Bug 🚀"}
        </motion.button>

      </motion.div>
    </div>
  );
}

/* ================= STYLES ================= */

const container = {
  background: "linear-gradient(135deg,#0f0f12,#1a1a22)",
  minHeight: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
};

const card = {
  backdropFilter: "blur(20px)",
  background: "rgba(255,255,255,0.05)",
  padding: "30px",
  borderRadius: "16px",
  width: "750px",
  color: "white",
  boxShadow: "0 8px 30px rgba(0,0,0,0.5)"
};

const heading = {
  color: "#8b5cf6",
  marginBottom: "20px"
};

const errorStyle = {
  color: "#ef4444",
  marginBottom: "10px"
};

const input = {
  width: "100%",
  padding: "12px",
  marginTop: "10px",
  background: "#0f0f12",
  border: "1px solid #333",
  color: "white",
  borderRadius: "8px"
};

const button = {
  marginTop: "20px",
  padding: "14px",
  background: "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  border: "none",
  color: "white",
  borderRadius: "10px",
  cursor: "pointer",
  width: "100%"
};

export default PostBug;