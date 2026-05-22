import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminLogin() {

  const [email,setEmail] = useState("admin@debugdsa.com");
  const [password,setPassword] = useState("admin123");
  const [loading,setLoading] = useState(false);

  const navigate = useNavigate();

  const loginAdmin = async () => {

    setLoading(true);

    try {

      const res = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await res.json();

      if(data.success){

        localStorage.setItem("adminToken",data.token);
        localStorage.setItem("admin",JSON.stringify(data.admin));

        navigate("/admin/dashboard");

      }else{

        alert(data.message);

      }

    }catch(err){

      console.error(err);
      alert("Server error");

    }

    setLoading(false);

  };

  return(
    <div style={container}>

      <div style={box}>

        <h2>Admin Login</h2>

        <input
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          style={input}
        />

        <input
          type="password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          style={input}
        />

        <button
          onClick={loginAdmin}
          style={btn}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p style={note}>
          admin@debugdsa.com / admin123
        </p>

      </div>

    </div>
  );

}

const container={
  height:"100vh",
  display:"flex",
  justifyContent:"center",
  alignItems:"center",
  background:"#0f0f12"
}

const box={
  background:"#1e1e2f",
  padding:"40px",
  borderRadius:"10px",
  width:"300px",
  textAlign:"center"
}

const input={
  width:"100%",
  padding:"10px",
  marginBottom:"15px",
  borderRadius:"5px",
  border:"1px solid #444",
  background:"#0f0f12",
  color:"white"
}

const btn={
  width:"100%",
  padding:"10px",
  background:"#8b5cf6",
  color:"white",
  border:"none",
  borderRadius:"5px",
  cursor:"pointer"
}

const note={
  marginTop:"15px",
  fontSize:"12px",
  color:"#aaa"
}

export default AdminLogin;