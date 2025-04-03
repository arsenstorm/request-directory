create table "public"."account" (
    "id" text not null,
    "accountId" text not null,
    "providerId" text not null,
    "userId" text not null,
    "accessToken" text,
    "refreshToken" text,
    "idToken" text,
    "accessTokenExpiresAt" timestamp without time zone,
    "refreshTokenExpiresAt" timestamp without time zone,
    "scope" text,
    "password" text,
    "createdAt" timestamp without time zone not null,
    "updatedAt" timestamp without time zone not null
);


alter table "public"."account" enable row level security;

create table "public"."apikey" (
    "id" text not null,
    "name" text,
    "start" text,
    "prefix" text,
    "key" text not null,
    "userId" text not null,
    "refillInterval" integer,
    "refillAmount" integer,
    "lastRefillAt" timestamp without time zone,
    "enabled" boolean,
    "rateLimitEnabled" boolean,
    "rateLimitTimeWindow" integer,
    "rateLimitMax" integer,
    "requestCount" integer,
    "remaining" integer,
    "lastRequest" timestamp without time zone,
    "expiresAt" timestamp without time zone,
    "createdAt" timestamp without time zone not null,
    "updatedAt" timestamp without time zone not null,
    "permissions" text,
    "metadata" text
);


alter table "public"."apikey" enable row level security;

create table "public"."session" (
    "id" text not null,
    "expiresAt" timestamp without time zone not null,
    "token" text not null,
    "createdAt" timestamp without time zone not null,
    "updatedAt" timestamp without time zone not null,
    "ipAddress" text,
    "userAgent" text,
    "userId" text not null
);


alter table "public"."session" enable row level security;

create table "public"."user" (
    "id" text not null,
    "name" text not null,
    "email" text not null,
    "emailVerified" boolean not null,
    "image" text,
    "createdAt" timestamp without time zone not null,
    "updatedAt" timestamp without time zone not null,
    "balance" bigint not null default '0'::bigint
);


alter table "public"."user" enable row level security;

create table "public"."verification" (
    "id" text not null,
    "identifier" text not null,
    "value" text not null,
    "expiresAt" timestamp without time zone not null,
    "createdAt" timestamp without time zone,
    "updatedAt" timestamp without time zone
);


alter table "public"."verification" enable row level security;

CREATE UNIQUE INDEX account_pkey ON public.account USING btree (id);

CREATE UNIQUE INDEX apikey_pkey ON public.apikey USING btree (id);

CREATE UNIQUE INDEX session_pkey ON public.session USING btree (id);

CREATE UNIQUE INDEX session_token_key ON public.session USING btree (token);

CREATE UNIQUE INDEX user_email_key ON public."user" USING btree (email);

CREATE UNIQUE INDEX user_pkey ON public."user" USING btree (id);

CREATE UNIQUE INDEX verification_pkey ON public.verification USING btree (id);

alter table "public"."account" add constraint "account_pkey" PRIMARY KEY using index "account_pkey";

alter table "public"."apikey" add constraint "apikey_pkey" PRIMARY KEY using index "apikey_pkey";

alter table "public"."session" add constraint "session_pkey" PRIMARY KEY using index "session_pkey";

alter table "public"."user" add constraint "user_pkey" PRIMARY KEY using index "user_pkey";

alter table "public"."verification" add constraint "verification_pkey" PRIMARY KEY using index "verification_pkey";

alter table "public"."account" add constraint "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"(id) not valid;

alter table "public"."account" validate constraint "account_userId_fkey";

alter table "public"."apikey" add constraint "apikey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"(id) not valid;

alter table "public"."apikey" validate constraint "apikey_userId_fkey";

alter table "public"."session" add constraint "session_token_key" UNIQUE using index "session_token_key";

alter table "public"."session" add constraint "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"(id) not valid;

alter table "public"."session" validate constraint "session_userId_fkey";

alter table "public"."user" add constraint "user_email_key" UNIQUE using index "user_email_key";

grant delete on table "public"."account" to "anon";

grant insert on table "public"."account" to "anon";

grant references on table "public"."account" to "anon";

grant select on table "public"."account" to "anon";

grant trigger on table "public"."account" to "anon";

grant truncate on table "public"."account" to "anon";

grant update on table "public"."account" to "anon";

grant delete on table "public"."account" to "authenticated";

grant insert on table "public"."account" to "authenticated";

grant references on table "public"."account" to "authenticated";

grant select on table "public"."account" to "authenticated";

grant trigger on table "public"."account" to "authenticated";

grant truncate on table "public"."account" to "authenticated";

grant update on table "public"."account" to "authenticated";

grant delete on table "public"."account" to "service_role";

grant insert on table "public"."account" to "service_role";

grant references on table "public"."account" to "service_role";

