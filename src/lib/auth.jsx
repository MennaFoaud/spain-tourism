import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check for existing session
    (async () => {
      try {
        const { data: { session }, error: err } = await supabase.auth.getSession();
        if (err) throw err;
        setSession(session);
      } catch (e) {
        console.error("Failed to get session:", e);
        setError(e?.message || "Failed to restore session");
      } finally {
        setLoading(false);
      }
    })();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signInWithPassword = async (email, password) => {
    setError(null);
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (err) throw err;
      setSession(data.session);
      return { success: true };
    } catch (e) {
      const msg = e?.message || "Failed to sign in";
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const signOut = async () => {
    setError(null);
    try {
      const { error: err } = await supabase.auth.signOut();
      if (err) throw err;
      setSession(null);
      return { success: true };
    } catch (e) {
      const msg = e?.message || "Failed to sign out";
      setError(msg);
      return { success: false, error: msg };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        loading,
        error,
        signInWithPassword,
        signOut,
        isAuthenticated: !!session,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
