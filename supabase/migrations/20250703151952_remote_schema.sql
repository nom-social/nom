alter table "public"."repositories" add column "champion_github_username" text;

CREATE UNIQUE INDEX repositories_users_user_id_repo_id_key ON public.repositories_users USING btree (user_id, repo_id);

alter table "public"."repositories_users" add constraint "repositories_users_user_id_repo_id_key" UNIQUE using index "repositories_users_user_id_repo_id_key";


