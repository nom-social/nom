-- Enable PostgREST aggregate functions for efficient like counting
-- This allows us to use GROUP BY with count() in our timeline like queries

ALTER ROLE authenticator SET pgrst.db_aggregates_enabled = 'true';

-- Apply the configuration
NOTIFY pgrst, 'reload config';