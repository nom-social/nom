import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";
import { User } from "@supabase/supabase-js";

/**
 * Sets user identification for both Sentry and PostHog
 */
export function identifyUser(user: User) {
  // Set user context in Sentry
  Sentry.setUser({
    id: user.id,
    email: user.email || undefined,
    username: user.user_metadata?.user_name || undefined,
    ip_address: '{{auto}}', // Let Sentry auto-detect IP
  });

  // Identify user in PostHog
  const posthogUserId = user.email || user.id;
  posthog.identify(posthogUserId, {
    email: user.email,
    github_username: user.user_metadata?.user_name,
    user_id: user.id,
    avatar_url: user.user_metadata?.avatar_url,
    full_name: user.user_metadata?.full_name,
  });

  // Set user properties in PostHog
  posthog.people.set({
    email: user.email,
    github_username: user.user_metadata?.user_name,
    avatar_url: user.user_metadata?.avatar_url,
    full_name: user.user_metadata?.full_name,
    $name: user.user_metadata?.full_name || user.user_metadata?.user_name,
  });

  // Track successful identification
  posthog.capture('user_identified', {
    method: 'github_oauth',
    user_id: user.id,
    github_username: user.user_metadata?.user_name,
  });
}

/**
 * Resets user identification for both Sentry and PostHog
 */
export function resetUserIdentification() {
  Sentry.setUser(null);
  posthog.reset();
  
  // Track logout event
  posthog.capture('user_logged_out');
}

/**
 * Sets user identification on the server side (Sentry only)
 */
export function identifyUserServerSide(user: User) {
  Sentry.setUser({
    id: user.id,
    email: user.email || undefined,
    username: user.user_metadata?.user_name || undefined,
    ip_address: '{{auto}}',
  });
}