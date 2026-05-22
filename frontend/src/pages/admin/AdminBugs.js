import { useEffect, useState } from "react";
import axios from "axios";

function AdminBugs() {

const [bugs,setBugs] = useState([]);

////////////////////////////////////////////////////////
// LOAD BUGS
////////////////////////////////////////////////////////

useEffect(()=>{
fetchBugs();
},[])

const fetchBugs = async () =>{

try{

  const res = await axios.get(
    "http://localhost:5000/api/admin/bugs",
    {
      withCredentials:true
    }
  );

  setBugs(res.data);

}catch(err){

  console.error("Fetch bugs error:",err);

}

}

////////////////////////////////////////////////////////
// DELETE BUG
////////////////////////////////////////////////////////

const deleteBug = async(id)=>{

try{

  await axios.delete(
    `http://localhost:5000/api/admin/bugs/${id}`,
    {
      withCredentials:true
    }
  );

  fetchBugs();

}catch(err){

  console.error("Delete bug error:",err);

}

}

////////////////////////////////////////////////////////

return( <div style={container}>

  <h1 style={title}>Manage Bugs</h1>

  {bugs.length === 0 && <p style={emptyText}>No bugs found</p>}

  {bugs.map(bug=>(
    <div key={bug._id} style={card}>

      <h3 style={bugTitle}>{bug.title}</h3>

      <p style={bugText}>
        Difficulty: {bug.difficulty || "Not specified"}
      </p>

      <button 
        style={deleteBtn}
        onClick={()=>deleteBug(bug._id)}
      >
        Delete Bug
      </button>

    </div>
  ))}

</div>

)
}

////////////////////////////////////////////////////////

const container={
padding:"40px",
background:"#0f0f12",
minHeight:"100vh",
color:"#e2e8f0"
}

const title={
color:"#8b5cf6",
marginBottom:"20px"
}

const card={
background:"#1f1f25",
padding:"20px",
margin:"15px 0",
borderRadius:"10px",
border:"1px solid rgba(139,92,246,0.3)"
}

const bugTitle={
color:"#c084fc",
marginBottom:"5px"
}

const bugText={
color:"#94a3b8"
}

const emptyText={
color:"#94a3b8"
}

const deleteBtn={
marginTop:"10px",
padding:"8px 14px",
background:"#8b5cf6",
border:"none",
borderRadius:"6px",
color:"#e2e8f0",
cursor:"pointer",
boxShadow:"0 0 10px rgba(139,92,246,0.5)"
}

export default AdminBugs;
