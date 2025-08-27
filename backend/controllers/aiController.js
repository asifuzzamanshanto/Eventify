// backend/controllers/aiController.js
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.chatSuggest = async (req, res) => {
  try {
    const { message = '' } = req.body || {};
    let reply = '';

    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const out = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are Eventify Assistant. Be concise and helpful.' },
          { role: 'user', content: message },
        ],
      });
      reply = out.choices?.[0]?.message?.content?.trim() || 'Okay.';
    } else if (process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const out = await model.generateContent(message);
      reply = out.response.text().trim();
    } else {
      reply = 'AI is not configured. Set OPENAI_API_KEY or GEMINI_API_KEY.';
    }

    res.json({ reply });
  } catch (err) {
    console.error('AI error:', err);
    res.status(500).json({ reply: 'Sorry, something went wrong.' });
  }
};
