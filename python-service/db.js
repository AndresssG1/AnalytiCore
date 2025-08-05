const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "postgres", // nombre del contenedor del servicio en docker-compose
  database: "analyti_core",
  password: "postgres",
  port: 5432,
});

module.exports = pool;
