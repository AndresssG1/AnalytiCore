const express = require("express");
const cors = require("cors"); // ✅ Importar CORS
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const pool = require("./db");

const app = express();
const PORT = 3000;

app.use(cors()); // ✅ Habilitar CORS
app.use(express.json());

// POST /submit
app.post("/submit", async (req, res) => {
  const { texto } = req.body;
  if (!texto) return res.status(400).json({ error: "Falta texto" });

  const jobId = uuidv4();

  try {
    // Guardar como PENDIENTE
    await pool.query(
      `INSERT INTO jobs (id, texto, estado) VALUES ($1, $2, $3)`,
      [jobId, texto, "PENDIENTE"]
    );

    // Llamar a Java
    await pool.query(`UPDATE jobs SET estado = 'PROCESANDO' WHERE id = $1`, [
      jobId,
    ]);
    const response = await axios.post(
      `${process.env.ANALYSIS_SERVICE_URL}/analyze`,
      { texto }
    );

    // Guardar resultado
    await pool.query(
      `UPDATE jobs SET estado = 'COMPLETADO', resultado = $1 WHERE id = $2`,
      [response.data, jobId]
    );

    res.json({ jobId });
  } catch (err) {
    console.error("Error:", err);
    await pool.query(
      `UPDATE jobs SET estado = 'FALLIDO', resultado = $1 WHERE id = $2`,
      [{ error: "Error al analizar" }, jobId]
    );
    res.status(500).json({ error: "Error interno" });
  }
});

// GET /status/:id
app.get("/status/:id", async (req, res) => {
  const { rows } = await pool.query(`SELECT * FROM jobs WHERE id = $1`, [
    req.params.id,
  ]);
  if (rows.length === 0)
    return res.status(404).json({ error: "Job no encontrado" });
  res.json(rows[0]);
});

app.listen(PORT, () => {
  console.log(`python-service en http://localhost:${PORT}`);
});
