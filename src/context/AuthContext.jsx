import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../services/supabase.js";
import {
  ensureProfile,
  getCurrentSession,
  login as loginRequest,
  logout as logoutRequest,
  signUp as signUpRequest,
  updateExistingProfile,
  upsertProfile,
} from "../services/auth.js";
import { updateProfileAvatar } from "../services/profileMedia.js";
import { subscribeToTable } from "../services/platformService.js";
import { normalizeRole } from "../utils/roles.js";

const AuthContext = createContext(null);

function buildFallbackProfile(targetUser, existingProfile = null) {
  if (!targetUser) return null;

  return {
    id: targetUser.id,
    email: targetUser.email,
    name:
      existingProfile?.name ||
      targetUser.user_metadata?.name ||
      targetUser.email?.split("@")[0] ||
      "FixBee User",
    role: normalizeRole(existingProfile?.role || targetUser.user_metadata?.role || "user"),
    phone: existingProfile?.phone || "",
    address: existingProfile?.address || "",
    avatar: existingProfile?.avatar || existingProfile?.avatar_url || null,
    avatar_url: existingProfile?.avatar_url || existingProfile?.avatar || null,
  };
}

function buildSignupProfile(user, details = {}) {
  if (!user) return null;

  return {
    id: user.id,
    email: details.email || user.email || "",
    name: details.name || user.user_metadata?.name || user.email?.split("@")[0] || "FixBee User",
    role: normalizeRole(details.role || user.user_metadata?.role || "user"),
    phone: details.phone || "",
    address: details.address || "",
    avatar: null,
    avatar_url: null,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async (targetUser) => {
    if (!targetUser) {
      setProfile(null);
      return null;
    }

    try {
      const nextProfile = await ensureProfile(targetUser);
      const normalizedProfile = nextProfile
        ? { ...nextProfile, role: normalizeRole(nextProfile.role) }
        : buildFallbackProfile(targetUser);
      setProfile(normalizedProfile);
      return normalizedProfile;
    } catch {
      let fallbackProfile = null;
      setProfile((currentProfile) => {
        fallbackProfile = buildFallbackProfile(targetUser, currentProfile);
        return fallbackProfile;
      });
      return fallbackProfile;
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function hydrate() {
      try {
        const nextSession = await getCurrentSession();
        if (!active) return;

        setSession(nextSession);
        setUser(nextSession?.user || null);

        if (nextSession?.user) {
          await refreshProfile(nextSession.user);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    hydrate();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      try {
        setSession(nextSession);
        setUser(nextSession?.user || null);

        if (nextSession?.user) {
          await refreshProfile(nextSession.user);
        } else {
          setProfile(null);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [refreshProfile]);

  useEffect(() => {
    if (!user?.id) return undefined;

    return subscribeToTable({
      channelName: `profile-${user.id}`,
      table: "profiles",
      filter: `id=eq.${user.id}`,
      onChange: async () => {
        await refreshProfile(user);
      },
    });
  }, [refreshProfile, user]);

  async function login(email, password) {
    const loggedInUser = await loginRequest(email, password);
    setUser(loggedInUser);
    const nextProfile = await refreshProfile(loggedInUser);
    return nextProfile;
  }

  async function signup({ email, password, name, role, phone, address, avatarFile }) {
    const authResult = await signUpRequest({ email, password, name, role, phone, address });
    const nextUser = authResult?.user;
    const requiresEmailConfirmation = !authResult?.session;

    if (avatarFile && nextUser?.id && !requiresEmailConfirmation) {
      const avatarUrl = await updateProfileAvatar(nextUser.id, avatarFile);
      await upsertProfile({
        id: nextUser.id,
        email,
        name,
        role: normalizeRole(role),
        phone,
        address,
        avatar: avatarUrl,
        avatar_url: avatarUrl,
      });
    }

    if (authResult?.session && nextUser) {
      setSession(authResult.session);
      setUser(nextUser);
      const nextProfile = await refreshProfile(nextUser);
      return {
        profile: nextProfile ? { ...nextProfile, role: normalizeRole(nextProfile.role) } : null,
        requiresEmailConfirmation: false,
      };
    }

    return {
      profile: nextUser
        ? buildSignupProfile(nextUser, {
            email,
            name,
            role,
            phone,
            address,
          })
        : null,
      requiresEmailConfirmation,
    };
  }

  async function updateProfile(details) {
    if (!user?.id) throw new Error("No active user.");
    const nextProfile = await updateExistingProfile({
      id: user.id,
      email: profile?.email || user.email,
      role: profile?.role || "user",
      ...details,
    });
    setProfile(nextProfile);
    return nextProfile;
  }

  async function updateAvatar(file) {
    if (!user?.id) throw new Error("No active user.");
    const avatarUrl = await updateProfileAvatar(user.id, file);
    const nextProfile = await updateExistingProfile({
      id: user.id,
      email: profile?.email || user.email,
      role: profile?.role || "user",
      avatar: avatarUrl,
      avatar_url: avatarUrl,
    });
    setProfile(nextProfile);
    return avatarUrl;
  }

  async function logout() {
    try {
      await logoutRequest();
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        login,
        signup,
        logout,
        updateProfile,
        updateAvatar,
        refreshProfile: () => refreshProfile(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
