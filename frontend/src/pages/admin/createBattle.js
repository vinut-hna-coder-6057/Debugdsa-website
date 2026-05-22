import { useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import CodeEditor from "../../components/CodeEditor";
import Countdown from "react-countdown";
function CreateBattle(){

const [form,setForm] = useState({

title:"",
language:"",
topic:"",
pattern:"",
buggyCode:"",
description:"",
expectedOutput:"",
duration:60,
startDate:"",
startTime:""

});

const [message,setMessage] = useState("");

const handleChange = (field,value)=>{
setForm(prev=>({...prev,[field]:value}));
};

//////////////////////////////////////////////////
// CREATE BATTLE
//////////////////////////////////////////////////

const createBattle = async ()=>{
const start = new Date(
`${form.startDate}T${form.startTime}`
);

const end = new Date(
start.getTime() + form.duration * 60000
);
try{

await axiosInstance.post("/admin/battles",{

...form,

startTime:start,
endTime:end

});

setMessage("Battle created successfully");

}catch(err){

console.error(err);

setMessage("Error creating battle");

}

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

<input
style={input}
placeholder="Language"
value={form.language}
onChange={(e)=>handleChange("language",e.target.value)}
/>

<input
style={input}
placeholder="Topic"
value={form.topic}
onChange={(e)=>handleChange("topic",e.target.value)}
/>

<input
style={input}
placeholder="Pattern"
value={form.pattern}
onChange={(e)=>handleChange("pattern",e.target.value)}
/>

<textarea
style={input}
placeholder="Problem description"
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
placeholder="Expected output"
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
placeholder="Duration (minutes)"
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
Create Battle
</button>

<p>{message}</p>

</div>

);

}
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

export default CreateBattle;