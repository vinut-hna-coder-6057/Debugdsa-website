import { useEffect, useState } from "react";
import axios from "axios";

function AdminUsers(){

const [users,setUsers] = useState([]);

////////////////////////////////////////////////////////
// LOAD USERS
////////////////////////////////////////////////////////

useEffect(()=>{
fetchUsers();
},[]);

const fetchUsers = async ()=>{

try{

  const res = await axios.get(
    "http://localhost:5000/api/admin/users",
    {
      withCredentials:true
    }
  );

  setUsers(res.data.users);

}catch(err){

  console.error("Fetch users error:",err);

}


};

////////////////////////////////////////////////////////
// DELETE USER
////////////////////////////////////////////////////////

const deleteUser = async(id)=>{


try{

  await axios.delete(
    `http://localhost:5000/api/admin/user/${id}`,
    {
      withCredentials:true
    }
  );

  fetchUsers();

}catch(err){

  console.error("Delete user error:",err);

}

};

////////////////////////////////////////////////////////

return(

<div style={container}>

  <h1 style={title}>Manage Users</h1>

  {users.length === 0 && <p style={emptyText}>No users found</p>}

  {users.map(user=>(

    <div key={user._id} style={card}>

      <p style={userText}>
        Name: {user.name}
      </p>

      <p style={userText}>
        Email: {user.email}
      </p>

      <button
        style={deleteBtn}
        onClick={()=>deleteUser(user._id)}
      >
        Delete
      </button>

    </div>

  ))}

</div>

);

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

const userText={
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

export default AdminUsers;
