-- Add full text search support to timeline tables

-- Add search_vector column to public_timeline table
ALTER TABLE "public"."public_timeline" 
ADD COLUMN "search_vector" tsvector;

-- Add search_vector column to user_timeline table  
ALTER TABLE "public"."user_timeline"
ADD COLUMN "search_vector" tsvector;

-- Create function to extract searchable text from timeline data
CREATE OR REPLACE FUNCTION extract_timeline_search_text(data jsonb, type text)
RETURNS text AS $$
DECLARE
    title_text text := '';
    summary_text text := '';
BEGIN
    -- Extract title and summary based on timeline type
    CASE type
        WHEN 'pull_request' THEN
            title_text := COALESCE(data->'pull_request'->>'title', '');
            summary_text := COALESCE(data->'pull_request'->>'ai_summary', '');
        WHEN 'issue' THEN  
            title_text := COALESCE(data->'issue'->>'title', '');
            summary_text := COALESCE(data->'issue'->>'ai_summary', '');
        WHEN 'release' THEN
            title_text := COALESCE(
                data->'release'->>'name', 
                data->'release'->>'tag_name', 
                ''
            );
            summary_text := COALESCE(data->'release'->>'ai_summary', '');
        WHEN 'push' THEN
            title_text := COALESCE(data->'push'->>'title', '');
            summary_text := COALESCE(data->'push'->>'ai_summary', '');
        ELSE
            -- For any other types, try to extract common fields
            title_text := '';
            summary_text := '';
    END CASE;
    
    -- Combine title and summary, clean up whitespace
    RETURN trim(concat_ws(' ', title_text, summary_text));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_timeline_search_vector()
RETURNS trigger AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        extract_timeline_search_text(NEW.data, NEW.type)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update search_vector on insert/update
CREATE TRIGGER update_public_timeline_search_vector
    BEFORE INSERT OR UPDATE OF data, type ON "public"."public_timeline"
    FOR EACH ROW EXECUTE FUNCTION update_timeline_search_vector();

CREATE TRIGGER update_user_timeline_search_vector  
    BEFORE INSERT OR UPDATE OF data, type ON "public"."user_timeline"
    FOR EACH ROW EXECUTE FUNCTION update_timeline_search_vector();

-- Create GIN indexes for fast full text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS public_timeline_search_vector_idx 
ON "public"."public_timeline" USING gin(search_vector);

CREATE INDEX CONCURRENTLY IF NOT EXISTS user_timeline_search_vector_idx
ON "public"."user_timeline" USING gin(search_vector);

-- Update existing rows to populate search_vector
UPDATE "public"."public_timeline" 
SET search_vector = to_tsvector('english', 
    extract_timeline_search_text(data, type)
);

UPDATE "public"."user_timeline"
SET search_vector = to_tsvector('english',
    extract_timeline_search_text(data, type)
);

-- Add comments for documentation
COMMENT ON COLUMN "public"."public_timeline"."search_vector" IS 'Full text search vector for title and summary content';
COMMENT ON COLUMN "public"."user_timeline"."search_vector" IS 'Full text search vector for title and summary content';
COMMENT ON FUNCTION extract_timeline_search_text(jsonb, text) IS 'Extracts searchable text from timeline activity data based on type';
COMMENT ON FUNCTION update_timeline_search_vector() IS 'Trigger function to automatically update search vector when data changes';