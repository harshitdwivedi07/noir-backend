const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

module.exports = pool.promise();

// 🔥 Add this to test connection
pool.getConnection((err, conn) => {
  if (err) {
    console.error("❌ DB ERROR:", err);
  } else {
    console.log("✅ MySQL Connected");
    conn.release();
  }
});

module.exports = db;