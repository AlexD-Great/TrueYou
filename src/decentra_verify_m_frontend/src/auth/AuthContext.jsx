import React, { createContext, useContext, useState, useEffect } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { createActor } from "declarations/decentra_verify_m_backend";
import { canisterId } from "declarations/decentra_verify_m_backend/index.js";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authClient, setAuthClient] = useState(null);
  const [actor, setActor] = useState(null);

  useEffect(() => {
    updateActor();
  }, []);

  async function updateActor() {
    const authClient = await AuthClient.create();
    const identity = authClient.getIdentity();
    const actor = createActor(canisterId, {
      agentOptions: {
        identity,
      },
    });
    const isAuthenticated = await authClient.isAuthenticated();

    setActor(actor);
    setAuthClient(authClient);
    setIsAuthenticated(isAuthenticated);
  }

  async function login() {
    await authClient.login({
      identityProvider:
        process.env.DFX_NETWORK === "ic"
          ? "https://identity.ic0.app"
          : "http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943",
      onSuccess: updateActor,
    });
  }

  async function logout() {
    await authClient.logout();
    updateActor();
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, actor }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
