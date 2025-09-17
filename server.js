// server.js - Proxy entre frontend y Hugging Face + servir frontend
import express from "express";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
app.use(express.json());

// Token configurado en Render (Settings -> Environment Variables)
const HF_TOKEN = process.env.HF_TOKEN;
// Modelo por defecto (puedes cambiarlo con la variable HF_MODEL en Render)
const HF_MODEL = process.env.HF_MODEL || "tiiuae/falcon-7b-instruct";

// __dirname para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Servir estáticos desde public/
app.use(express.static(path.join(__dirname, "public")));

// Servir index.html en la raíz
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Endpoint /chat
app.post("/chat", async (req, res) => {
  const userMessage = req.body?.message;
  console.log("📩 Mensaje recibido en /chat:", userMessage);

  // DEBUG: mostrar que HF_TOKEN existe (solo los primeros 5 chars)
  console.log("🔑 HF_TOKEN presente:", HF_TOKEN ? (HF_TOKEN.slice(0,5) + "...") : "NO TOKEN");
  const modelUrl = `https://api-inference.huggingface.co/models/${HF_MODEL}`;
  console.log("👉 Modelo al que llamo:", modelUrl);

  if (!userMessage) return res.status(400).json({ error: "No se recibió mensaje" });
  if (!HF_TOKEN) {
    console.error("⚠️ HF_TOKEN no definido en variables de entorno");
    return res.status(500).json({ error: "HF_TOKEN no definido en servidor" });
  }

  try {
    const response = await fetch(modelUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ inputs: userMessage }),
    });

    // Leemos como texto para poder ver si nos devuelven HTML
    const text = await response.text();
    console.log("📡 Respuesta cruda (primeros 1000 chars):", text.slice(0, 1000).replace(/\s+/g,' '));

    // Intentamos parsear JSON; si no, devolvemos el texto crudo para depuración
    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("❌ No se pudo parsear JSON desde HuggingFace; respuesta fue HTML o texto.");
      return res.status(502).json({ error: "La API devolvió HTML/texto en vez de JSON", details: text.slice(0,2000) });
    }

    if (!response.ok) {
      console.error("❌ Error desde HuggingFace (JSON):", data);
      return res.status(response.status).json({ error: data });
    }

    console.log("✅ Respuesta JSON de HuggingFace:", data);
    const reply = data?.[0]?.generated_text || data?.generated_text || JSON.stringify(data);
    return res.json({ reply });
  } catch (err) {
    console.error("🔥 Error interno en /chat:", err);
    return res.status(500).json({ error: "Error en servidor", details: err.message });
  }
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));