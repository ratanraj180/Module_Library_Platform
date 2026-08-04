import { useState, createContext, useContext, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";


export function AuthProvider({ children }) {
  // Rehydrate from localStorage on mount
  const [user, setUser] = useState(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // Keep localStorage in sync whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, [user]);

  /**
   * Login via POST /api/auth/login
   * Returns { ok: true } on success or { ok: false, error: string } on failure.
   */
  const login = async (email, password) => {
    setLoading(true);
    try {
      console.log('[useAuth.login] Sending POST /api/auth/login');
      console.log('[useAuth.login] Payload:', { email, passwordLength: password ? password.length : 0 });

      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));
      console.log('[useAuth.login] HTTP status:', res.status);
      console.log('[useAuth.login] Response body:', data);

      if (!res.ok) {
        // Use the server's error message if available, otherwise a generic one
        const message =
          data?.message ||
          data?.error ||
          (res.status === 401
            ? "Invalid email or password."
            : `Login failed (${res.status}).`);
        console.log('[useAuth.login] FAIL:', message);
        return { ok: false, error: message };
      }

      // Backend returns { success: true, data: { token, user } }
      // Fall back to top-level fields for other response shapes.
      const payload = data?.data ?? data;
      const token = payload?.token || payload?.accessToken || "";
      const userData = payload?.user ?? { email };

      if (token) {
        localStorage.setItem("token", token);
      }

      console.log('[useAuth.login] SUCCESS. Token received:', !!token, '| User:', userData?.email);
      setUser(userData);
      return { ok: true };
    } catch (err) {
      // Network / CORS error
      console.error('[useAuth.login] Network/CORS error:', err);
      return {
        ok: false,
        error:
          "Unable to reach the server. Please check your connection or try again.",
      };
    } finally {
      setLoading(false);
    }
  };
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const { signInWithPopup, GoogleAuthProvider } = await import("firebase/auth");
      const { auth } = await import("../firebase/firebase");
      
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      const payload = {
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        profilePicture: firebaseUser.photoURL,
      };

      const res = await fetch(`${API_BASE}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = data?.message || data?.error || `Google authentication failed (${res.status}).`;
        return { ok: false, error: message };
      }

      const responseData = data?.data ?? data;
      const token = responseData?.token || responseData?.accessToken || "";
      const userData = responseData?.user ?? { email: firebaseUser.email };

      if (token) {
        localStorage.setItem("token", token);
      }

      setUser(userData);
      return { ok: true };
    } catch (err) {
      console.error("Google login error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        return { ok: false, error: "Sign-in popup closed before completion." };
      }
      return {
        ok: false,
        error: err.message || "Failed to sign in with Google.",
      };
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email) => {
    try {
      console.log("Reset email:", email);
      const { sendPasswordResetEmail } = await import("firebase/auth");
      const { auth } = await import("../firebase/firebase");

      console.log("Calling sendPasswordResetEmail...");
      await sendPasswordResetEmail(auth, email);
      
      console.log("Password reset email sent.");
      return { ok: true };
    } catch (error) {
      console.error(error);
      return { ok: false, error: `${error.code}: ${error.message}` };
    }
  };

  /** Convenience getter for the stored JWT */
  const getToken = () => localStorage.getItem("token");

  return (
    <AuthContext.Provider value={{ user, login, logout, loginWithGoogle, sendPasswordReset, loading, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