grant select on table "public"."account" to "service_role";

grant trigger on table "public"."account" to "service_role";

grant truncate on table "public"."account" to "service_role";

grant update on table "public"."account" to "service_role";

grant delete on table "public"."apikey" to "anon";

grant insert on table "public"."apikey" to "anon";

grant references on table "public"."apikey" to "anon";

grant select on table "public"."apikey" to "anon";

grant trigger on table "public"."apikey" to "anon";

grant truncate on table "public"."apikey" to "anon";

grant update on table "public"."apikey" to "anon";

grant delete on table "public"."apikey" to "authenticated";

grant insert on table "public"."apikey" to "authenticated";

grant references on table "public"."apikey" to "authenticated";

grant select on table "public"."apikey" to "authenticated";

grant trigger on table "public"."apikey" to "authenticated";

grant truncate on table "public"."apikey" to "authenticated";

grant update on table "public"."apikey" to "authenticated";

grant delete on table "public"."apikey" to "service_role";

grant insert on table "public"."apikey" to "service_role";

grant references on table "public"."apikey" to "service_role";

grant select on table "public"."apikey" to "service_role";

grant trigger on table "public"."apikey" to "service_role";

grant truncate on table "public"."apikey" to "service_role";

grant update on table "public"."apikey" to "service_role";

grant delete on table "public"."session" to "anon";

grant insert on table "public"."session" to "anon";

grant references on table "public"."session" to "anon";

grant select on table "public"."session" to "anon";

grant trigger on table "public"."session" to "anon";

grant truncate on table "public"."session" to "anon";

grant update on table "public"."session" to "anon";

grant delete on table "public"."session" to "authenticated";

grant insert on table "public"."session" to "authenticated";

grant references on table "public"."session" to "authenticated";

grant select on table "public"."session" to "authenticated";

grant trigger on table "public"."session" to "authenticated";

grant truncate on table "public"."session" to "authenticated";

grant update on table "public"."session" to "authenticated";

grant delete on table "public"."session" to "service_role";

grant insert on table "public"."session" to "service_role";

grant references on table "public"."session" to "service_role";

grant select on table "public"."session" to "service_role";

grant trigger on table "public"."session" to "service_role";

grant truncate on table "public"."session" to "service_role";

grant update on table "public"."session" to "service_role";

grant delete on table "public"."user" to "anon";

grant insert on table "public"."user" to "anon";

grant references on table "public"."user" to "anon";

grant select on table "public"."user" to "anon";

grant trigger on table "public"."user" to "anon";

grant truncate on table "public"."user" to "anon";

grant update on table "public"."user" to "anon";

grant delete on table "public"."user" to "authenticated";

grant insert on table "public"."user" to "authenticated";

grant references on table "public"."user" to "authenticated";

grant select on table "public"."user" to "authenticated";

grant trigger on table "public"."user" to "authenticated";

grant truncate on table "public"."user" to "authenticated";

grant update on table "public"."user" to "authenticated";

grant delete on table "public"."user" to "service_role";

grant insert on table "public"."user" to "service_role";

grant references on table "public"."user" to "service_role";

grant select on table "public"."user" to "service_role";

grant trigger on table "public"."user" to "service_role";

grant truncate on table "public"."user" to "service_role";

grant update on table "public"."user" to "service_role";

grant delete on table "public"."verification" to "anon";

grant insert on table "public"."verification" to "anon";

grant references on table "public"."verification" to "anon";

grant select on table "public"."verification" to "anon";

grant trigger on table "public"."verification" to "anon";

grant truncate on table "public"."verification" to "anon";

grant update on table "public"."verification" to "anon";

grant delete on table "public"."verification" to "authenticated";

grant insert on table "public"."verification" to "authenticated";

grant references on table "public"."verification" to "authenticated";

grant select on table "public"."verification" to "authenticated";

grant trigger on table "public"."verification" to "authenticated";

grant truncate on table "public"."verification" to "authenticated";

grant update on table "public"."verification" to "authenticated";

grant delete on table "public"."verification" to "service_role";

grant insert on table "public"."verification" to "service_role";

grant references on table "public"."verification" to "service_role";

grant select on table "public"."verification" to "service_role";

grant trigger on table "public"."verification" to "service_role";

grant truncate on table "public"."verification" to "service_role";

grant update on table "public"."verification" to "service_role";

create policy "deny_all_account"
on "public"."account"
as permissive
for all
to public
using (false);


create policy "deny_all_apikey"
on "public"."apikey"
as permissive
for all
to public
using (false);


create policy "deny_all_session"
on "public"."session"
as permissive
for all
to public
using (false);


create policy "deny_all_user"
on "public"."user"
as permissive
for all
to public
using (false);


create policy "deny_all_verification"
on "public"."verification"
as permissive
for all
to public
using (false);



