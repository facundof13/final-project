--- Database Systems Final Project ---

This readme contains all of the files needed to get the database and user interface up and running locally.

--- YouTube Video Link ---

https://www.youtube.com/watch?v=V2UWeOcys90

Please raise the quality of the video to the highest setting to allow you to more clearly read the text.

--- Getting Started with the Database ---

NOTE: I am using version 14 of PostgreSQL for the database server


1. Remove the .txt extension on all of the *.sql.txt files. This will turn them into regular sql files.
2. Run all of the commands in the creation.sql file in order. It is important that the order is correct, otherwise, there may be tables that are not created.
3. Run all of the commands in the data.sql file in order. It is important that the order is correct, otherwise, there may be tables whose data is not populated.

--- Getting the Command Line App Running ---

>I am using v14.17.6 of Node.js and v6.14.15 of npm


First clone https://github.com/facundof13/final-project

1. Install the correct version of Node.js.
   1. Node.js can be found at https://nodejs.org/en/
   2. Here are the official docs for installing Node.js if you need more help https://docs.npmjs.com/downloading-and-installing-node-js-and-npm
2. Once Node.js is installed, open your terminal app of choice and navigate into the user-interface directory of the the github project you have cloned
3. Once inside the user-interface directory, install the necessary packages by running `npm install` in the command line
4. Once everything installs successfully, open the file `services/knexService.js` and ensure that the `host`, `port`, `database`, `username` and `password` (if needed) are accurate to your current instance of PostgreSQL.
5. Then, you can start the program by running the command `npm start`

NOTE: The database must be up & running before this cmd line app will work.
