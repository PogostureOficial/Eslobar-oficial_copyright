// server.js - Proxy entre frontend y Hugging Face + servir frontend
import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

// 🔑 Token de Hugging Face desde variable de entorno (Render)
const HF_TOKEN = process.env.HF_TOKEN;

// 🔹 Corregir __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔹 Servir archivos estáticos desde public/
app.use(express.static(path.join(__dirname, "public")));

// 🔹 Redirigir "/" a index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 🔹 Endpoint /chat
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) return res.status(400).json({ error: "No se recibió mensaje" });

    const response = await fetch(
      "https://api-inference.huggingface.co/models/gpt2", 
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HF_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: userMessage }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    res.json(data); // enviamos la respuesta al frontend

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 🔹 Puerto (Render usa process.env.PORT)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));

const data = await response.json();
console.log("Respuesta HF:", data); // 👈 para depuración
res.json(data);
