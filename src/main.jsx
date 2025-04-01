/* import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context'
import './index.css'
import App from './App.jsx'

const oidcConfig = {
  authority: "https://us-east-1tte33hu8l.auth.us-east-1.amazoncognito.com",
  client_id: "56bh1sv1pilqlhjqa6nsqoo7qu",
  redirect_uri: "https://d84l1y8p4kdic.cloudfront.net",
  response_type: "code",
  scope: "openid profile email",
  loadUserInfo: true,
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname)
  }
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider {...oidcConfig}>
      <App />
    </AuthProvider>
  </StrictMode>,
) */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "react-oidc-context";
import './index.css';

const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Tte33hu8L",
  client_id: "7r6k782rfm22v1plpo9f9uimhq",
  redirect_uri: "https://film.aryaneja.com",
  response_type: "code",
  scope: "email openid phone",
};


const root = ReactDOM.createRoot(document.getElementById("root"));

// wrap the application with AuthProvider
root.render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
