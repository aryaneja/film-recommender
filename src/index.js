import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "react-oidc-context";

const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Tte33hu8L",
  client_id: "56bh1sv1pilqlhjqa6nsqoo7qu",
  redirect_uri: "https://d2zefjjdxb0ynv.cloudfront.net",
  response_type: "code",
  scope: "email openid phone",
};

const oidcConfig = {
  authority: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Tte33hu8L',
  client_id: 'your-client-id',
  redirect_uri: 'http://localhost:3000',
  response_type: 'code',
  scope: 'openid profile email',
  metadata: {
    issuer: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Tte33hu8L',
    authorization_endpoint: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Tte33hu8L/oauth2/authorize',
    token_endpoint: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Tte33hu8L/oauth2/token',
    userinfo_endpoint: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Tte33hu8L/oauth2/userInfo',
    end_session_endpoint: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_Tte33hu8L/logout',
  }
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