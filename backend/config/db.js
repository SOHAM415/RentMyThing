import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
    user: process.env.POSTGRES_USER || "postgres",
    host: process.env.POSTGRES_HOST || "localhost",
    database: process.env.POSTGRES_DB || "rentmything",
    password: process.env.POSTGRES_PASSWORD || "Soham@12345",
    port: Number(process.env.POSTGRES_PORT || 5433),
});

pool.connect()
    .then(() => console.log("PostgreSQL Connected"))
    .catch(err => console.error("PostgreSQL Error:", err));

export default pool;