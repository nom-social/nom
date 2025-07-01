

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."github_event_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "event_type" "text" NOT NULL,
    "action" "text",
    "repo" "text" NOT NULL,
    "org" "text" NOT NULL,
    "raw_payload" "jsonb" NOT NULL,
    "last_processed" timestamp with time zone
);


ALTER TABLE "public"."github_event_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."public_timeline" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "score" integer NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "data" "jsonb" NOT NULL,
    "repo_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "categories" "text"[],
    "snooze_to" timestamp with time zone,
    "dedupe_hash" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "event_ids" "text"[]
);


ALTER TABLE "public"."public_timeline" OWNER TO "postgres";


COMMENT ON TABLE "public"."public_timeline" IS 'This is a duplicate of user_timeline';



COMMENT ON COLUMN "public"."public_timeline"."event_ids" IS 'Mostly for backtracking and debugging purposes';



CREATE TABLE IF NOT EXISTS "public"."repositories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "repo" "text" NOT NULL,
    "org" "text" NOT NULL,
    "metadata" "jsonb"
);


ALTER TABLE "public"."repositories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."repositories_secure" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "secret" "text",
    "access_token" "text",
    "settings" "jsonb"
);


ALTER TABLE "public"."repositories_secure" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "user_id" "uuid" NOT NULL,
    "repo_id" "uuid" NOT NULL
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."timeline_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "user_id" "uuid" NOT NULL,
    "dedupe_hash" "text" NOT NULL
);


ALTER TABLE "public"."timeline_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_timeline" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "user_id" "uuid" NOT NULL,
    "score" integer NOT NULL,
    "is_read" boolean DEFAULT false NOT NULL,
    "data" "jsonb" NOT NULL,
    "repo_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "categories" "text"[],
    "snooze_to" timestamp with time zone,
    "dedupe_hash" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "event_ids" "text"[]
);


ALTER TABLE "public"."user_timeline" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_timeline"."event_ids" IS 'Mostly for backtracking and debugging purposes';



CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT ("now"() AT TIME ZONE 'utc'::"text") NOT NULL,
    "github_username" "text" NOT NULL,
    "email" "text" NOT NULL
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."github_event_log"
    ADD CONSTRAINT "github_event_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."timeline_likes"
    ADD CONSTRAINT "likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."public_timeline"
    ADD CONSTRAINT "public_timeline_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."repositories"
    ADD CONSTRAINT "repos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."repositories_secure"
    ADD CONSTRAINT "repositories_secure_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_repo_id_key" UNIQUE ("user_id", "repo_id");



ALTER TABLE ONLY "public"."public_timeline"
    ADD CONSTRAINT "unique_dedupe_hash" UNIQUE ("dedupe_hash");



ALTER TABLE ONLY "public"."repositories"
    ADD CONSTRAINT "unique_org_repo" UNIQUE ("org", "repo");



ALTER TABLE ONLY "public"."user_timeline"
    ADD CONSTRAINT "user_timeline_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_timeline"
    ADD CONSTRAINT "user_timeline_user_id_dedupe_hash_unique" UNIQUE ("user_id", "dedupe_hash");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."timeline_likes"
    ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."public_timeline"
    ADD CONSTRAINT "public_timeline_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "public"."repositories"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."repositories_secure"
    ADD CONSTRAINT "repositories_secure_id_fkey" FOREIGN KEY ("id") REFERENCES "public"."repositories"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "public"."repositories"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_timeline"
    ADD CONSTRAINT "user_timeline_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "public"."repositories"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_timeline"
    ADD CONSTRAINT "user_timeline_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON UPDATE CASCADE ON DELETE CASCADE;



CREATE POLICY "Allow authenticated users to create their own subscriptions" ON "public"."subscriptions" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Allow authenticated users to delete their own subscriptions" ON "public"."subscriptions" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Allow authenticated users to update their own user_timeline rec" ON "public"."user_timeline" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Allow authenticated users to view their own subscriptions" ON "public"."subscriptions" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Allow users to update their own records" ON "public"."users" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id")) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Enable delete for users based on id" ON "public"."users" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."timeline_likes" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable delete for users based on user_id" ON "public"."user_timeline" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable insert for users based on user_id" ON "public"."timeline_likes" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable insert for users based on user_id" ON "public"."user_timeline" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable insert for users based on user_id" ON "public"."users" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "id"));



CREATE POLICY "Enable read access for all users" ON "public"."public_timeline" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."repositories" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."subscriptions" FOR SELECT USING (true);



CREATE POLICY "Enable read access for all users" ON "public"."timeline_likes" FOR SELECT USING (true);



CREATE POLICY "Enable users to view their own data only" ON "public"."user_timeline" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "user_id"));



CREATE POLICY "Enable users to view their own data only" ON "public"."users" FOR SELECT TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") = "id"));



ALTER TABLE "public"."github_event_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."public_timeline" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."repositories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."repositories_secure" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."timeline_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_timeline" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";








































































































































































GRANT ALL ON TABLE "public"."github_event_log" TO "anon";
GRANT ALL ON TABLE "public"."github_event_log" TO "authenticated";
GRANT ALL ON TABLE "public"."github_event_log" TO "service_role";



GRANT ALL ON TABLE "public"."public_timeline" TO "anon";
GRANT ALL ON TABLE "public"."public_timeline" TO "authenticated";
GRANT ALL ON TABLE "public"."public_timeline" TO "service_role";



GRANT ALL ON TABLE "public"."repositories" TO "anon";
GRANT ALL ON TABLE "public"."repositories" TO "authenticated";
GRANT ALL ON TABLE "public"."repositories" TO "service_role";



GRANT ALL ON TABLE "public"."repositories_secure" TO "anon";
GRANT ALL ON TABLE "public"."repositories_secure" TO "authenticated";
GRANT ALL ON TABLE "public"."repositories_secure" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."timeline_likes" TO "anon";
GRANT ALL ON TABLE "public"."timeline_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."timeline_likes" TO "service_role";



GRANT ALL ON TABLE "public"."user_timeline" TO "anon";
GRANT ALL ON TABLE "public"."user_timeline" TO "authenticated";
GRANT ALL ON TABLE "public"."user_timeline" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
