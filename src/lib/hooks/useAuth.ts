import { useState, useEffect } from "react";
import { User, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If Firebase is not configured, skip authentication
    if (!auth) {
      setLoading(false);
      return;
    }

    // Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInAnonymous = async () => {
    if (!auth) {
      console.log("Firebase not configured - skipping authentication");
      return;
    }

    try {
      setError(null);
      await signInAnonymously(auth);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Authentication failed";
      setError(errorMessage);
      console.error("Anonymous sign-in error:", err);
    }
  };

  // Auto sign in anonymously if not authenticated and Firebase is available
  useEffect(() => {
    if (auth && !loading && !user && !error) {
      signInAnonymous();
    }
  }, [loading, user, error]);

  return {
    user,
    loading,
    error,
    signInAnonymous,
    isFirebaseEnabled: !!auth,
  };
};
