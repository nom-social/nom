create table "public"."repositories_users" (
    "id" uuid not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
    "repo_id" uuid not null,
    "user_id" uuid not null
);


alter table "public"."repositories_users" enable row level security;

CREATE UNIQUE INDEX repositories_users_pkey ON public.repositories_users USING btree (id);

alter table "public"."repositories_users" add constraint "repositories_users_pkey" PRIMARY KEY using index "repositories_users_pkey";

alter table "public"."repositories_users" add constraint "repositories_users_repo_id_fkey" FOREIGN KEY (repo_id) REFERENCES repositories(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."repositories_users" validate constraint "repositories_users_repo_id_fkey";

alter table "public"."repositories_users" add constraint "repositories_users_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."repositories_users" validate constraint "repositories_users_user_id_fkey";

grant delete on table "public"."repositories_users" to "anon";

grant insert on table "public"."repositories_users" to "anon";

grant references on table "public"."repositories_users" to "anon";

grant select on table "public"."repositories_users" to "anon";

grant trigger on table "public"."repositories_users" to "anon";

grant truncate on table "public"."repositories_users" to "anon";

grant update on table "public"."repositories_users" to "anon";

grant delete on table "public"."repositories_users" to "authenticated";

grant insert on table "public"."repositories_users" to "authenticated";

grant references on table "public"."repositories_users" to "authenticated";

grant select on table "public"."repositories_users" to "authenticated";

grant trigger on table "public"."repositories_users" to "authenticated";

grant truncate on table "public"."repositories_users" to "authenticated";

grant update on table "public"."repositories_users" to "authenticated";

grant delete on table "public"."repositories_users" to "service_role";

grant insert on table "public"."repositories_users" to "service_role";

grant references on table "public"."repositories_users" to "service_role";

grant select on table "public"."repositories_users" to "service_role";

grant trigger on table "public"."repositories_users" to "service_role";

grant truncate on table "public"."repositories_users" to "service_role";

grant update on table "public"."repositories_users" to "service_role";


