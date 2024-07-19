
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
