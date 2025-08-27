const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// Optional AI SDKs – will gracefully fall back if not installed or no API key
let OpenAI, GoogleGenerativeAI;
try { OpenAI = require('openai'); } catch {}
try { ({ GoogleGenerativeAI } = require('@google/generative-ai')); } catch {}

/**
 * POST /api/chatbot/ask  (also mounted on /api/chat/ask by your index.js)
 * Body: { message: string, intent?: string, filters?: { category?: string } }
 * Returns: { answer: string }
 */
router.post('/ask', async (req, res) => {
  const { message = '', intent, filters = {} } = req.body || {};

  // 1) Query upcoming events and do a simple topic match
  let suggestionsText = '';
  try {
    const query = { date: { $gte: new Date() } };
    if (filters.category) query.category = filters.category;

    let events = await Event.find(query).sort({ date: 1 }).limit(50).lean();

    if (message.trim()) {
      const tokens = [...new Set((message.toLowerCase().match(/\b[a-z]{3,}\b/g) || []))];
      if (tokens.length) {
        const re = new RegExp(tokens.join('|'), 'i');
        events = events.filter(e =>
          re.test(e.title) ||
          re.test(e.description || '') ||
          re.test(e.category || '')
        );
      }
    }

    // If user asked “closest”, just keep the soonest ones (already sorted by date)
    const top = events.slice(0, 5);

    if (top.length) {
      suggestionsText =
        'Here are some upcoming events you might like:\n' +
        top.map(e => {
          const when = new Date(e.date).toLocaleString();
          return `• ${e.title} — ${when} @ ${e.location}`;
        }).join('\n');
    } else {
      suggestionsText =
        'I didn’t find a matching event right now. Try another topic or check the All Events page.';
    }
  } catch (err) {
    suggestionsText = 'I had trouble searching events. Please try again.';
  }

  // 2) Try to generate a nicer answer via OpenAI or Gemini (if configured)
  let answer = suggestionsText;
  try {
    if (process.env.OPENAI_API_KEY && OpenAI) {
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const resp = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.5,
        messages: [
          {
            role: 'system',
            content:
              'You are Eventify Assistant. Answer concisely first, then include any event suggestions the tool provides.'
          },
          {
            role: 'user',
            content:
              `${message}\n\nUse these suggestions if helpful:\n${suggestionsText}`
          }
        ]
      });
      answer = resp.choices?.[0]?.message?.content?.trim() || suggestionsText;
    } else if (process.env.GEMINI_API_KEY && GoogleGenerativeAI) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: process.env.GEMINI_MODEL || 'gemini-1.5-flash'
      });
      const resp = await model.generateContent(
        `User question: ${message}\n\nEvent suggestions:\n${suggestionsText}\n\nRespond briefly and clearly.`
      );
      answer = resp.response?.text() || suggestionsText;
    }
  } catch (e) {
    // If AI call fails, keep the suggestionsText
  }

  return res.json({ answer });
});

module.exports = router;
