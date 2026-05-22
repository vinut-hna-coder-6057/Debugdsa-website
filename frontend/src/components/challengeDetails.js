import React from "react";
import SolutionCard from "../components/SolutionCard";
import LiveSession from "../components/LiveSession";

const mockSolutions = [
  {
    user: "Vinuth",
    time: "O(n)",
    space: "O(1)",
    explanation: "Single loop traversal makes time linear.",
    code: `function solve(arr){
  return arr.reduce((a,b)=>a+b,0);
}`
  },
  {
    user: "Arjun",
    time: "O(n^2)",
    space: "O(1)",
    explanation: "Nested loops increase time complexity.",
    code: `for(let i=0;i<n;i++){
  for(let j=0;j<n;j++){
    console.log(i,j);
  }
}`
  }
];

const complexityScore = {
  "O(1)": 5,
  "O(log n)": 4,
  "O(n)": 3,
  "O(n log n)": 2,
  "O(n^2)": 1,
};

const ChallengeDetails = () => {
  const sortedSolutions = [...mockSolutions].sort(
    (a, b) => complexityScore[b.time] - complexityScore[a.time]
  );

  return (
    <div className="challenge-container">
      <h1 className="challenge-title">Debug Challenge</h1>

      <LiveSession />

      <div className="solutions-section">
        <h2>Solutions Ranked by Complexity</h2>
        {sortedSolutions.map((solution, index) => (
          <SolutionCard
            key={index}
            solution={solution}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

export default ChallengeDetails;