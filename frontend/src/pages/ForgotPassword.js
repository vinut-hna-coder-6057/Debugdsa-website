import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {

const [email,setEmail] = useState("");
const [message,setMessage] = useState("");
const [loading,setLoading] = useState(false);
const [success,setSuccess] = useState(false);

const navigate = useNavigate();

const handleSubmit = async (e) => {

e.preventDefault();

try {

setLoading(true);

const res = await axios.post(
"http://192.168.0.9:5000/api/auth/forgot-password",
{ email }
);

setMessage(res.data.message);

setSuccess(true);

setTimeout(() => {

navigate("/login");

}, 3000);

} catch(err){

setMessage(
err.response?.data?.message ||
"Something went wrong"
);

} finally {

setLoading(false);

}

};

return(

<div style={container}>

<motion.div
style={card}
initial={{ opacity:0, y:40 }}
animate={{ opacity:1, y:0 }}
transition={{ duration:0.5 }}
>

{success ? (

<>

<div style={successIcon}>
✅
</div>

<h1 style={title}>
Reset Link Sent
</h1>

<p style={successText}>
Password reset link has been sent to your email.
</p>

<p style={redirectText}>
Redirecting to login page...
</p>

</>

) : (

<>

<h1 style={title}>
Forgot Password
</h1>

<p style={subtitle}>
Enter your email to receive reset link
</p>

<form onSubmit={handleSubmit}>

<input
type="email"
placeholder="Enter your email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
required
style={input}
/>

<motion.button
type="submit"
style={button}
whileHover={{ scale:1.03 }}
whileTap={{ scale:0.97 }}
disabled={loading}
>

{loading ? "Sending..." : "Send Reset Link"}

</motion.button>

</form>

{message && (
<p style={errorText}>
{message}
</p>
)}

</>

)}

</motion.div>

</div>

);

}

////////////////////////////////////////////////////

const container = {

minHeight:"100vh",
display:"flex",
justifyContent:"center",
alignItems:"center",
background:"#050510",
padding:"20px"

};

const card = {

width:"420px",
background:"rgba(20,20,35,0.95)",
padding:"40px",
borderRadius:"24px",
boxShadow:"0 0 40px rgba(139,92,246,0.3)",
border:"1px solid rgba(139,92,246,0.2)",
color:"white",
textAlign:"center"

};

const title = {

fontSize:"38px",
fontWeight:"700",
marginBottom:"10px",
color:"#8b5cf6"

};

const subtitle = {

color:"#94a3b8",
marginBottom:"25px"

};

const input = {

width:"100%",
padding:"15px",
borderRadius:"12px",
border:"1px solid #8b5cf6",
background:"#111827",
color:"white",
fontSize:"15px",
marginBottom:"20px",
outline:"none",
boxSizing:"border-box"

};

const button = {

width:"100%",
padding:"15px",
borderRadius:"12px",
border:"none",
background:"linear-gradient(135deg,#8b5cf6,#7c3aed)",
color:"white",
fontSize:"16px",
fontWeight:"600",
cursor:"pointer",
boxShadow:"0 0 20px rgba(139,92,246,0.4)"

};

const successIcon = {

fontSize:"70px",
marginBottom:"15px"

};

const successText = {

fontSize:"17px",
color:"#cbd5e1",
marginTop:"15px"

};

const redirectText = {

marginTop:"25px",
color:"#8b5cf6",
fontSize:"14px"

};

const errorText = {

marginTop:"18px",
color:"#ef4444"

};

export default ForgotPassword;