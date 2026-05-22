
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useContext } from "react";
import { AuthContext } from "../context/Authcontext";
import heroImage from "../assets/dsaaa.png";
import RecommendedBugs from "../components/RecommendedBugs";

function Home() {

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const handleCTA = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <div style={{ background:"#0f0f12", color:"#e2e8f0" }}>

      {/* HERO SECTION */}
      <section style={heroSection}>

        <img src={heroImage} alt="Debug Illustration" style={heroImageStyle} />
        <div style={overlay}></div>

        <div style={glow1}></div>
        <div style={glow2}></div>

        <motion.div
          style={heroContent}
          initial={{ opacity:0, y:60 }}
          animate={{ opacity:1, y:0 }}
        >

          <div>

            <h1 style={title}>
              Debug Like a Pro 🚀 <br/>
              Not Just Code
            </h1>

            <p style={subtitle}>
              Real bugs. Real thinking. Real engineering skills.
            </p>

            <motion.button
              whileHover={{ scale:1.08 }}
              style={ctaButton}
              onClick={handleCTA}
            >
              {user ? "Go to Dashboard →" : "Start Debugging →"}
            </motion.button>

          </div>

        </motion.div>

      </section>


      {/* STATS */}
      <section style={statsSection}>

        <Stat number="10K+" label="Bugs Solved" />
        <Stat number="5K+" label="Developers" />
        <Stat number="1K+" label="Daily Users" />

      </section>


      {/* WHY DEBUGHUB */}
      <section style={section}>

        <h2 style={sectionTitle}>Why DebugHub?</h2>

        <div style={grid}>

          <Card
            title="🧠 Think Like Engineer"
            desc="Not just solving problems — understanding failures."
          />

          <Card
            title="🔥 Real Bug Scenarios"
            desc="Learn from real-world coding mistakes."
          />

          <Card
            title="🏆 Competitive Learning"
            desc="Leaderboard + rewards system."
          />

        </div>

      </section>


      {/* FEATURES */}
      <section style={featureSection}>

        <h2 style={sectionTitle}>Premium Features</h2>

        <div style={grid}>

          <Feature title="AI Debug Hints 🤖" />
          <Feature title="Upvote System 👍" />
          <Feature title="Difficulty Levels 🎯" />
          <Feature title="Trending Bugs 🚀" />

        </div>

      </section>


      {/* RECOMMENDED BUGS */}
      {user && (
        <section style={recommendSection}>

          <h2 style={sectionTitle}>Recommended For You</h2>

          <RecommendedBugs />

        </section>
      )}


      {/* CTA */}
      <section style={ctaSection}>

        <h2 style={ctaTitle}>
          Become a Top Debugger Today 💎
        </h2>

        <motion.button
          whileHover={{ scale:1.05 }}
          style={ctaFinal}
          onClick={handleCTA}
        >
          {user ? "Open Dashboard 🚀" : "Join Now 🚀"}
        </motion.button>

      </section>

    </div>
  );
}


/* ================= COMPONENTS ================= */

function Card({ title, desc }) {
  return (
    <motion.div style={card} whileHover={{ scale:1.05 }}>
      <h3 style={cardTitle}>{title}</h3>
      <p style={cardDesc}>{desc}</p>
    </motion.div>
  );
}

function Feature({ title }) {
  return (
    <motion.div style={featureCard} whileHover={{ scale:1.05 }}>
      {title}
    </motion.div>
  );
}

function Stat({ number, label }) {
  return (
    <motion.div
      initial={{ opacity:0, y:40 }}
      whileInView={{ opacity:1, y:0 }}
      viewport={{ once:true }}
      style={statCard}
    >
      <h2 style={{ color:"#8b5cf6" }}>{number}</h2>
      <p>{label}</p>
    </motion.div>
  );
}


/* ================= STYLES ================= */

const heroSection = {
  height:"calc(100vh - 70px)",
  position:"relative",
  overflow:"hidden"
};

const heroImageStyle = {
  position:"absolute",
  width:"100%",
  height:"100%",
  objectFit:"cover"
};

const overlay = {
  position:"absolute",
  width:"100%",
  height:"100%",
  background:"rgba(15,15,18,0.85)"
};

const glow1 = {
  position:"absolute",
  width:"400px",
  height:"400px",
  background:"#8b5cf6",
  filter:"blur(150px)",
  top:"-100px",
  left:"-100px",
  opacity:0.4
};

const glow2 = {
  position:"absolute",
  width:"300px",
  height:"300px",
  background:"#c084fc",
  filter:"blur(150px)",
  bottom:"-100px",
  right:"-100px",
  opacity:0.4
};

const heroContent = {
  position:"relative",
  zIndex:2,
  height:"100%",
  display:"flex",
  alignItems:"center",
  paddingLeft:"8%"
};

const title = {
  fontSize:"64px",
  fontWeight:"800",
  background:"linear-gradient(to right,#c084fc,#8b5cf6)",
  WebkitBackgroundClip:"text",
  WebkitTextFillColor:"transparent"
};

const subtitle = {
  marginTop:"20px",
  fontSize:"20px"
};

const ctaButton = {
  marginTop:"40px",
  padding:"18px 50px",
  background:"#8b5cf6",
  borderRadius:"50px",
  border:"none",
  color:"white",
  cursor:"pointer",
  boxShadow:"0 0 30px rgba(139,92,246,0.6)"
};

const statsSection = {
  display:"flex",
  justifyContent:"space-around",
  padding:"60px",
  background:"#16161a"
};

const statCard = {
  textAlign:"center"
};

const section = {
  padding:"100px 10%",
  textAlign:"center"
};

const recommendSection = {
  padding:"80px 10%",
  background:"#0f0f12",
  textAlign:"center"
};

const featureSection = {
  padding:"100px 10%",
  background:"#16161a"
};

const sectionTitle = {
  fontSize:"40px",
  marginBottom:"40px"
};

const grid = {
  display:"grid",
  gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",
  gap:"30px"
};

const card = {
  background:"rgba(255,255,255,0.05)",
  padding:"40px",
  borderRadius:"20px"
};

const cardTitle = {
  color:"#8b5cf6",
  marginBottom:"15px"
};

const cardDesc = {
  color:"#94a3b8"
};

const featureCard = {
  background:"#1f1f25",
  padding:"30px",
  borderRadius:"15px",
  textAlign:"center"
};

const ctaSection = {
  padding:"120px",
  textAlign:"center"
};

const ctaTitle = {
  fontSize:"40px",
  marginBottom:"30px"
};

const ctaFinal = {
  padding:"18px 50px",
  background:"#8b5cf6",
  border:"none",
  borderRadius:"10px",
  color:"white",
  cursor:"pointer"
};

export default Home;
