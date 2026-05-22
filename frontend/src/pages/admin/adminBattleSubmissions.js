import { useEffect,useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";

function AdminBattleSubmissions(){

const { id } = useParams();

const [submissions,setSubmissions] = useState([]);

useEffect(()=>{
fetchSubmissions();
},[]);

////////////////////////////////////////////////////
// FETCH SUBMISSIONS
////////////////////////////////////////////////////

const fetchSubmissions = async ()=>{

try{

const res = await axiosInstance.get(`/admin/battles/${id}/submissions`);

setSubmissions(res.data);

}catch(err){

console.error("Fetch submissions error:",err);

}

};

////////////////////////////////////////////////////
// REVIEW SUBMISSION
////////////////////////////////////////////////////

const reviewSubmission = async (submissionId,status)=>{

try{

await axiosInstance.post(`/admin/battles/${id}/review`,{
submissionId,
status
});

fetchSubmissions();

}catch(err){

console.error("Review error:",err);

}

};

////////////////////////////////////////////////////
// UI
////////////////////////////////////////////////////

return(

<div style={container}>

<h1 style={title}>Battle Submissions</h1>

{submissions.length === 0 && (
<p>No submissions yet</p>
)}

{submissions.map(s=>(
<div key={s._id} style={card}>

<h3>User: {s.user?.name}</h3>

<pre style={code}>{s.code}</pre>

<p>Status: {s.status}</p>

<button
style={acceptBtn}
onClick={()=>reviewSubmission(s._id,"accepted")}
>
Accept
</button>

<button
style={rejectBtn}
onClick={()=>reviewSubmission(s._id,"rejected")}
>
Reject
</button>

</div>
))}

</div>

);

}

////////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////////

const container={
padding:"40px",
background:"#0f0f12",
minHeight:"100vh",
color:"#e2e8f0"
};

const title={
color:"#8b5cf6",
marginBottom:"20px"
};

const card={
background:"#1f1f25",
padding:"20px",
marginBottom:"20px",
borderRadius:"10px"
};

const code={
background:"#0f172a",
padding:"10px",
color:"#22c55e"
};

const acceptBtn={
marginRight:"10px",
background:"#22c55e",
border:"none",
padding:"8px 14px",
borderRadius:"6px",
color:"white",
cursor:"pointer"
};

const rejectBtn={
background:"#ef4444",
border:"none",
padding:"8px 14px",
borderRadius:"6px",
color:"white",
cursor:"pointer"
};

export default AdminBattleSubmissions;