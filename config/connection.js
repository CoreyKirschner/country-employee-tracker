// import mysql2
const mysql2 = require('mysql2');

// connect to database
const connection = mysql2.createConnection(
    {
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'my_database'
    },
);
// export connection
module.exports = connection;