import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "../context/Authcontext";
import { useNavigate } from "react-router-dom";
function Profile() {
  const { setUser } = useAuth();
const [following,setFollowing] = useState(false);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false); // ✅ NEW
  const [error, setError] = useState("");
  const navigate = useNavigate();
  ////////////////////////////////////////////////////////////
  //////////////////// LOAD PROFILE //////////////////////////
  ////////////////////////////////////////////////////////////

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axiosInstance.get("/users/me");

      setProfile(res.data.user);
      setStats(res.data.stats);
      setNameInput(res.data.user.name);
    } catch (err) {
      console.error(err);
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  ////////////////////////////////////////////////////////////
  //////////////////// SAVE PROFILE //////////////////////////
  ////////////////////////////////////////////////////////////

  const saveProfile = async () => {
    if (saving) return;

    try {
      setSaving(true);
      setError("");

      const res = await axiosInstance.put("/users/edit", {
        name: nameInput,
      });

      setProfile(res.data);
      setUser(res.data);
      setEditing(false);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
          "Failed to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  ////////////////////////////////////////////////////////////
  ////////////////// DOWNLOAD CERTIFICATE ////////////////////
  ////////////////////////////////////////////////////////////

  const downloadCertificate = async () => {
    if (downloading) return;

    try {
      setDownloading(true);

      const response = await axiosInstance.get(
        "/certificate/download",
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data])
      );

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${profile.name}-certificate.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Certificate not available"
      );
    } finally {
      setDownloading(false);
    }
  };

  ////////////////////////////////////////////////////////////
//////////////////// FOLLOW USER //////////////////////////
////////////////////////////////////////////////////////////

const handleFollow = async () => {

  try{

   if(following){

await axiosInstance.put(
`/users/unfollow/${profile._id}`
);

}else{

await axiosInstance.put(
`/users/follow/${profile._id}`
);

}

    setFollowing(!following);

    fetchProfile();

  }catch(err){

    console.error(err);

  }

};
  ////////////////////////////////////////////////////////////

  if (loading) {
    return <div style={container}>Loading profile...</div>;
  }

  if (!profile) {
    return <div style={container}>Profile not found</div>;
  }

  return (
    <div style={container}>
      {error && (
        <div style={{ color: "#ef4444", marginBottom: "15px" }}>
          {error}
        </div>
      )}

      <motion.div
        style={card}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={avatar}>
          {profile.name?.charAt(0)?.toUpperCase()}
        </div>

        {!editing ? (
          <>
            <h2 style={name}>{profile.name}</h2>
            <p style={email}>{profile.email}</p>
<motion.button
style={
following
? followingBtn
: followBtn
}
whileHover={{ scale: 1.05 }}
onClick={handleFollow}
>

{following ? "Following" : "Follow"}

</motion.button>
            <motion.button
              style={editBtn}
              whileHover={{ scale: 1.05 }}
              onClick={() => setEditing(true)}
            >
              Edit Name
            </motion.button>
          </>
        ) : (
          <>
            <input
              style={input}
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />

            <motion.button
              style={saveBtn}
              whileHover={{ scale: 1.05 }}
              onClick={saveProfile}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </motion.button>
          </>
        )}
      </motion.div>

      {/* ✅ CERTIFICATION SECTION WITH DOWNLOAD */}
      {stats?.certified && (
        <motion.div
          style={certificateCard}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h3>🏆 Certified Bug Solver</h3>
          <p>Level: {stats.certificationLevel}</p>
          <p>
            Awarded On:{" "}
            {new Date(
              stats.certificationDate
            ).toLocaleDateString()}
          </p>

          <motion.button
            style={downloadBtn}
            whileHover={{ scale: 1.05 }}
            onClick={downloadCertificate}
            disabled={downloading}
          >
            {downloading
              ? "Generating..."
              : "Download Certificate"}
          </motion.button>
        </motion.div>
      )}

      {stats && (
        <div style={statsContainer}>
          <StatCard
 title="Points"
 value={stats.points || 0}
 onClick={()=>navigate("/profile/points")}
/>

<StatCard
 title="Bugs Solved"
 value={stats.bugsSolved || 0}
 onClick={()=>navigate("/profile/bugs")}
/>

<StatCard
 title="Followers"
 value={stats.followers || 0}
 onClick={()=>navigate("/profile/followers")}
/>

<StatCard
 title="Following"
 value={stats.following || 0}
 onClick={()=>navigate("/profile/following")}
/>

<StatCard
 title="Total Upvotes"
 value={stats.totalUpvotes || 0}
 onClick={()=>navigate("/profile/upvotes")}
/>
        </div>
      )}
    </div>
  );
}

////////////////////////////////////////////////////////////
//////////////////// STAT CARD /////////////////////////////
////////////////////////////////////////////////////////////

function StatCard({ title, value, onClick }) {

  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;

    const interval = setInterval(() => {
      start += Math.ceil(value / 20);

      if (start >= value) {
        start = value;
        clearInterval(interval);
      }

      setCount(start);
    }, 25);

    return () => clearInterval(interval);
  }, [value]);

  return (
    <motion.div
      style={{ ...statCard, cursor: "pointer" }}
      whileHover={{ scale: 1.05 }}
      onClick={onClick}
    >
      <h2 style={statValue}>{count}</h2>
      <p style={statTitle}>{title}</p>
    </motion.div>
  );
}

////////////////////////////////////////////////////////////
//////////////////// STYLES ////////////////////////////////
////////////////////////////////////////////////////////////

const container = {
  minHeight: "100vh",
  padding: "40px",
  background: "#0f0f12",
  color: "white",
};

const card = {
  background: "#1a1a1f",
  padding: "30px",
  borderRadius: "12px",
  maxWidth: "500px",
  margin: "0 auto 30px auto",
  textAlign: "center",
};

const certificateCard = {
  background: "#1f1f25",
  border: "2px solid gold",
  padding: "20px",
  borderRadius: "12px",
  maxWidth: "500px",
  margin: "0 auto 30px auto",
  textAlign: "center",
};

const downloadBtn = {
  marginTop: "15px",
  background: "gold",
  color: "black",
  padding: "10px 20px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const avatar = {
  width: "80px",
  height: "80px",
  borderRadius: "50%",
  background: "#8b5cf6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "32px",
  margin: "0 auto 15px auto",
};

const name = { margin: "10px 0" };
const email = { color: "#aaa", marginBottom: "10px" };

const editBtn = {
  background: "#8b5cf6",
  color: "white",
  padding: "10px 20px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

const saveBtn = {
  ...editBtn,
  background: "#10b981",
};

const followBtn = {

background:"#8b5cf6",
color:"white",
padding:"10px 22px",
border:"none",
borderRadius:"8px",
cursor:"pointer",
marginTop:"10px",
fontWeight:"600"

};

const followingBtn = {

...followBtn,
background:"#222"

};

const input = {
  width: "100%",
  padding: "10px",
  marginBottom: "10px",
  borderRadius: "6px",
  border: "none",
};

const statsContainer = {
  display: "flex",
  justifyContent: "center",
  gap: "20px",
  flexWrap: "wrap",
};

const statCard = {
  background: "#1a1a1f",
  padding: "20px",
  borderRadius: "12px",
  width: "150px",
  textAlign: "center",
};

const statValue = { margin: "0" };
const statTitle = { color: "#aaa" };

export default Profile;