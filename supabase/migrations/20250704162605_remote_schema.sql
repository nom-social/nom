alter table "public"."repositories_secure" alter column "installation_id" set not null;

alter table "public"."repositories_secure" alter column "installation_id" set data type bigint using "installation_id"::bigint;


