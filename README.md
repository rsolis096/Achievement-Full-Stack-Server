# The following dependencies are required to run the server

NodeJS - ghttps://nodejs.org/en/download/prebuilt-installer

## Required NPM Packages:

- axios: "^1.6.8",
- cors: "^2.8.5",
- dotenv: "^16.4.5",
- ejs: "^3.1.10",
- express": "^4.19.2",
- nodemon": "^3.1.2",
- pg": "^8.11.5"

- @types/cors: "^2.8.17",
- @types/express: "^4.17.21",
- @types/node: "^20.12.11",
- @types/pg: "^8.11.6",
- typescript: "^5.4.5"



# Create a .env file in the root of the project with the following variables:

- WEB_API_KEY 
- ACCESS_TOKEN  (Expires every 24 hours, choose store option)
- STEAM_ID
- POSTGRES_PASSWORD

A convenient tool for accessing these Steam variables can be found here https://steamapi.xpaw.me/

Currently, you must create your own postgresql database.
