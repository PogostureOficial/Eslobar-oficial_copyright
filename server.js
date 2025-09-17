// server.js - Proxy entre tu frontend y Hugging Face
import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// 🔑 El token lo configurarás en Render como variable de entorno
const HF_TOKEN = process.env.HF_TOKEN;

// Ruta POST /chat -> recibe mensaje del frontend y llama a Hugging Face
app.post("/chat", async (req, res) => {
  try {
    const response = await fetch("https://api-inference.huggingface.co/models/distilgpt2", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: req.body.message })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    res.json(data); // 🔙 enviamos al frontend el JSON tal cual
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Render usa PORT automáticamente (local: 3000)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
