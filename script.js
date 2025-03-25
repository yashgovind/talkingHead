require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const googleTTS = require('google-tts-api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));


// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);

// console.log("Gemini API Key:", process.env.GOOGLE_GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

/**
 * Endpoint to generate text from Gemini API.
 * Expects a JSON body: { "prompt": "your prompt here" }
 */

/**
 * Endpoint to generate TTS audio from Gemini API output.
 * Expects a JSON body: { "prompt": "your prompt here" }
 * Returns audio/mpeg binary data.
 */
app.post('/ai/tts', async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });

      // Generate text from Gemini API
      const result = await model.generateContent(prompt);
      let generatedText = result.response.text().trim();
      console.log('Original Gemini generated text:', generatedText);

      // Truncate to 200 characters if longer
      // Generate Google TTS URL from the generated text
      if (generatedText > 100) {
        generatedText = generatedText.substring(0, 100).trim();
      }
      console.log('generated text', generatedText);
      const ttsUrl = googleTTS.getAudioUrl(generatedText, {
        lang: 'en',
        slow: false,
      });
      console.log('Generated TTS URL:', ttsUrl);

      // Fetch the audio data from Google TTS
      const ttsResponse = await axios.get(ttsUrl, { responseType: 'arraybuffer' });

      // Convert the audio data to base64
        const audioBase64 = Buffer.from(ttsResponse.data, 'binary').toString('base64');
        console.log(typeof audioBase64);

      // Return JSON with both text and audio data
      res.json({ text: generatedText, audio: audioBase64 });
    } catch (error) {
      console.error('Error in /ai/tts:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Failed to generate TTS audio.' });
    }
  });


app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
