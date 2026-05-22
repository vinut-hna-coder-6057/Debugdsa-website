import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { motion } from "framer-motion";

function ProfileFollowing(){

  const [following,setFollowing] = useState([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{

    const fetchFollowing = async ()=>{

      try{

        const res = await axiosInstance.get("/users/following");
        setFollowing(res.data);

      }catch(err){
        console.error(err);
      }finally{
        setLoading(false);
      }

    };

    fetchFollowing();

  },[]);

  if(loading) return <div style={container}>Loading following...</div>;

  return(

    <div style={container}>

      <h1 style={heading}>➡️ Following</h1>

      {following.length === 0 ? (
        <p>You are not following anyone yet.</p>
      ) : (

        following.map((user,i)=>(
          <motion.div
            key={user._id}
            style={card}
            initial={{opacity:0,y:20}}
            animate={{opacity:1,y:0}}
            transition={{delay:i*0.05}}
          >

            <h3>{user.name}</h3>
            <p>Points: {user.points}</p>
            <p>Bugs Solved: {user.bugsSolved}</p>

          </motion.div>
        ))

      )}

    </div>

  );

}

const container={
  padding:"40px",
  background:"#0f0f12",
  minHeight:"100vh",
  color:"white"
};

const heading={
  marginBottom:"30px"
};

const card={
  background:"#1a1a1f",
  padding:"20px",
  marginBottom:"15px",
  borderRadius:"10px"
};

export default ProfileFollowing;