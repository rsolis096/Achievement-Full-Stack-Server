
## A demonstration of the site is available at https://completiontracker.com/
#### This site supports log in via Steam and a demo mode is avialable to demonstrate functionality
#### IMPORTANT:
##### - The site is a work in progress, and I can't gauruntee it will always remain accessible.
##### - SteamID, Display Name, and Profile Picture are used by the site to get achievement information and are saved for requests made during the session
##### - The site will not display any information if your Steam Account is set to private.

## Dependencies
NodeJS - https://nodejs.org/en/download/prebuilt-installer

Package requirements listed in package.json or run npm install

## Create a .env file in the root of the project with the following variables:

|Variable| Description|
|-----|-----
|WEB_API_KEY | Steam WebAPI key - Available Here : https://steamapi.xpaw.me/
|ACCESS_TOKEN | Steam Access Token - Available Here : https://steamapi.xpaw.me/
|DB_USER| Database Username|
|DB_HOST | Database Host|
|DB_NAME | Database Name|
|DB_PASSWORD| Database Passowrd|
|DB_PORT| Database Port|
|SERVER_PORT| Port for server|
|CLIENT_DOMAIN | The domain for the client |
|SERVER_DOMAIN | The domain for the server |
|SECRET | A unique strin|
|SSL | Database SSL Requirements|

This project was built using a postgreSQL database

## To reconstruct the database used for this project, run the following scripts in pgAdmin

```
CREATE TABLE IF NOT EXISTS public.games
(
    appid bigint NOT NULL,
    name character varying(255) COLLATE pg_catalog."default" NOT NULL,
    has_community_visible_stats boolean,
    global_achievements jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    game_achievements jsonb,
    CONSTRAINT games_pkey PRIMARY KEY (appid)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.games
    OWNER to postgres;
```

```
-- Table: public.user_games

-- DROP TABLE IF EXISTS public.user_games;

CREATE TABLE IF NOT EXISTS public.user_games
(
    id integer NOT NULL DEFAULT nextval('user_games_id_seq'::regclass),
    steam_id bigint,
    appid bigint,
    playtime_forever integer DEFAULT 0,
    user_achievements jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_games_pkey PRIMARY KEY (id),
    CONSTRAINT user_games_steam_id_app_id_key UNIQUE (steam_id, appid),
    CONSTRAINT user_games_app_id_fkey FOREIGN KEY (appid)
        REFERENCES public.games (appid) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT user_games_steam_id_fkey FOREIGN KEY (steam_id)
        REFERENCES public.users (steam_id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.user_games
    OWNER to postgres;
-- Index: idx_user_games_game_id

-- DROP INDEX IF EXISTS public.idx_user_games_game_id;

CREATE INDEX IF NOT EXISTS idx_user_games_game_id
    ON public.user_games USING btree
    (appid ASC NULLS LAST)
    TABLESPACE pg_default;
-- Index: idx_user_games_user_id

-- DROP INDEX IF EXISTS public.idx_user_games_user_id;

CREATE INDEX IF NOT EXISTS idx_user_games_user_id
    ON public.user_games USING btree
    (steam_id ASC NULLS LAST)
    TABLESPACE pg_default;
```

```
-- Table: public.users

-- DROP TABLE IF EXISTS public.users;

CREATE TABLE IF NOT EXISTS public.users
(
    steam_id bigint NOT NULL,
    displayname character varying(255) COLLATE pg_catalog."default" NOT NULL,
    photos text[] COLLATE pg_catalog."default",
    CONSTRAINT users_pkey PRIMARY KEY (steam_id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.users
    OWNER to postgres;
```
