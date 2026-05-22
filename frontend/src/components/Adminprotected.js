import { Navigate } from "react-router-dom";

function Admin1Protected({children}){

  const isAdmin = localStorage.getItem("admin1");

  if(!isAdmin){
    return <Navigate to="/admin1/login" />;
  }

  return children;

}

export default Admin1Protected;