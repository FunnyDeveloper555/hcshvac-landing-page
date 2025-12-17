import { useState, useEffect, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const logAuthEvent = async (
  action: "login" | "logout",
  userId: string,
  userEmail: string
) => {
  try {
    await supabase.from("admin_logs").insert([{
      user_id: userId,
      user_email: userEmail,
      action,
      entity_type: "auth",
      entity_id: null,
      details: { timestamp: new Date().toISOString() },
    }]);
  } catch (err) {
    console.error("Error logging auth event:", err);
  }
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const hasLoggedLogin = useRef(false);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Log login event (only once per session)
        if (event === "SIGNED_IN" && session?.user && !hasLoggedLogin.current) {
          hasLoggedLogin.current = true;
          setTimeout(() => {
            logAuthEvent("login", session.user.id, session.user.email || "unknown");
          }, 0);
        }
        
        // Check admin status after state is set
        if (session?.user) {
          setTimeout(() => {
            checkAdminStatus(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkAdminStatus(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!error && data) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    } catch (error) {
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    // Log logout before signing out
    if (user) {
      await logAuthEvent("logout", user.id, user.email || "unknown");
      hasLoggedLogin.current = false;
    }
    await supabase.auth.signOut();
  };

  return { user, session, isAdmin, loading, signOut };
};
