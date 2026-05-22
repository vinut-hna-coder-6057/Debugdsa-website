import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/Authcontext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  // ✅ Active route detection (supports dynamic routes)
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div style={nav}>
      <h2 style={logo} onClick={() => navigate("/")}>
        DebugHub 🚀
      </h2>

      <div style={menu}>
        <NavItem to="/" label="Home" active={location.pathname === "/"} />
        <NavItem to="/post" label="Post Bug" active={isActive("/post")} />
        <NavItem to="/view" label="View Bugs" active={isActive("/view")} />
        <NavItem to="/leaderboard" label="Leaderboard" active={isActive("/leaderboard")} />

        {/* NEW BATTLE FEATURES */}
        <NavItem to="/battles" label="Battles" active={isActive("/battles")} />

        {!user ? (
          <Link to="/login" style={{ textDecoration: "none" }}>
            <motion.button style={loginBtn} whileHover={{ scale: 1.05 }}>
              Login
            </motion.button>
          </Link>
        ) : (
          <>
            <NavItem to="/profile" label="Profile" active={isActive("/profile")} />

            {/* Coins */}
            <div style={coins}>
             💰 {user?.points || 0}
            </div>

            {/* Avatar */}
            <motion.div
              style={avatar}
              whileHover={{ scale: 1.1 }}
              onClick={() => navigate("/profile")}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </motion.div>

            <motion.button
              onClick={handleLogout}
              style={logoutBtn}
              whileHover={{ scale: 1.05 }}
            >
              Logout
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
}

/* Nav Item */
function NavItem({ to, label, active }) {
  return (
    <Link to={to} style={{ textDecoration: "none" }}>
      <motion.div
        style={{
          ...link,
          color: active ? "#a78bfa" : "#e2e8f0",
          position: "relative"
        }}
        whileHover={{ scale: 1.08 }}
      >
        {label}

        {active && (
          <motion.div
            layoutId="activeNav"
            style={activeLine}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        )}
      </motion.div>
    </Link>
  );
}

/* STYLES */

const nav = {
  position: "fixed",
  top: 0,
 left: 0,
right: 0,
  height: "70px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0 20px",
boxSizing: "border-box",
  backdropFilter: "blur(12px)",
  background: "rgba(15,15,18,0.7)",
  borderBottom: "1px solid rgba(255,255,255,0.05)",
  zIndex: 1000
};

const logo = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#8b5cf6",
  cursor: "pointer"
};

const menu = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: "20px"
};

const link = {
  cursor: "pointer",
  paddingBottom: "5px",
  fontSize: "15px",
  fontWeight: "500"
};

const activeLine = {
  position: "absolute",
  bottom: "-4px",
  left: 0,
  right: 0,
  height: "2px",
  background: "#8b5cf6",
  borderRadius: "4px"
};

const coins = {
  background: "#1f1f2e",
  padding: "6px 10px",
  borderRadius: "10px",
  fontSize: "14px",
  color: "#facc15"
};

const loginBtn = {
  padding: "8px 18px",
  background: "#8b5cf6",
  border: "none",
  borderRadius: "10px",
  color: "white",
  cursor: "pointer"
};

const logoutBtn = {
  padding: "8px 18px",
  background: "#ef4444",
  border: "none",
  borderRadius: "10px",
  color: "white",
  cursor: "pointer"
};

const avatar = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  background: "#8b5cf6",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  fontWeight: "600",
  cursor: "pointer"
};

export default Navbar;