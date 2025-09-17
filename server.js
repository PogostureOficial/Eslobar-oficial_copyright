// server.js
import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

// Cargar variables de entorno (.env en local o Render en producción)
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const HF_TOKEN = process.env.HF_TOKEN;

app.use(express.json());

// 🔹 Ruta de test
app.get("/", (req, res) => {
  res.send("Servidor funcionando 🚀");
});

// 🔹 Endpoint de chat
app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    console.log("📩 Mensaje recibido:", userMessage);

    // ⚡ Modelo gratuito y probado
    const modelUrl = "https://api-inference.huggingface.co/models/facebook/blenderbot-400M-distill";

    console.log("🔑 HF_TOKEN:", HF_TOKEN ? HF_TOKEN.slice(0, 5) + "..." : "NO TOKEN");
    console.log("👉 Modelo al que llamo:", modelUrl);

    const response = await fetch(modelUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ inputs: userMessage }),
    });

    // Recibir como texto (por si viene HTML)
    const text = await response.text();
    console.log("📡 Respuesta cruda:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (err) {
      console.error("❌ No se pudo parsear JSON, parece HTML");
      return res.status(500).json({
        reply: "⚠️ La API devolvió HTML en vez de JSON. Revisa la URL o el token.",
      });
    }

    console.log("✅ Respuesta HuggingFace (JSON):", data);

    const botReply =
      data[0]?.generated_text || data.generated_text || "No entendí.";
    res.json({ reply: botReply });
  } catch (error) {
    console.error("❌ Error en el servidor:", error);
    res.status(500).json({ reply: "Error en el servidor." });
  }
});

// 🔹 Levantar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});