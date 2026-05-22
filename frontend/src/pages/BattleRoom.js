import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import CodeEditor from "../components/CodeEditor";
import { motion } from "framer-motion";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  withCredentials: true
});

function BattleRoom() {

const { id } = useParams();
const location = useLocation();

const [battle,setBattle] = useState(null);
const [submissions,setSubmissions] = useState([]);
const [leaderboard,setLeaderboard] = useState([]);

const [selectedSubmission,setSelectedSubmission] = useState(null);

const [tab,setTab] = useState("problem");

const [code,setCode] = useState("");
const [loading,setLoading] = useState(true);
const [message,setMessage] = useState("");

const [timeLeft,setTimeLeft] = useState("");

////////////////////////////////////////////////////////
// TAB PARAM
////////////////////////////////////////////////////////

useEffect(()=>{

const params = new URLSearchParams(location.search);
const tabParam = params.get("tab");

if(tabParam){
setTab(tabParam);
}

},[location.search]);

////////////////////////////////////////////////////////
// FETCH FUNCTIONS
////////////////////////////////////////////////////////

const fetchBattle = async ()=>{

try{

const res = await axiosInstance.get(`/battles/${id}`);
setBattle(res.data);

}catch(err){
console.error("Battle fetch error:",err);
}

};

const fetchSubmissions = async ()=>{

try{

const res = await axiosInstance.get(`/battles/submissions/${id}`);
setSubmissions(res.data);

}catch(err){
console.error("Submissions error:",err);
}

};

const fetchLeaderboard = async ()=>{

try{

const res = await axiosInstance.get(`/battles/leaderboard/${id}`);
setLeaderboard(res.data);

}catch(err){
console.error("Leaderboard error:",err);
}

};

////////////////////////////////////////////////////////
// INITIAL LOAD
////////////////////////////////////////////////////////

useEffect(()=>{

const load = async ()=>{

setLoading(true);

await fetchBattle();
await fetchSubmissions();
await fetchLeaderboard();

setLoading(false);

};

load();

},[id]);

////////////////////////////////////////////////////////
// SOCKET EVENTS
////////////////////////////////////////////////////////

useEffect(()=>{

socket.emit("joinBattleRoom",id);

socket.on("playerJoined",()=>{
fetchBattle();
});

socket.on("solutionSubmitted",()=>{
fetchSubmissions();
});

socket.on("leaderboardUpdated",(data)=>{
setLeaderboard(data);
});

return ()=>{

socket.emit("leaveBattleRoom",id);

};

},[id]);

////////////////////////////////////////////////////////
// TIMER
////////////////////////////////////////////////////////

useEffect(()=>{

if(!battle) return;

const interval = setInterval(()=>{

const now = new Date().getTime();
const end = new Date(battle.endTime).getTime();

const distance = end - now;

if(distance <= 0){

setTimeLeft("Battle Finished");
clearInterval(interval);

}else{

const minutes = Math.floor(distance / 60000);
const seconds = Math.floor((distance % 60000)/1000);

setTimeLeft(`${minutes}m ${seconds}s`);

}

},1000);

return ()=>clearInterval(interval);

},[battle]);

////////////////////////////////////////////////////////
// SUBMIT
////////////////////////////////////////////////////////

const submitSolution = async ()=>{

try{

await axiosInstance.post(`/battles/submit/${id}`,{
code
});

setMessage("Solution submitted successfully");

setTab("submissions");

fetchSubmissions();

}catch(err){

console.error(err);

setMessage("Submission failed");

}

};

////////////////////////////////////////////////////////
// LOADING
////////////////////////////////////////////////////////

if(loading){
return <div style={loadingScreen}>Loading battle...</div>;
}

if(!battle){
return <div style={loadingScreen}>Battle not found</div>;
}

////////////////////////////////////////////////////////
// UI
////////////////////////////////////////////////////////

return(

<div style={container}>

<h1 style={title}>{battle.title}</h1>

<motion.div
style={timerBox}
animate={{scale:[1,1.02,1]}}
transition={{repeat:Infinity,duration:2}}
>
⏱ Time Remaining: {timeLeft}
</motion.div>

<div style={tabBar}>

<motion.button
style={tab==="problem"?activeTab:tabBtn}
whileHover={{scale:1.08}}
onClick={()=>setTab("problem")}
>
Problem
</motion.button>

<motion.button
style={tab==="submit"?activeTab:tabBtn}
whileHover={{scale:1.08}}
onClick={()=>setTab("submit")}
>
Submit
</motion.button>

<motion.button
style={tab==="submissions"?activeTab:tabBtn}
whileHover={{scale:1.08}}
onClick={()=>setTab("submissions")}
>
Submissions ({submissions.length})
</motion.button>

<motion.button
style={tab==="leaderboard"?activeTab:tabBtn}
whileHover={{scale:1.08}}
onClick={()=>setTab("leaderboard")}
>
Leaderboard
</motion.button>

</div>


{tab==="problem" && (

<>

<motion.div
style={bugCard}
whileHover={{y:-4}}
>

<h2>Problem</h2>

<p>{battle.description}</p>

<p><b>Language:</b> {battle.language}</p>

<p><b>Topic:</b> {battle.topic}</p>

</motion.div>

<h3>Buggy Code</h3>

<pre style={codeBlock}>
{battle.buggyCode}
</pre>

</>

)}


{tab==="submit" && (

<>

<h3>Fix the Code</h3>

<CodeEditor
language={battle.language}
code={code}
setCode={setCode}
/>

<motion.button
style={submitBtn}
whileHover={{scale:1.08}}
whileTap={{scale:0.95}}
onClick={submitSolution}
>
Submit Solution
</motion.button>

<p>{message}</p>

</>

)}


{tab==="submissions" && (

<div>

{!selectedSubmission ? (

submissions.map(s=>(

<motion.div
key={s._id}
style={submissionCard}
whileHover={{scale:1.02,y:-3}}
onClick={()=>setSelectedSubmission(s)}
>

<strong>{s.user?.name}</strong>

<div style={time}>
{new Date(s.submittedAt).toLocaleString()}
</div>

<p>Status: {s.status}</p>

{s.late && (
<span style={lateBadge}>Late Submission</span>
)}

</motion.div>

))

) : (

<>

<button
style={backBtn}
onClick={()=>setSelectedSubmission(null)}
>
← Back
</button>

<CodeEditor
language={battle.language}
code={selectedSubmission.code}
setCode={()=>{}}
/>

</>

)}

</div>

)}



{tab==="leaderboard" && (

<div>

{leaderboard.length === 0 ? (

<p>No accepted solutions yet</p>

) : (

leaderboard.map(entry=>(

<motion.div
key={entry.rank}
style={leaderboardCard}
whileHover={{scale:1.03}}
>

<strong>#{entry.rank}</strong> {entry.user}

<span style={time}>
{new Date(entry.time).toLocaleString()}
</span>

</motion.div>

))

)}

</div>

)}

</div>

);

}

