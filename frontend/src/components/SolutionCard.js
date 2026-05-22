import React from "react";
import { motion } from "framer-motion";

const complexityScore = {
  "O(1)": 5,
  "O(log n)": 4,
  "O(n)": 3,
  "O(n log n)": 2,
  "O(n^2)": 1,
};

const SolutionCard = ({ solution, index }) => {
  const isBest = index === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`solution-card ${isBest ? "best" : ""}`}
    >
      {isBest && <div className="best-badge">Best Solution</div>}

      <div className="solution-header">
        <h3>{solution.user}</h3>
        <span className="points">{complexityScore[solution.time]} pts</span>
      </div>

      <div className="complexity-box">
        <div>
          <strong>Time:</strong> {solution.time}
        </div>
        <div>
          <strong>Space:</strong> {solution.space}
        </div>
      </div>

      <pre className="code-preview">{solution.code}</pre>

      <div className="ai-explanation">
        {solution.explanation}
      </div>
    </motion.div>
  );
};

export default SolutionCard;