import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "rentmything",
    password: "Soham@12345",
    port: 5433,
});

pool.connect()
    .then(() => console.log("PostgreSQL Connected"))
    .catch(err => console.error("PostgreSQL Error:", err));

export default pool;