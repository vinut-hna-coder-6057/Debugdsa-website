import { useEffect, useState } from "react";
import axios from "axios";

function AdminSubmissions(){

const [subs,setSubs] = useState([]);

////////////////////////////////////////////////////////
// LOAD SUBMISSIONS
////////////////////////////////////////////////////////

useEffect(()=>{
fetchSubs();
},[])

const fetchSubs = async ()=>{

try{

  const res = await axios.get(
    "http://localhost:5000/api/admin/submissions",
    {
      withCredentials:true
    }
  );

  setSubs(res.data);

}catch(err){

  console.error("Fetch submissions error:",err);

}

}

////////////////////////////////////////////////////////
// DELETE SUBMISSION
////////////////////////////////////////////////////////

const deleteSub = async(id)=>{

try{

  await axios.delete(
    `http://localhost:5000/api/admin/submissions/${id}`,
    {
      withCredentials:true
    }
  );

  fetchSubs();

}catch(err){

  console.error("Delete submission error:",err);

}

}

////////////////////////////////////////////////////////

return( <div style={container}>

  <h1 style={title}>Manage Submissions</h1>

  {subs.length === 0 && <p style={emptyText}>No submissions found</p>}

  {subs.map(sub=>(

    <div key={sub._id} style={card}>

      <p style={subText}>
        User: {sub.solvedBy?.name || "Unknown"}
      </p>

      <p style={subText}>
        Bug: {sub.bugId?.title || "Unknown Bug"}
      </p>

      <button
        style={deleteBtn}
        onClick={()=>deleteSub(sub._id)}
      >
        Delete
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

const subText={
color:"#94a3b8",
marginBottom:"5px"
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

export default AdminSubmissions;
