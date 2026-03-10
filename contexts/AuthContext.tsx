import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri, useAuthRequest, ResponseType } from "expo-auth-session";
import { Platform } from "react-native";
import { getApiUrl } from "@/lib/query-client";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
const TOKEN_KEY = "vitalis_jwt";

const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  avatar?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  googleConfigured: boolean;
  signInWithGoogle: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  googleConfigured: false,
  signInWithGoogle: () => {},
  signOut: async () => {},
});

export function AuthProvider({ children, onSyncRequest }: { children: ReactNode; onSyncRequest?: (token: string) => void }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const googleConfigured = !!GOOGLE_CLIENT_ID;

  const redirectUri = makeRedirectUri({
    scheme: "vitalisai",
    path: "auth",
  });

  const [request, response, promptAsync] = useAuthRequest(
    {
      responseType: ResponseType.Token,
      clientId: GOOGLE_CLIENT_ID || "placeholder",
      scopes: ["openid", "profile", "email"],
      redirectUri,
      extraParams: { access_type: "online" },
    },
    discovery
  );

  useEffect(() => {
    loadStoredToken();
  }, []);

  useEffect(() => {
    if (response?.type === "success") {
      const accessToken = response.params.access_token || (response.authentication?.accessToken ?? "");
      if (accessToken) handleGoogleToken(accessToken);
    }
  }, [response]);

  async function loadStoredToken() {
    try {
      const stored = await SecureStore.getItemAsync(TOKEN_KEY);
      if (stored) {
        const payload = parseJwt(stored);
        if (payload && payload.exp * 1000 > Date.now()) {
          setToken(stored);
          setUser({ id: payload.userId, email: payload.email, name: payload.name });
        } else {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
        }
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleToken(accessToken: string) {
    try {
      const apiUrl = new URL("/api/auth/google", getApiUrl()).toString();
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });
      if (!res.ok) throw new Error("Auth failed");
      const data = await res.json();
      await SecureStore.setItemAsync(TOKEN_KEY, data.token);
      setToken(data.token);
      setUser(data.user);
      if (onSyncRequest) onSyncRequest(data.token);
    } catch (err) {
      console.error("Google auth error:", err);
    }
  }

  function signInWithGoogle() {
    if (!googleConfigured) return;
    promptAsync();
  }

  async function signOut() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user, token, isLoading,
        isAuthenticated: !!user,
        googleConfigured,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

function parseJwt(token: string): any {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Platform.OS === "web"
      ? atob(base64)
      : Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}
