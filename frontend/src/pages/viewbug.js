import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAuth } from "../context/Authcontext";


function ViewBug() {
const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [bug, setBug] = useState(null);
  const [solutions, setSolutions] = useState([]);
  const [selectedSolution, setSelectedSolution] = useState(null);

  const [leftTab, setLeftTab] = useState("description");
  const [rightTab, setRightTab] = useState("description");

  const [newCode, setNewCode] = useState("");
  const [loading, setLoading] = useState(true);

  const [output, setOutput] = useState("");
  const [input, setInput] = useState("");
const { refreshUser } = useAuth();
  /////////////////////////////////////////////////////////
  // FETCH DATA
  /////////////////////////////////////////////////////////

  const fetchBug = useCallback(async () => {
    try {

      const { data } = await axiosInstance.get(`/bugs/${id}`);

      setBug(data.bug);

      setNewCode(data.bug.buggyCode || data.bug.code || "");

    } catch (err) {
      console.error("Fetch bug error:", err);
    }
  }, [id]);

  const fetchSolutions = useCallback(async () => {
    try {

      const res = await axiosInstance.get(`/solutions/bug/${id}`);
      setSolutions(res.data || []);

    } catch (err) {
      console.error("Fetch solutions error:", err);
    }
  }, [id]);

  useEffect(() => {

    const load = async () => {

      setLoading(true);

      await fetchBug();
      await fetchSolutions();

      setLoading(false);

    };

    load();

  }, [fetchBug, fetchSolutions]);

  /////////////////////////////////////////////////////////
  // POST SOLUTION
  /////////////////////////////////////////////////////////

  const postSolution = async () => {

    if (!newCode.trim()) {
      alert("Write solution first");
      return;
    }

    try {

      await axiosInstance.post(`/solutions/${id}`, {
        code: newCode
      });

      setRightTab("submissions");

      await fetchSolutions();

    } catch (err) {

      console.error("Submit error:", err);
      alert(err.response?.data?.message || "Failed to submit");

    }

  };

  /////////////////////////////////////////////////////////
  // RUN CODE
  /////////////////////////////////////////////////////////

  const runCode = async () => {

    try {

      const languageMap = {
        JavaScript: 63,
        Python: 71,
        Java: 62,
        "C++": 54
      };

      const res = await axios.post(
        "https://ce.judge0.com/submissions?base64_encoded=false&wait=true",
        {
          source_code: newCode,
          language_id: languageMap[bug.language],
          stdin: input
        }
      );

      const result =
        res.data.stdout ||
        res.data.stderr ||
        res.data.compile_output ||
        "No Output";

      setOutput(result);

    } catch (err) {

      console.error(err);
      setOutput("Execution Error");

    }

  };

  /////////////////////////////////////////////////////////
  // UPVOTE
  /////////////////////////////////////////////////////////

const upvoteSolution = async (
solutionId,
e
) => {

e.stopPropagation();

try {

const res = await axiosInstance.put(
`/solutions/upvote/${solutionId}`
);

setSolutions(prev =>

prev.map(sol =>

sol._id === solutionId

? {

...sol,

upvoteCount:
res.data.upvoteCount

}

: sol

)

);

} catch (err) {

alert(
err.response?.data?.message ||
"Error upvoting"
);

}

};

  /////////////////////////////////////////////////////////
  // ACCEPT
  /////////////////////////////////////////////////////////

const acceptSolution = async (
solutionId,
e
) => {

e.stopPropagation();

const selectedSolution =
solutions.find(
s => s._id === solutionId
);

////////////////////////////////////////////////////
// OWNER CANNOT ACCEPT OWN SOLUTION
////////////////////////////////////////////////////

if(

selectedSolution?.solvedBy?._id?.toString() ===
bug?.postedBy?._id?.toString()

){

alert(
"👑 Owner solutions are automatically highlighted and pinned"
);

return;

}

try {

await axiosInstance.put(
`/solutions/accept/${solutionId}`
);

await refreshUser();

await fetchSolutions();

alert(
"✅ Community solution accepted successfully"
);

} catch (err) {

alert(

err.response?.data?.message ||

"Error accepting solution"

);

}

};

  /////////////////////////////////////////////////////////
  // LANGUAGE MAP
  /////////////////////////////////////////////////////////

  const mapLanguage = (lang) => {

    switch (lang) {

      case "JavaScript": return "javascript";
      case "Python": return "python";
      case "Java": return "java";
      case "C++": return "cpp";
      default: return "javascript";

    }

  };

  /////////////////////////////////////////////////////////
  // LOADING
  /////////////////////////////////////////////////////////

  if (loading) return <div style={center}>Loading...</div>;
  if (!bug) return <div style={center}>Bug not found</div>;

  /////////////////////////////////////////////////////////
  // UI
  /////////////////////////////////////////////////////////

  return (

    <div style={container}>

      {/* LEFT PANEL */}

      <div style={leftPanel}>

        <button style={backButton} onClick={() => navigate("/view")}>
          ← Back to Bugs
        </button>

        <h2>{bug.title}</h2>

        <p style={meta}>
          {bug.language} • {bug.topic}
        </p>

        <div style={tabHeader}>

          <Tab label="Description" active={leftTab==="description"} onClick={()=>setLeftTab("description")} />
          <Tab label="Code" active={leftTab==="code"} onClick={()=>setLeftTab("code")} />
          <Tab label="Error" active={leftTab==="error"} onClick={()=>setLeftTab("error")} />
          <Tab label="Output" active={leftTab==="output"} onClick={()=>setLeftTab("output")} />
          <Tab label="Post" active={leftTab==="post"} onClick={()=>setLeftTab("post")} />

        </div>

        <div style={contentArea}>

          <AnimatePresence mode="wait">

            {leftTab === "description" && (
              <motion.div key="desc" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <p>{bug.description}</p>
              </motion.div>
            )}

            {leftTab === "code" && (
              <motion.div key="code">
                <Editor
                  height="500px"
                  theme="vs-dark"
                  language={mapLanguage(bug.language)}
                  value={bug.buggyCode || bug.code || ""}
                  options={{
                    readOnly:true,
                    minimap:{enabled:false},
                    automaticLayout:true
                  }}
                />
              </motion.div>
            )}

            {leftTab === "error" && (
  <motion.div
    key="error"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >

    <pre style={errorBox}>
      {bug.error || "No error provided"}
    </pre>

  </motion.div>
)}

{leftTab === "output" && (
  <motion.div
    key="output"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >

    <pre style={outputCode}>
      {bug.expectedOutput || "No expected output"}
    </pre>

  </motion.div>
)}

            {leftTab === "post" && (

              <motion.div key="post">

                <Editor
                  height="400px"
                  theme="vs-dark"
                  language={mapLanguage(bug.language)}
                  value={newCode}
                  onChange={(val)=>setNewCode(val || "")}
                  options={{
                    minimap:{enabled:false},
                    automaticLayout:true
                  }}
                />

                <textarea
                  placeholder="Custom Input"
                  value={input}
                  onChange={(e)=>setInput(e.target.value)}
                  style={inputBox}
                />

                <button style={runBtn} onClick={runCode}>
                  Run Code
                </button>

                <div style={outputBox}>
                  <strong>Output</strong>
                  <pre>{output}</pre>
                </div>

                <button style={submitBtn} onClick={postSolution}>
                  Submit Solution
                </button>

              </motion.div>

            )}

          </AnimatePresence>

        </div>

      </div>

      {/* RIGHT PANEL */}

      <div style={rightPanel}>

        <div style={tabHeader}>

          <Tab label="Description" active={rightTab==="description"} onClick={()=>setRightTab("description")} />
          <Tab label={`Submissions (${solutions.length})`} active={rightTab==="submissions"} onClick={()=>setRightTab("submissions")} />

        </div>

        <div style={contentArea}>

          <AnimatePresence mode="wait">

            {rightTab === "submissions" && (

              <motion.div key="subs">

                {solutions.length === 0 && (
                  <p>No submissions yet.</p>
                )}                                      

               {!selectedSolution &&

[

...solutions.filter(
sol => sol.postedByOwner
),

...solutions.filter(
sol => !sol.postedByOwner
)

].map(sol => (

<div
key={sol._id}
style={{
...submissionCard,

border: sol.postedByOwner
? "2px solid #facc15"
: sol.accepted
? "2px solid #22c55e"
: "1px solid #1e293b",

background: sol.postedByOwner
? "linear-gradient(135deg,#1f1b0f,#020617)"
: sol.accepted
? "linear-gradient(135deg,#052e16,#020617)"
: "#020617",

boxShadow: sol.postedByOwner
? "0 0 25px rgba(250,204,21,0.15)"
: sol.accepted
? "0 0 20px rgba(34,197,94,0.15)"
: "none"

}}
onClick={()=>setSelectedSolution(sol)}
>

<div style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center"
}}>

<div>

<strong style={{
fontSize:"16px"
}}>

{sol.solvedBy?.name || "User"}

</strong>

{/* OWNER SOLUTION */}

{Boolean(sol.postedByOwner) && (

<div style={ownerBadge}>

👑 OFFICIAL OWNER SOLUTION

</div>

)}

{/* ACCEPTED COMMUNITY SOLUTION */}

{sol.accepted && !sol.postedByOwner && (

<div style={acceptedBadge}>

✅ VERIFIED COMMUNITY SOLUTION

</div>

)}

<div style={time}>

{new Date(sol.createdAt).toLocaleString()}

</div>

</div>

<div style={{
display:"flex",
gap:"10px",
alignItems:"center"
}}>

<button
style={voteBtn}
onClick={(e)=>upvoteSolution(sol._id,e)}
>

⬆ {sol.upvoteCount || 0}

</button>

{/* ACCEPT / ACCEPTED */}

{sol.accepted ? (

<div style={acceptedButton}>

✅ Accepted

</div>

) :

bug?.postedBy?._id?.toString() ===
user?._id?.toString() &&
!sol.postedByOwner ? (

<button
style={acceptBtn}
onClick={(e)=>acceptSolution(sol._id,e)}
>

Accept

</button>

) : null}

</div>

</div>

</div>

))

}

                {selectedSolution && (

                  <>
                    <button
                      style={backButtonSmall}
                      onClick={()=>setSelectedSolution(null)}
                    >
                      ← Back
                    </button>

                    <Editor
                      height="600px"
                      theme="vs-dark"
                      language={mapLanguage(bug.language)}
                      value={selectedSolution.fixedCode}
                      options={{
                        readOnly:true,
                        minimap:{enabled:false},
                        automaticLayout:true
                      }}
                    />

                  </>

                )}

              </motion.div>

            )}

          </AnimatePresence>

        </div>

      </div>

    </div>

  );

}

