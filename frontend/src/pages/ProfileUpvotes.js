import { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";
import { motion } from "framer-motion";

function ProfileUpvotes(){

  const [upvotes,setUpvotes] = useState([]);
  const [loading,setLoading] = useState(true);

  useEffect(()=>{

    const fetchUpvotes = async ()=>{

      try{

        const res = await axiosInstance.get("/users/upvotes");
        setUpvotes(res.data);

      }catch(err){
        console.error(err);
      }finally{
        setLoading(false);
      }

    };

    fetchUpvotes();

  },[]);

  if(loading) return <div style={container}>Loading upvotes...</div>;

  return(

    <div style={container}>

      <h1 style={heading}>👍 Upvotes Received</h1>

      {upvotes.length === 0 ? (
        <p>No upvotes yet.</p>
      ) : (

        upvotes.map((item,i)=>(
          <motion.div
            key={i}
            style={card}
            initial={{opacity:0,y:20}}
            animate={{opacity:1,y:0}}
            transition={{delay:i*0.05}}
          >

            <h3>{item.bugTitle}</h3>
            <p>Upvotes: {item.upvotes}</p>

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

export default ProfileUpvotes;