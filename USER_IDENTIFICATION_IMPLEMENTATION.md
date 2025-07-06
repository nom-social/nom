# User Identification Implementation

This document describes the implementation of user identification for both Sentry and PostHog in the Next.js application.

## Overview

User identification has been implemented to connect anonymous usage data with authenticated users across both Sentry (error monitoring) and PostHog (analytics). This allows for better error tracking, user journey analysis, and debugging.

## Implementation Details

### 1. Utility Functions (`src/utils/user-identification.ts`)

Core functions for managing user identification:

- `identifyUser(user)` - Sets user context for both Sentry and PostHog
- `resetUserIdentification()` - Clears user context from both services
- `identifyUserServerSide(user)` - Server-side Sentry identification only

### 2. Client-Side Identification (`src/components/analytics/user-identification-manager.tsx`)

A React component that:
- Listens to Supabase auth state changes
- Automatically identifies users when they log in
- Resets identification when they log out
- Handles initial session detection on page load

### 3. Server-Side Identification (`src/middleware.ts`)

Middleware that:
- Sets user context in Sentry for all server-side requests
- Uses Supabase session to identify the current user
- Ensures server-side errors are properly attributed to users

### 4. Layout Integration (`src/app/layout.tsx`)

The `UserIdentificationManager` component is integrated into the root layout to ensure it runs throughout the application.

## Features

### For Sentry
- **User Context**: User ID, email, GitHub username, and auto-detected IP
- **Error Attribution**: All errors are linked to the authenticated user
- **Server-Side Tracking**: Middleware ensures server errors include user context

### For PostHog
- **User Identification**: Uses email or user ID as the primary identifier
- **User Properties**: Includes GitHub username, avatar, full name, and email
- **Event Tracking**: Custom events like 'user_identified' and 'user_logged_out'
- **Profile Enrichment**: Sets user properties for better analytics

## User Data Captured

The following user data is captured from the Supabase auth session:

```typescript
{
  id: user.id,                                    // Supabase user ID
  email: user.email,                              // User's email
  github_username: user.user_metadata.user_name, // GitHub username
  avatar_url: user.user_metadata.avatar_url,     // GitHub avatar
  full_name: user.user_metadata.full_name,       // Full name from GitHub
}
```

## How It Works

### Login Flow
1. User logs in via GitHub OAuth through Supabase
2. `UserIdentificationManager` detects the `SIGNED_IN` event
3. User context is set in both Sentry and PostHog
4. A `user_identified` event is tracked in PostHog

### Logout Flow
1. User clicks logout
2. `UserIdentificationManager` detects the `SIGNED_OUT` event
3. User context is cleared from both services
4. A `user_logged_out` event is tracked in PostHog

### Page Requests
1. Middleware runs on each page request
2. User session is checked via Supabase
3. Sentry user context is set for server-side error tracking

## Privacy Considerations

- IP addresses are auto-detected by Sentry (can be disabled if needed)
- Only necessary user data is sent to analytics services
- User identification can be reset at any time
- All data follows the existing privacy policies of Sentry and PostHog

## Testing

To verify the implementation:

1. **Login Test**: Log in and check that events in PostHog show the correct user
2. **Logout Test**: Log out and verify that subsequent events are anonymous
3. **Error Test**: Trigger an error while logged in and check Sentry for user context
4. **Server Error Test**: Trigger a server-side error and verify user attribution

## Benefits

- **Better Error Debugging**: Know exactly which users experience errors
- **User Journey Analysis**: Track user behavior across the entire application
- **Improved Support**: Connect support requests to actual user data
- **Enhanced Analytics**: Segment and analyze user behavior patterns