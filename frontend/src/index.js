import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./context/Authcontext";
import { API_CONFIG_ERROR } from "./config";

const root = ReactDOM.createRoot(
  document.getElementById("root")
);

root.render(API_CONFIG_ERROR ? (
  <main role="alert" style={{ maxWidth: 720, margin: "12vh auto", padding: 24, fontFamily: "Arial, sans-serif", color: "#fca5a5", background: "#111827", borderRadius: 12 }}>
    <h1>DebugDSA API configuration is required</h1>
    <p>{API_CONFIG_ERROR}</p>
  </main>
) : (

  <BrowserRouter>

    <GoogleOAuthProvider
clientId="448922480128-fedgt2v1q2v2qntr01d3aoklls9jun9j.apps.googleusercontent.com"
>

<AuthProvider>
  <App />
</AuthProvider>

</GoogleOAuthProvider>

  </BrowserRouter>

));