////////////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////////////

const container={
padding:"50px",
background:"#0f0f12",
minHeight:"100vh",
color:"#e2e8f0"
}

const title={
color:"#a78bfa",
marginBottom:"10px",
fontSize:"32px",
fontWeight:"600"
}

const timerBox={
background:"linear-gradient(90deg,#7c3aed,#a78bfa)",
padding:"12px",
borderRadius:"10px",
marginBottom:"25px",
color:"white",
fontWeight:"bold",
boxShadow:"0 8px 25px rgba(124,58,237,0.4)"
}

const tabBar={
display:"flex",
gap:"12px",
marginBottom:"25px"
}

const tabBtn={
padding:"10px 16px",
background:"#1f1f25",
border:"1px solid #7c3aed",
borderRadius:"8px",
color:"white",
cursor:"pointer"
}

const activeTab={
padding:"10px 16px",
background:"#7c3aed",
border:"none",
borderRadius:"8px",
color:"white",
cursor:"pointer",
boxShadow:"0 6px 20px rgba(124,58,237,0.5)"
}

const bugCard={
background:"#18181b",
padding:"22px",
borderRadius:"12px",
marginBottom:"25px",
border:"1px solid rgba(167,139,250,0.2)"
}

const codeBlock={
background:"#020617",
padding:"18px",
borderRadius:"10px",
color:"#22c55e",
marginBottom:"20px",
overflowX:"auto"
}

const submitBtn={
marginTop:"18px",
padding:"12px 22px",
background:"linear-gradient(90deg,#7c3aed,#a78bfa)",
border:"none",
borderRadius:"8px",
color:"white",
cursor:"pointer",
fontWeight:"600"
}

const submissionCard={
background:"#18181b",
padding:"16px",
borderRadius:"10px",
marginBottom:"12px",
cursor:"pointer",
border:"1px solid rgba(167,139,250,0.15)"
}

const leaderboardCard={
background:"#18181b",
padding:"16px",
borderRadius:"10px",
marginBottom:"12px",
display:"flex",
justifyContent:"space-between",
border:"1px solid rgba(167,139,250,0.15)"
}

const time={
fontSize:"12px",
opacity:"0.7"
}

const lateBadge={
background:"#f59e0b",
padding:"4px 8px",
borderRadius:"6px",
fontSize:"11px",
marginLeft:"10px"
}

const backBtn={
marginBottom:"15px",
background:"#7c3aed",
border:"none",
padding:"8px 14px",
borderRadius:"8px",
color:"white",
cursor:"pointer"
}

const loadingScreen={
padding:"50px",
background:"#0f0f12",
minHeight:"100vh",
color:"white"
}

export default BattleRoom;