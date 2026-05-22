import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axiosInstance from "../api/axiosInstance";
import { useNavigate } from "react-router-dom";

function Battles() {

  const [battles,setBattles] = useState([]);
  const [loading,setLoading] = useState(true);

  const navigate = useNavigate();

  ////////////////////////////////////////////////////////
  // LOAD BATTLES
  ////////////////////////////////////////////////////////

  useEffect(()=>{

    const fetchBattles = async ()=>{

      try{

        const res = await axiosInstance.get("/battles");
        setBattles(res.data);

      }catch(err){

        console.error("Failed to fetch battles",err);

      }finally{

        setLoading(false);

      }

    };

    fetchBattles();

  },[]);

  ////////////////////////////////////////////////////////
  // JOIN BATTLE
  ////////////////////////////////////////////////////////

  const joinBattle = async (battleId)=>{

    try{

      await axiosInstance.post(`/battles/join/${battleId}`);
      navigate(`/battle/${battleId}`);

    }catch(err){

      console.error("Join battle failed",err);

    }

  };

  ////////////////////////////////////////////////////////
  // SPLIT BATTLES
  ////////////////////////////////////////////////////////

  const liveBattles = battles.filter(b=>b.status==="LIVE");
  const upcomingBattles = battles.filter(b=>b.status==="UPCOMING");
  const finishedBattles = battles.filter(b=>b.status==="FINISHED");

  ////////////////////////////////////////////////////////
  // LOADING SCREEN
  ////////////////////////////////////////////////////////

  if(loading){

    return(

      <div style={loadingScreen}>

        <motion.h2
        animate={{opacity:[0.3,1,0.3]}}
        transition={{repeat:Infinity,duration:1.5}}
        style={{color:"#a78bfa"}}
        >
        Loading Battles...
        </motion.h2>

      </div>

    );

  }

  return(

    <div style={container}>

      <h1 style={heading}>⚔️ Debug Battles</h1>

      <div style={leaderboardContainer}>

        <motion.button
        style={leaderboardButton}
        whileHover={{scale:1.05}}
        whileTap={{scale:0.95}}
        onClick={()=>navigate("/battle-leaderboard")}
        >
        🏆 Global Battle Rankings
        </motion.button>

      </div>

      <Section
      title="🔥 Live Battles"
      battles={liveBattles}
      badge="LIVE"
      badgeStyle={liveBadge}
      joinBattle={joinBattle}
      />

      <Section
      title="⏳ Upcoming Battles"
      battles={upcomingBattles}
      badge="UPCOMING"
      badgeStyle={upcomingBadge}
      />

      <Section
      title="🏁 Completed Battles"
      battles={finishedBattles}
      badge="COMPLETED"
      badgeStyle={completedBadge}
      completed
      />

    </div>

  );

}

//////////////////////////////////////////////////////////
// SECTION COMPONENT
//////////////////////////////////////////////////////////

function Section({title,battles,badge,badgeStyle,joinBattle,completed}){

  const navigate = useNavigate();

  const formatDate = (date)=>{

    return new Date(date).toLocaleDateString(undefined,{
      year:"numeric",
      month:"short",
      day:"numeric"
    });

  };

  const formatTime = (date)=>{

    return new Date(date).toLocaleTimeString(undefined,{
      hour:"2-digit",
      minute:"2-digit"
    });

  };

  return(

    <>

    <h2 style={sectionTitle}>{title}</h2>

    {battles.length===0 ? (

      <p style={empty}>No battles available</p>

    ):(

      <div style={grid}>

        {battles.map((battle)=>(

          <motion.div
          key={battle._id}
          style={card}
          initial={{opacity:0,y:10}}
          animate={{opacity:1,y:0}}
          whileHover={{
            scale:1.05,
            y:-6,
            boxShadow:"0 20px 50px rgba(124,58,237,0.4)"
          }}
          transition={{duration:0.25}}
          >

            <div style={cardHeader}>

              <h3 style={cardTitle}>{battle.title}</h3>

              <motion.span
              style={badgeStyle}
              animate={{scale:[1,1.15,1]}}
              transition={{repeat:Infinity,duration:2}}
              >
              {badge}
              </motion.span>

            </div>

            <div style={meta}>
              {battle.language} • {battle.topic}
            </div>

            <p style={description}>{battle.description}</p>

            <div style={timeContainer}>

              <div style={timeRow}>
                📅 {formatDate(battle.startTime)}
              </div>

              <div style={timeRow}>
                🕒 {formatTime(battle.startTime)}
              </div>

            </div>

            {joinBattle && (

              <motion.button
              style={primaryButton}
              whileHover={{
                scale:1.05,
                boxShadow:"0 10px 30px rgba(124,58,237,0.6)"
              }}
              whileTap={{scale:0.95}}
              onClick={()=>joinBattle(battle._id)}
              >
              Enter Battle
              </motion.button>

            )}

            {completed && (

              <div style={buttonGroup}>

                <motion.button
                style={violetButton}
                whileHover={{
                  scale:1.05,
                  boxShadow:"0 8px 20px rgba(124,58,237,0.35)"
                }}
                whileTap={{scale:0.96}}
                onClick={()=>navigate(`/battle/${battle._id}?tab=submissions`)}
                >
                Submissions
                </motion.button>

                <motion.button
                style={violetButton}
                whileHover={{
                  scale:1.05,
                  boxShadow:"0 8px 20px rgba(124,58,237,0.35)"
                }}
                whileTap={{scale:0.96}}
                onClick={()=>navigate(`/battle/${battle._id}?tab=leaderboard`)}
                >
                Leaderboard
                </motion.button>

              </div>

            )}

          </motion.div>

        ))}

      </div>

    )}

    </>

  );

}

