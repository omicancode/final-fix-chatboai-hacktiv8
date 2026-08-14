import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const upload = multer();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = "gemini-3.5-flash-lite";

app.use(cors());
app.use(express.json());

// Load instruksi sistem dari file eksternal agar mudah diubah
const getSystemInstruction = () => {
  try {
    return fs.readFileSync(path.join(__dirname, 'data_sekolah.txt'), 'utf8');
  } catch (err) {
    console.error("Gagal membaca data_sekolah.txt:", err);
    return "Jawab hanya menggunakan bahasa Indonesia. Anda adalah asisten virtual.";
  }
};

app.get('/', (req, res) => {
  res.send('Hello masihsan! Travel Chatbot API is running.');
});

app.post('/generate-text', async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt
    });

    res.status(200).json({ result: response.text });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
});

app.post(
  "/generate-from-file",
  upload.single("file"),
  async (req, res) => {
    try {
      const { prompt } = req.body;
      const base64File = req.file.buffer.toString("base64");

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [
          {
            text:
              prompt ?? "Make me a summary of this file",
          },
          {
            inlineData: {
              data: base64File,
              mimeType: req.file.mimetype,
            },
          },
        ],
      });

      res.status(200).json({ result: response.text });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error.message });
    }
  },
);

app.post("/api/chat", async (req, res) => {
  const { conversation } = req.body;

  try {
    if (!Array.isArray(conversation)) {
      return res.status(400).json({ error: "Messages must be an array" });
    }

    const contents = conversation.map(({ role, text }) => ({
      role: role === 'bot' ? 'model' : role,
      parts: [{ text }],
    }));

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        temperature: 0.9,
        systemInstruction: getSystemInstruction(),
      },
    });

    res.status(200).json({ result: response.text });
  } catch (e) {
    console.error("Chat Error:", e);
    res.status(500).json({ error: e.message || "Internal server error" });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));