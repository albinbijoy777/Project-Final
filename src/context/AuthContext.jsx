import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { getProfile } from "../services/auth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session
    supabase.auth.getSession().then(({ data }) => {
      handleSession(data.session);
    });

    // Listen to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        handleSession(session);
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  async function handleSession(session) {
    if (!session) {
      setUser(null);
      setProfile(null);
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setUser(session.user);

      // Profile already created by DB trigger
      const profileData = await getProfile(session.user);
      setProfile(profileData);

      // Load notifications
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      setNotifications(data || []);
    } catch (err) {
      console.error("AuthContext error:", err.message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  // 🔔 REALTIME NOTIFICATIONS
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        notifications,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
