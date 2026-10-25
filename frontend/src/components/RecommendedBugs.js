import { useEffect,useState } from "react";
import { useAuth } from "../context/Authcontext";
import { fetchRecommendedBugs } from "../api/recommendations";

function RecommendedBugs(){

const [bugs,setBugs] = useState([]);
const { user } = useAuth();

useEffect(()=>{

fetchRecommendations();

},[]);

const fetchRecommendations = async ()=>{

try{

const result = await fetchRecommendedBugs(user);
setBugs(result.bugs);

}catch(err){

if (err.response?.status !== 401) {
  console.error("Recommendation fetch error:",err);
}

}

};

return(

<div style={container}>

<h2>Recommended for you</h2>

{!user ? (
<p>Sign in to see your recommendations.</p>
) : bugs.length === 0 ? (

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
