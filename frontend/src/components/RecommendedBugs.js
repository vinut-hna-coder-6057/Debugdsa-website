import { useEffect,useState } from "react";
import axiosInstance from "../api/axiosInstance";

function RecommendedBugs(){

const [bugs,setBugs] = useState([]);

useEffect(()=>{

fetchRecommendations();

},[]);

const fetchRecommendations = async ()=>{

try{

const res = await axiosInstance.get("/recommendations/bugs");

setBugs(res.data);

}catch(err){

console.error("Recommendation fetch error:",err);

}

};

return(

<div style={container}>

<h2>Recommended for you</h2>

{bugs.length === 0 ? (

<p>No recommendations yet</p>

) : (

bugs.map(bug=>(
<div key={bug._id} style={card}>
<strong>{bug.title}</strong>
<p>{bug.topic}</p>
</div>
))

)}

</div>

);

}

const container={
background:"#1f1f25",
padding:"20px",
borderRadius:"10px",
marginTop:"20px"
}

const card={
padding:"10px",
background:"#0f172a",
marginBottom:"10px",
borderRadius:"6px"
}

export default RecommendedBugs;