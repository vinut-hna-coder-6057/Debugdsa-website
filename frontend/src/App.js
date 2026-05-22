import {
  Routes,
  Route,
  Navigate,
  useLocation
} from "react-router-dom";

import { useAuth } from "./context/Authcontext";

import Navbar from "./components/Navbar";

/* USER PAGES */

import Home from "./pages/Home";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Profile from "./pages/profile";
import Leaderboard from "./pages/leaderboard";
import PostBug from "./pages/postbug";
import ViewBugs from "./pages/viewbugs";
import ViewBug from "./pages/viewbug";
import UserProfile from "./pages/userprofile";
import MySubmissions from "./pages/MySubmissions";
import AllSubmissions from "./pages/AllSubmissions";
import OAuthSuccess from "./pages/OAuthSuccess";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
/* BATTLES */

import Battles from "./pages/Battles";
import BattleRoom from "./pages/BattleRoom";
import BattleLeaderboard from "./pages/BattleLeaderboard";

/* ADMIN PAGES */

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBugs from "./pages/admin/AdminBugs";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import AdminBattles from "./pages/admin/AdminBattles";
import AdminBattleSubmissions from "./pages/admin/adminBattleSubmissions";

/* PROFILE */

import ProfilePoints from "./pages/ProfilePoints";
import ProfileBugs from "./pages/ProfileBug";
import ProfileFollowers from "./pages/ProfileFollowers";
import ProfileFollowing from "./pages/ProfileFollowing";
import ProfileUpvotes from "./pages/ProfileUpvotes";

/* BUG SOLUTION */

import BugSolution from "./pages/BugSolution";

//////////////////////////////////////////////////////
// PROTECTED ROUTE
//////////////////////////////////////////////////////

function ProtectedRoute({ children }) {

  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={loadingScreen}>
        <h2 style={{ color: "#8b5cf6" }}>Loading DebugDSA...</h2>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

//////////////////////////////////////////////////////
// ADMIN ROUTE
//////////////////////////////////////////////////////

function AdminRoute({ children }) {

  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={loadingScreen}>
        <h2 style={{ color: "#8b5cf6" }}>Loading Admin...</h2>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

//////////////////////////////////////////////////////
// LAYOUT
//////////////////////////////////////////////////////

function Layout() {

  const location = useLocation();

  const hideNavbar = location.pathname.startsWith("/admin");

  return (
    <>
      {!hideNavbar && <Navbar />}

      <div style={{ paddingTop: hideNavbar ? "0px" : "70px" }}>

        <Routes>

          {/* PUBLIC ROUTES */}

          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
<Route
  path="/forgot-password"
  element={<ForgotPassword />}
/>

<Route
  path="/reset-password/:token"
  element={<ResetPassword />}
/>
          {/* GOOGLE OAUTH SUCCESS */}
          <Route path="/oauth-success" element={<OAuthSuccess />} />

          {/* BUG ROUTES */}

          <Route path="/view" element={<ViewBugs />} />
          <Route path="/view/:id" element={<ViewBug />} />
          <Route path="/leaderboard" element={<Leaderboard />} />

          {/* BATTLES */}

          <Route path="/battles" element={<Battles />} />

          <Route
            path="/battle/:id"
            element={
              <ProtectedRoute>
                <BattleRoom />
              </ProtectedRoute>
            }
          />

          <Route path="/battle-leaderboard" element={<BattleLeaderboard />} />

          {/* USER PROTECTED ROUTES */}

          <Route
            path="/post"
            element={
              <ProtectedRoute>
                <PostBug />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="/profile/:id" element={<UserProfile />} />

          <Route
            path="/mysubmissions"
            element={
              <ProtectedRoute>
                <MySubmissions />
              </ProtectedRoute>
            }
          />

          <Route
            path="/allsubmissions"
            element={
              <ProtectedRoute>
                <AllSubmissions />
              </ProtectedRoute>
            }
          />

          <Route
            path="/bugs/:bugId/solution"
            element={
              <ProtectedRoute>
                <BugSolution />
              </ProtectedRoute>
            }
          />

          {/* PROFILE SUB PAGES */}

          <Route path="/profile/points" element={<ProfilePoints />} />
          <Route path="/profile/bugs" element={<ProfileBugs />} />
          <Route path="/profile/followers" element={<ProfileFollowers />} />
          <Route path="/profile/following" element={<ProfileFollowing />} />
          <Route path="/profile/upvotes" element={<ProfileUpvotes />} />

          {/* ADMIN ROUTES */}

          <Route path="/admin" element={<AdminLogin />} />

          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/bugs"
            element={
              <AdminRoute>
                <AdminBugs />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/submissions"
            element={
              <AdminRoute>
                <AdminSubmissions />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/battles"
            element={
              <AdminRoute>
                <AdminBattles />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/battle/:id"
            element={
              <AdminRoute>
                <AdminBattleSubmissions />
              </AdminRoute>
            }
          />

          {/* 404 */}

          <Route
            path="*"
            element={
              <div style={notFound}>
                <h1>404</h1>
                <p>Page not found</p>
              </div>
            }
          />

        </Routes>

      </div>
    </>
  );
}


//////////////////////////////////////////////////////
// APP
//////////////////////////////////////////////////////

function App() {
  return <Layout />;
}



//////////////////////////////////////////////////////
// STYLES
//////////////////////////////////////////////////////

const loadingScreen = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "#0f0f12"
};



const notFound = {
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  color: "white",
  background: "#0f0f12"
};

export default App;