import { createContext, useEffect, useState } from "react";
import { getToken, deleteToken } from "./api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      setLoading(false);
      return;
    }

    // Decode the token payload without a library
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      // Check if token is expired
      if (payload.exp * 1000 < Date.now()) {
        deleteToken();
        setUser(null);
      } else {
        setUser(payload);
      }
    } catch {
      deleteToken();
      setUser(null);
    }

    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}