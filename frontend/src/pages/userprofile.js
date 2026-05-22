import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import axiosInstance from "../api/axiosInstance";

function UserProfile() {

  const { id } = useParams();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [processing, setProcessing] = useState(false);

  ////////////////////////////////////////////////////////////
  // LOAD USER PROFILE
  ////////////////////////////////////////////////////////////

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {

    try {

      const res = await axiosInstance.get(`/users/profile/${id}`);

      setUser(res.data);
      setFollowing(res.data.isFollowing);

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }

  };

  ////////////////////////////////////////////////////////////
  // FOLLOW USER
  ////////////////////////////////////////////////////////////

  const followUser = async () => {

    if (processing) return;

    try {

      setProcessing(true);

      await axiosInstance.put(`/users/follow/${id}`);

      setFollowing(true);

      setUser((prev) => ({
        ...prev,
        followerCount: prev.followerCount + 1
      }));

    } catch (err) {

      console.error(err);

    } finally {

      setProcessing(false);

    }

  };

  ////////////////////////////////////////////////////////////
  // UNFOLLOW USER
  ////////////////////////////////////////////////////////////

  const unfollowUser = async () => {

    if (processing) return;

    try {

      setProcessing(true);

      await axiosInstance.put(`/users/unfollow/${id}`);

      setFollowing(false);

      setUser((prev) => ({
        ...prev,
        followerCount: prev.followerCount - 1
      }));

    } catch (err) {

      console.error(err);

    } finally {

      setProcessing(false);

    }

  };

  ////////////////////////////////////////////////////////////

  if (loading) {
    return <div style={container}>Loading user...</div>;
  }

  if (!user) {
    return <div style={container}>User not found</div>;
  }

  return (

    <div style={container}>

      <motion.div
        style={card}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >

        <div style={avatar}>
          {user.name?.charAt(0)?.toUpperCase()}
        </div>

        <h2>{user.name}</h2>

        <p style={{ color: "#aaa" }}>
          Points: {user.points}
        </p>

        <div style={statsRow}>

          <div>
            <strong>{user.followerCount}</strong>
            <p>Followers</p>
          </div>

          <div>
            <strong>{user.followingCount}</strong>
            <p>Following</p>
          </div>

          <div>
            <strong>{user.bugsSolved}</strong>
            <p>Solved</p>
          </div>

        </div>

        {following ? (

          <motion.button
            style={unfollowBtn}
            whileHover={{ scale: 1.05 }}
            onClick={unfollowUser}
            disabled={processing}
          >
            Unfollow
          </motion.button>

        ) : (

          <motion.button
            style={followBtn}
            whileHover={{ scale: 1.05 }}
            onClick={followUser}
            disabled={processing}
          >
            Follow
          </motion.button>

        )}

      </motion.div>

    </div>

  );

}

export default UserProfile;

////////////////////////////////////////////////////////////
// STYLES
////////////////////////////////////////////////////////////

const container = {
  minHeight: "100vh",
  background: "#0f0f12",
  padding: "40px",
  color: "white"
};

const card = {
  background: "#1a1a1f",
  padding: "30px",
  borderRadius: "12px",
  maxWidth: "500px",
  margin: "auto",
  textAlign: "center"
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
  margin: "0 auto 15px auto"
};

const statsRow = {
  display: "flex",
  justifyContent: "space-around",
  margin: "20px 0"
};

const followBtn = {
  background: "#8b5cf6",
  color: "white",
  padding: "10px 25px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer"
};

const unfollowBtn = {
  background: "#ef4444",
  color: "white",
  padding: "10px 25px",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer"
};