//////////////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////////////

const container={
background:"#0f0f12",
minHeight:"100vh",
padding:"50px 40px",
color:"white"
};

const heading={
marginBottom:"15px",
color:"#a78bfa",
fontSize:"34px",
fontWeight:"600"
};

const leaderboardContainer={
marginBottom:"40px"
};

const leaderboardButton={
padding:"10px 20px",
background:"linear-gradient(90deg,#7c3aed,#a78bfa)",
border:"none",
borderRadius:"8px",
color:"white",
cursor:"pointer",
fontWeight:"500"
};

const sectionTitle={
marginTop:"40px",
marginBottom:"20px",
color:"#c084fc",
fontWeight:"500",
fontSize:"20px"
};

const empty={
opacity:0.7,
fontStyle:"italic"
};

const grid={
display:"grid",
gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",
gap:"22px"
};

const card={
background:"#18181b",
padding:"24px",
borderRadius:"16px",
border:"1px solid rgba(167,139,250,0.15)",
transition:"0.25s",
cursor:"pointer"
};

const cardHeader={
display:"flex",
justifyContent:"space-between",
alignItems:"center"
};

const cardTitle={
color:"#a78bfa",
fontSize:"18px",
fontWeight:"600"
};

const meta={
marginTop:"6px",
opacity:0.7,
fontSize:"14px"
};

const description={
marginTop:"10px",
fontSize:"14px",
opacity:0.9,
lineHeight:"1.5"
};

const timeContainer={
marginTop:"15px",
background:"#1f1f25",
padding:"10px",
borderRadius:"8px",
fontSize:"13px",
display:"flex",
flexDirection:"column",
gap:"3px"
};

const timeRow={
opacity:0.8
};

const primaryButton={
marginTop:"18px",
padding:"10px",
background:"linear-gradient(90deg,#7c3aed,#a78bfa)",
border:"none",
borderRadius:"8px",
color:"white",
cursor:"pointer",
width:"100%",
fontWeight:"500"
};

const violetButton={
padding:"9px 14px",
background:"transparent",
border:"1px solid #8b5cf6",
borderRadius:"999px",
color:"#c4b5fd",
cursor:"pointer",
fontWeight:"500",
fontSize:"13px",
transition:"0.25s",
flex:1
};

const buttonGroup={
display:"flex",
gap:"8px",
marginTop:"16px"
};

const liveBadge={
background:"#22c55e",
padding:"4px 9px",
borderRadius:"6px",
fontSize:"11px",
fontWeight:"500"
};

const upcomingBadge={
background:"#f59e0b",
padding:"4px 9px",
borderRadius:"6px",
fontSize:"11px",
fontWeight:"500"
};

const completedBadge={
background:"#64748b",
padding:"4px 9px",
borderRadius:"6px",
fontSize:"11px",
fontWeight:"500"
};

const loadingScreen={
height:"100vh",
display:"flex",
justifyContent:"center",
alignItems:"center",
background:"#0f0f12"
};

export default Battles;