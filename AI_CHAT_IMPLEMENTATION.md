# AI Chat Implementation for Floating Chat Button

## Overview

Successfully implemented AI chat functionality in the floating-chat-button component using Vercel AI SDK with tool calling capabilities to query different feeds.

## What was implemented

### 1. Vercel AI SDK Integration
- Installed `ai` and `@ai-sdk/openai` packages
- Uses OpenAI GPT-4o model for chat responses
- Streaming responses for better user experience

### 2. API Route (`/api/chat`)
- Location: `src/app/api/chat/route.ts`
- Supports tool calling with three main tools:
  - `queryFeed`: Query user's personal feed
  - `queryPublicFeed`: Query public feed  
  - `queryRepoFeed`: Query specific repository feed
- Handles org/repo to repository ID lookup for repo-specific queries
- Includes proper error handling and context awareness

### 3. Enhanced Floating Chat Button
- Location: `src/components/shared/floating-chat-button.tsx`
- Context detection based on current pathname:
  - Personal feed: `/page/feed`
  - Public feed: detected when accessing public content
  - Repository feed: `/[org]/[repo]` pattern
- Real-time streaming chat interface
- Loading states and proper error handling
- Responsive design (mobile drawer, desktop popover)

### 4. Tool Calling Features
- **Feed Query Tools**: Can search across different feed types
- **Filter Support**: Supports all existing search filters:
  - `org:name` - filter by organization
  - `repo:name` - filter by repository  
  - `type:pr|issue|commit` - filter by activity type
  - `from:date` - filter items from date
  - `to:date` - filter items to date
  - `owner:name` - filter by owner (same as org:)
- **Context Aware**: Automatically detects which feed user is viewing
- **Smart Responses**: Formats results in a readable way with explanations

## Key Features

### Context Detection
The chat button automatically detects the current context:
- On main feed page: defaults to personal feed queries
- On repository pages: provides repository-specific context
- Maintains org/repo information for targeted queries

### Advanced Search Capabilities
Users can ask natural language questions like:
- "Show me recent PRs from microsoft"
- "Find issues from last week"
- "Search for commits in this repository"
- "What activities happened today?"

### Tool Integration
- Uses existing `fetchFeed`, `fetchPublicFeed`, and `fetchFeedPage` functions
- Maintains compatibility with current database structure
- Proper error handling for missing repositories

## Usage Examples

### User Queries
```
"Show me recent PRs from microsoft"
→ Uses queryPublicFeed with filter: "org:microsoft type:pr"

"Find issues in this repository from last week"  
→ Uses queryRepoFeed with current org/repo context

"Search for activities containing 'security'"
→ Uses appropriate feed query with text search
```

### System Responses
The AI assistant provides:
- Formatted results with item counts
- Relevant details (title, type, updated_at, repository info)
- Helpful explanations of search results
- Suggestions for alternative approaches if queries fail

## Technical Implementation

### Environment Setup
- Requires `OPENAI_API_KEY` environment variable
- Uses existing OpenAI client configuration
- Integrates with existing Supabase setup

### Database Integration
- Fetches repository IDs from `repositories` table
- Uses existing feed query functions
- Maintains compatibility with current schema

### Error Handling
- Graceful handling of missing repositories
- Clear error messages for failed queries
- Fallback suggestions for users

## Testing Approach

To test the implementation:

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Test Context Detection**:
   - Visit main feed page (`/page/feed`)
   - Visit repository page (`/[org]/[repo]`)
   - Verify correct context is detected

3. **Test Chat Functionality**:
   - Click floating chat button
   - Try various queries:
     - "Show me recent activities"
     - "Find PRs from microsoft"
     - "Search for issues in this repo"

4. **Test Filter Syntax**:
   - Use special filters: `org:name`, `type:pr`, `from:date`
   - Verify proper parsing and results

## Files Modified

1. `src/app/api/chat/route.ts` - New API route for chat
2. `src/components/shared/floating-chat-button.tsx` - Enhanced with AI chat
3. `package.json` - Added AI SDK dependencies

## Notes

- The implementation uses the existing feed query infrastructure
- Context detection is based on URL pathname patterns
- All existing search filters are supported
- The UI maintains the existing design patterns
- Error handling is comprehensive for production use

## Next Steps

1. Test with real data in development environment
2. Add more sophisticated context detection if needed
3. Consider adding conversation history persistence
4. Potentially add more specialized tools for specific use cases