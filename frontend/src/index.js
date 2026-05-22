import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/Authcontext";

const root = ReactDOM.createRoot(
  document.getElementById("root")
);

root.render(

  <BrowserRouter>

    <GoogleOAuthProvider
clientId="448922480128-fedgt2v1q2v2qntr01d3aoklls9jun9j.apps.googleusercontent.com"
>

<AuthProvider>
  <App />
</AuthProvider>

</GoogleOAuthProvider>

  </BrowserRouter>

);