function Tab({label,active,onClick}) {

  return (
    <div
      onClick={onClick}
      style={{
        padding:"10px 18px",
        cursor:"pointer",
        borderBottom:active?"2px solid #8b5cf6":"2px solid transparent",
        color:active?"#8b5cf6":"#aaa"
      }}
    >
      {label}
    </div>
  );

}
const center = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  fontSize: "20px",
  color: "white"
};

const container = {
  display: "flex",
  height: "100vh",
  background: "#0f172a",
  color: "white"
};

const leftPanel = {
  flex: 1,
  padding: "20px",
  borderRight: "1px solid #1e293b",
  overflow: "auto"
};

const errorBox = {

  background: "#111827",
  padding: "20px",
  borderRadius: "10px",
  color: "#f87171",
  whiteSpace: "pre-wrap",
  lineHeight: "1.6",
  border: "1px solid #7f1d1d"

};
const ownerBadge = {

marginTop:"10px",

display:"inline-block",

padding:"8px 16px",

borderRadius:"999px",

background:
"linear-gradient(135deg,#facc15,#f59e0b)",

color:"#111",

fontWeight:"700",

fontSize:"12px",

letterSpacing:"0.5px",

boxShadow:
"0 0 20px rgba(250,204,21,0.35)"

};

const acceptedBadge = {

marginTop:"10px",

display:"inline-block",

padding:"8px 16px",

borderRadius:"999px",

background:
"linear-gradient(135deg,#22c55e,#16a34a)",

color:"white",

fontWeight:"700",

fontSize:"12px",

letterSpacing:"0.5px",

boxShadow:
"0 0 20px rgba(34,197,94,0.35)"

};

