alter table "public"."public_timeline" add column "search_text" text;

alter table "public"."public_timeline" add column "search_vector" tsvector;

alter table "public"."user_timeline" add column "search_text" text;

alter table "public"."user_timeline" add column "search_vector" tsvector;

CREATE INDEX public_timeline_search_vector_idx ON public.public_timeline USING gin (search_vector);

CREATE INDEX user_timeline_search_vector_idx ON public.user_timeline USING gin (search_vector);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.extract_timeline_search_text(data jsonb, type text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_timeline_search_vector()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Generate search vector from search_text column
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.search_text, ''));
    RETURN NEW;
END;
$function$
;

CREATE TRIGGER update_public_timeline_search_vector BEFORE INSERT OR UPDATE OF search_text ON public.public_timeline FOR EACH ROW EXECUTE FUNCTION update_timeline_search_vector();

CREATE TRIGGER update_user_timeline_search_vector BEFORE INSERT OR UPDATE OF search_text ON public.user_timeline FOR EACH ROW EXECUTE FUNCTION update_timeline_search_vector();


