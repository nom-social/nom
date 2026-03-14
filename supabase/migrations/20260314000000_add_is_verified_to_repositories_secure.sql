alter table "public"."repositories" add column "is_verified" boolean not null default false;

update "public"."repositories" set "is_verified" = true;
