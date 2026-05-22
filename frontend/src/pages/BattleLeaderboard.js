import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

function BattleLeaderboard(){

const [users,setUsers] = useState([]);
const [loading,setLoading] = useState(true);

//////////////////////////////////////////////////////
// FETCH LEADERBOARD
//////////////////////////////////////////////////////

useEffect(()=>{

fetchLeaderboard();

},[]);

const fetchLeaderboard = async ()=>{

try{

const res = await axiosInstance.get("/battles/global-leaderboard");

setUsers(res.data);

}catch(err){

console.error("Leaderboard fetch error:",err);

}

setLoading(false);

};

//////////////////////////////////////////////////////
// LOADING
//////////////////////////////////////////////////////

if(loading){
return(
<div style={container}>
Loading leaderboard...
</div>
);
}

//////////////////////////////////////////////////////
// UI
//////////////////////////////////////////////////////

return(

<div style={container}>

<h1 style={title}>⚔️ Battle Leaderboard</h1>

{users.length === 0 && (
<p>No rankings yet</p>
)}

<table style={table}>

<thead>
<tr>
<th style={th}>Rank</th>
<th style={th}>User</th>
<th style={th}>Battle Points</th>
</tr>
</thead>

<tbody>

{users.map((user,index)=>(
<tr key={user._id}>

<td style={td}>{index+1}</td>
<td style={td}>{user.name}</td>
<td style={td}>{user.battlePoints}</td>

</tr>
))}

</tbody>

</table>

</div>

);

}

//////////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////////

const container={
padding:"120px 40px",
background:"#0f0f12",
minHeight:"100vh",
color:"white"
};

const title={
color:"#8b5cf6",
marginBottom:"30px"
};

const table={
width:"100%",
borderCollapse:"collapse",
background:"#1f1f2e"
};

const th={
padding:"12px",
borderBottom:"1px solid #333",
textAlign:"left"
};

const td={
padding:"12px",
borderBottom:"1px solid #222"
};

export default BattleLeaderboard;