const acceptedButton = {

padding:"6px 14px",

borderRadius:"10px",

background:
"linear-gradient(135deg,#22c55e,#16a34a)",

color:"white",

fontWeight:"700",

fontSize:"13px",

display:"flex",

alignItems:"center",

justifyContent:"center",

boxShadow:
"0 0 18px rgba(34,197,94,0.35)"

};

const outputCode = {

  background: "#111827",
  padding: "20px",
  borderRadius: "10px",
  color: "#4ade80",
  whiteSpace: "pre-wrap",
  lineHeight: "1.6",
  border: "1px solid #14532d"

};

const rightPanel = {
  flex: 1,
  padding: "20px",
  overflow: "auto"
};

const meta = {
  color: "#94a3b8",
  marginBottom: "10px"
};

const tabHeader = {
  display: "flex",
  borderBottom: "1px solid #1e293b",
  marginBottom: "10px"
};

const contentArea = {
  marginTop: "10px"
};

const submissionCard = {
  padding: "15px",
  border: "1px solid #1e293b",
  borderRadius: "8px",
  marginBottom: "10px",
  cursor: "pointer",
  background: "#020617"
};

const accepted = {
  marginLeft: "10px",
  color: "#22c55e"
};

const time = {
  fontSize: "12px",
  color: "#94a3b8"
};

const voteBtn = {
  padding: "5px 10px",
  cursor: "pointer"
};

const acceptBtn = {
  padding: "5px 10px",
  background: "#22c55e",
  border: "none",
  cursor: "pointer"
};

const submitBtn = {
  marginTop: "10px",
  padding: "10px",
  background: "#8b5cf6",
  border: "none",
  color: "white",
  cursor: "pointer"
};

const runBtn = {
  marginTop: "10px",
  padding: "8px",
  background: "#2563eb",
  border: "none",
  color: "white",
  cursor: "pointer"
};

const inputBox = {
  width: "100%",
  height: "80px",
  marginTop: "10px"
};

const outputBox = {
  marginTop: "10px",
  padding: "10px",
  background: "#020617",
  border: "1px solid #1e293b"
};

const backButton = {
  marginBottom: "10px",
  padding: "6px 10px",
  cursor: "pointer"
};

const backButtonSmall = {
  marginBottom: "10px",
  padding: "6px 10px",
  cursor: "pointer"
};
export default ViewBug;