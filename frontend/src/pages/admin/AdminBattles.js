import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import CodeEditor from "../../components/CodeEditor";
import Countdown from "react-countdown";

const LANGUAGES = ["JavaScript","Python","Java","C++"];

function AdminBattles(){

const navigate = useNavigate();

const [battles,setBattles] = useState([]);

const [form,setForm] = useState({

title:"",
language:"",
topic:"",
description:"",
buggyCode:"",
expectedOutput:"",
duration:60,
startDate:"",
startTime:""

});

//////////////////////////////////////////////////
// FETCH BATTLES
//////////////////////////////////////////////////

useEffect(()=>{
fetchBattles();
},[]);

const fetchBattles = async ()=>{

try{

const res = await axiosInstance.get("/admin/battles");

setBattles(res.data);

}catch(err){

console.error(err);

}

};

//////////////////////////////////////////////////
// HANDLE CHANGE
//////////////////////////////////////////////////

const handleChange = (field,value)=>{

setForm(prev=>({...prev,[field]:value}));

};

//////////////////////////////////////////////////
// CREATE BATTLE
//////////////////////////////////////////////////

const createBattle = async ()=>{

const {title,language,topic,description,buggyCode,expectedOutput,duration} = form;

if(!title || !language || !topic || !buggyCode || !description){

alert("Please fill all required fields");

return;

}

try{

await axiosInstance.post("/admin/battles",{

title:form.title,
language:form.language,
topic:form.topic,
description:form.description,
buggyCode:form.buggyCode,
expectedOutput:form.expectedOutput,
duration:form.duration,

//////////////////////////////////////////////////
// COMBINED DATE + TIME
//////////////////////////////////////////////////

startTime:`${form.startDate}T${form.startTime}`

});

setForm({

title:"",
language:"",
topic:"",
description:"",
buggyCode:"",
expectedOutput:"",
duration:60,
startDate:"",
startTime:""

});

fetchBattles();

}catch(err){

console.error("Create battle error:",err);

}

};

//////////////////////////////////////////////////
// DELETE BATTLE
//////////////////////////////////////////////////

const deleteBattle = async (id)=>{

try{

await axiosInstance.delete(`/admin/battles/${id}`);

fetchBattles();

}catch(err){

console.error(err);

}

};

//////////////////////////////////////////////////
// OPEN SUBMISSIONS PAGE
//////////////////////////////////////////////////

const openSubmissions = (battleId)=>{

navigate(`/admin/battle/${battleId}`);

};

//////////////////////////////////////////////////
// UI
//////////////////////////////////////////////////

return(

<div style={container}>

<h1 style={heading}>Create Debug Battle</h1>

<input
style={input}
placeholder="Battle Title"
value={form.title}
onChange={(e)=>handleChange("title",e.target.value)}
/>

<select
style={input}
value={form.language}
onChange={(e)=>handleChange("language",e.target.value)}
>

<option value="">Select Language</option>

{LANGUAGES.map(lang=>(
<option key={lang} value={lang}>{lang}</option>
))}

</select>

<input
style={input}
placeholder="Topic"
value={form.topic}
onChange={(e)=>handleChange("topic",e.target.value)}
/>

<textarea
style={input}
placeholder="Describe the problem"
value={form.description}
onChange={(e)=>handleChange("description",e.target.value)}
/>

<div style={{marginTop:"15px"}}>

<CodeEditor
language={form.language}
code={form.buggyCode}
setCode={(value)=>handleChange("buggyCode",value)}
/>

</div>

<textarea
style={input}
placeholder="Expected Output"
value={form.expectedOutput}
onChange={(e)=>handleChange("expectedOutput",e.target.value)}
/>
<input
style={input}
type="date"
value={form.startDate}
onChange={(e)=>handleChange("startDate",e.target.value)}
/>

<input
style={input}
type="time"
value={form.startTime}
onChange={(e)=>handleChange("startTime",e.target.value)}
/>
<input
style={input}
type="number"
placeholder="Battle Duration (minutes)"
value={form.duration}
onChange={(e)=>handleChange("duration",e.target.value)}
/>
<div style={timerCard}>

<h2>⚔️ Battle Timer</h2>

<p>
{form.startDate} at {form.startTime}
</p>

<h1>
{form.duration} MIN
</h1>

<div style={countdownStyle}>

<Countdown
date={new Date(`${form.startDate}T${form.startTime}`)}
/>

</div>

</div>
<button style={button} onClick={createBattle}>
Post Battle 🚀
</button>

<h2 style={{marginTop:"40px"}}>Existing Battles</h2>

{battles.length === 0 && (
<p>No battles created yet</p>
)}

{battles.map(b=>(
<div key={b._id} style={card}>

<h3>{b.title}</h3>

<p>{b.description}</p>

<p>Language: {b.language}</p>

<p>
Ends: {new Date(b.endTime).toLocaleString()}
</p>

<button
style={viewBtn}
onClick={()=>openSubmissions(b._id)}
>
View Submissions
</button>

<button
style={deleteBtn}
onClick={()=>deleteBattle(b._id)}
>
Delete
</button>

</div>
))}

</div>

);

}

//////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////

const container={
padding:"40px",
background:"#0f0f12",
minHeight:"100vh",
color:"white"
};

const heading={
color:"#8b5cf6",
marginBottom:"20px"
};

const input={
width:"100%",
padding:"12px",
marginTop:"10px",
background:"#1f1f25",
border:"1px solid #8b5cf6",
borderRadius:"6px",
color:"white"
};

const button={
marginTop:"20px",
padding:"12px",
background:"#8b5cf6",
border:"none",
borderRadius:"6px",
color:"white",
cursor:"pointer"
};
const timerCard={

marginTop:"20px",
padding:"25px",
borderRadius:"18px",
background:"linear-gradient(135deg,#8b5cf6,#00c6ff)",
textAlign:"center",
boxShadow:"0 0 30px rgba(139,92,246,0.6)",
color:"white"

};

const countdownStyle={

fontSize:"28px",
fontWeight:"bold",
marginTop:"15px",
color:"#fff",
textShadow:"0 0 20px rgba(255,255,255,0.8)"

};
const card={
background:"#1f1f25",
padding:"20px",
marginTop:"15px",
borderRadius:"10px"
};

const viewBtn={
marginTop:"10px",
marginRight:"10px",
background:"#22c55e",
color:"white",
border:"none",
padding:"8px 12px",
borderRadius:"6px",
cursor:"pointer"
};

const deleteBtn={
marginTop:"10px",
background:"#ef4444",
color:"white",
border:"none",
padding:"8px 12px",
borderRadius:"6px",
cursor:"pointer"
};

export default AdminBattles;