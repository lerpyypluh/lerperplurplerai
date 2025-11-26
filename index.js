const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

const OLLAMA_URL = 'http://localhost:11434';

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app. post('/api/chat', async (req, res) => {
  try {
    const { message, model = 'deepseek-coder' } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res. setHeader('Connection', 'keep-alive');

    const response = await axios.post(
      `${OLLAMA_URL}/api/generate`,
      {
        model,
        prompt: message,
        stream: true,
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
        num_predict: 500,
      },
      { responseType: 'stream' }
    );

    response.data.on('data', (chunk) => {
      const text = chunk.toString();
      const lines = text.split('\n');

      lines.forEach((line) => {
        if (line.trim()) {
          try {
            const json = JSON. parse(line);
            if (json.response) {
              res.write(`data: ${JSON.stringify({ text: json.response })}\n\n`);
            }
          } catch (e) {
            console.error('Parse error:', e. message);
          }
        }
      });
    });

    response.data.on('end', () => {
      res.write('data: [DONE]\n\n');
      res.end();
    });

    response.data.on('error', (error) => {
      console.error('Stream error:', error);
      res. end();
    });
  } catch (error) {
    console. error('Request error:', error. message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API running on http://localhost:${PORT}`);
  console.log(`📡 Using Ollama at ${OLLAMA_URL}`);
});

module.exports = app;