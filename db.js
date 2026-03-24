const mysql = require('mysql2');

const pool = mysql.createPool({
  host:     'localhost',
  user:     'root',
  password: '1234', // paste your actual password here
  database: 'noir_fashion',
});

const db = pool.promise();

module.exports = db 