"use client";

import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { identifyUser, resetUserIdentification } from "@/utils/user-identification";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

export default function UserIdentificationManager() {
  useEffect(() => {
    const supabase = createClient();

    // Get initial session and identify user if logged in
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        identifyUser(session.user);
      }
    };

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN' && session?.user) {
          identifyUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          resetUserIdentification();
        }
      }
    );

    // Initialize auth state
    initializeAuth();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return null;
}