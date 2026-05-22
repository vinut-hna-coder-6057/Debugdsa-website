import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import axiosInstance from "../api/axiosInstance";

function ViewBugs() {

  const navigate = useNavigate();
  const location = useLocation();

  const [bugs,setBugs] = useState([]);
  const [recommended,setRecommended] = useState([]);
  const [filteredBugs,setFilteredBugs] = useState([]);

  const [loading,setLoading] = useState(true);
  const [mode,setMode] = useState("all");

  const [languageFilter,setLanguageFilter] = useState("");
  const [topicFilter,setTopicFilter] = useState("");
  const [sortOrder,setSortOrder] = useState("latest");

////////////////////////////////////////////////////////
// FETCH ALL BUGS
////////////////////////////////////////////////////////

const fetchBugs = useCallback(async()=>{

try{

setLoading(true);

const res = await axiosInstance.get("/bugs");

const bugList = Array.isArray(res.data)
? res.data
: res.data.bugs || [];

setBugs(bugList);

}catch(err){

console.error("Failed to fetch bugs:",err);
setBugs([]);

}finally{

setLoading(false);

}

},[]);

////////////////////////////////////////////////////////
// FETCH RECOMMENDATIONS
////////////////////////////////////////////////////////

const fetchRecommendations = async()=>{

try{

const res = await axiosInstance.get("/recommendations/bugs");

const recList = Array.isArray(res.data)
? res.data
: res.data.bugs || [];

setRecommended(recList);

}catch(err){

console.error("Recommendation fetch error:",err);
setRecommended([]);

}

};

////////////////////////////////////////////////////////
// LOAD BUGS
////////////////////////////////////////////////////////

useEffect(()=>{
fetchBugs();
},[location.key,fetchBugs]);

////////////////////////////////////////////////////////
// FILTER + SORT
////////////////////////////////////////////////////////

useEffect(()=>{

let baseList = mode === "recommended" ? recommended : bugs;

let updated=[...baseList];

if(languageFilter){
updated=updated.filter(b=>b.language===languageFilter);
}

if(topicFilter){
updated=updated.filter(b=>b.topic===topicFilter);
}

if(sortOrder==="latest"){
updated.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
}else{
updated.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
}

setFilteredBugs(updated);

},[bugs,recommended,languageFilter,topicFilter,sortOrder,mode]);

////////////////////////////////////////////////////////
// SWITCH MODES
////////////////////////////////////////////////////////

const showAllBugs = ()=>{

setMode("all");

};

const showRecommended = async()=>{

setMode("recommended");

if(recommended.length===0){
await fetchRecommendations();
}

};

////////////////////////////////////////////////////////
// LOADING
////////////////////////////////////////////////////////

if(loading){

return(
<div style={loadingStyle}>
<h2>Loading Bugs...</h2>
</div>
);

}

////////////////////////////////////////////////////////
// UI
////////////////////////////////////////////////////////

return(

<div style={container}>

<h2 style={heading}>🐞 Debug Challenges</h2>

{/* MODE BUTTONS */}

<div style={topButtons}>

<button
style={mode==="all"?activeBtn:btn}
onClick={showAllBugs}
>
All Bugs
</button>

<button
style={mode==="recommended"?activeBtn:btn}
onClick={showRecommended}
>
Recommended For You
</button>

</div>

{/* FILTERS */}

<div style={filterBar}>

<select
style={select}
value={languageFilter}
onChange={(e)=>setLanguageFilter(e.target.value)}
>
<option value="">All Languages</option>
<option>JavaScript</option>
<option>Python</option>
<option>Java</option>
<option>C++</option>
</select>

<select
style={select}
value={topicFilter}
onChange={(e)=>setTopicFilter(e.target.value)}
>
<option value="">All Topics</option>
<option>Arrays</option>
<option>Strings</option>
<option>Linked List</option>
<option>Stack & Queue</option>
<option>Trees</option>
<option>Graphs</option>
<option>Dynamic Programming</option>
<option>Greedy</option>
<option>Backtracking</option>
<option>Heap</option>
<option>Hashing</option>
</select>

<select
style={select}
value={sortOrder}
onChange={(e)=>setSortOrder(e.target.value)}
>
<option value="latest">Latest</option>
<option value="oldest">Oldest</option>
</select>

</div>

{/* BUG GRID */}

{filteredBugs.length===0?(
<p style={{opacity:0.7}}>No bugs found.</p>
):( 

<div style={grid}>

{filteredBugs.map((bug)=>(

<motion.div
key={bug._id}
style={card}
whileHover={{scale:1.03}}
onClick={()=>navigate(`/view/${bug._id}`)}
>

<h3 style={{color:"#8b5cf6"}}>{bug.title}</h3>

<div style={meta}>
{bug.language} • {bug.topic}
</div>

{bug.pattern && (
<div style={pattern}>
Pattern: {bug.pattern}
</div>
)}

<div style={bottomRow}>

<span>
{new Date(bug.createdAt).toLocaleDateString()}
</span>

<span>
💬 {bug.solutionCount ?? bug.solutions?.length ?? 0} Submissions
</span>

</div>

</motion.div>

))}

</div>

)}

</div>

);

}

////////////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////////////

const container={
background:"#0f0f12",
minHeight:"100vh",
padding:"40px",
color:"white"
};

const heading={
marginBottom:"20px",
color:"#8b5cf6"
};

const topButtons={
display:"flex",
gap:"12px",
marginBottom:"20px"
};

const btn={
background:"#1a1a22",
color:"white",
border:"1px solid #333",
padding:"10px 18px",
borderRadius:"8px",
cursor:"pointer"
};

const activeBtn={
background:"#8b5cf6",
color:"white",
border:"none",
padding:"10px 18px",
borderRadius:"8px",
cursor:"pointer"
};

const filterBar={
display:"flex",
gap:"15px",
marginBottom:"30px",
flexWrap:"wrap"
};

const select={
padding:"10px",
background:"#1a1a22",
color:"white",
border:"1px solid #333",
borderRadius:"8px"
};

const grid={
display:"grid",
gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",
gap:"20px"
};

const card={
background:"#1a1a22",
padding:"20px",
borderRadius:"14px",
cursor:"pointer",
boxShadow:"0 5px 20px rgba(0,0,0,0.4)"
};

const meta={
opacity:0.7,
marginTop:"8px"
};

const pattern={
marginTop:"8px",
fontSize:"14px",
color:"#a78bfa"
};

const bottomRow={
marginTop:"15px",
display:"flex",
justifyContent:"space-between",
fontSize:"13px",
opacity:0.7
};

const loadingStyle={
background:"#0f0f12",
height:"100vh",
display:"flex",
justifyContent:"center",
alignItems:"center",
color:"white"
};

export default ViewBugs;