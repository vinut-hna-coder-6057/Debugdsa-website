import { Link } from "react-router-dom";

function AdminDashboard() {
return ( <div style={container}>

  <h1 style={title}>Admin Dashboard</h1>

  <div style={grid}>

    <Link to="/admin/users" style={card}>
      Manage Users
    </Link>

    <Link to="/admin/bugs" style={card}>
      Manage Bugs
    </Link>

    <Link to="/admin/submissions" style={card}>
      Manage Submissions
    </Link>

    <Link to="/admin/battles" style={card}>
      Manage Battles
    </Link>

  </div>

</div>

);
}

/* =========================
STYLES
========================= */

const container = {
minHeight: "100vh",
padding: "40px",
background: "#0f0f12",
color: "#8b5cf6"
};

const title = {
fontSize: "30px",
marginBottom: "20px",
color: "#8b5cf6"
};

const grid = {
display: "grid",
gridTemplateColumns: "repeat(2,1fr)",
gap: "20px",
marginTop: "30px"
};

const card = {
padding: "30px",
background: "#1a1a22",
borderRadius: "12px",
textAlign: "center",
textDecoration: "none",
color: "#8b5cf6",
fontSize: "18px",
border: "1px solid #8b5cf6",
transition: "0.2s",
cursor: "pointer"
};

export default AdminDashboard;