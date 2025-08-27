const Event = require('../models/Event');
const axios = require('axios');

// ENV:
// AI_PROVIDER=openai | gemini
// OPENAI_API_KEY=sk-...
// GEMINI_API_KEY=...

exports.chatSuggest = async (req, res) => {
  try {
    const { message = '' } = req.body || {};
    const now = new Date();

    // 1) Fetch upcoming events (next 90 days)
    const horizon = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const events = await Event.find({
      date: { $gte: now, $lte: horizon },
      status: { $ne: 'Archived' }
    })
      .sort({ date: 1 })
      .select('title description category location date _id imageUrl')
      .lean();

    // 2) Very light keyword scoring + "closest date" boost
    const top = rankEventsByQuery(message, events).slice(0, 6);

    // 3) Build compact context for the model
    const ctx = top.map(e => {
      const d = new Date(e.date).toLocaleString();
      return `• ${e.title} — ${d} — ${e.location || 'TBA'} — Category: ${e.category || '-'} — /events/${e._id}`;
    }).join('\n');

    const system = [
      `You are Eventify Assistant. Be concise and friendly.`,
      `Primary goals:`,
      `1) Answer the user's question.`,
      `2) Recommend 1–5 relevant upcoming events.`,
      `3) If the user asked for "closest" or "when", prefer the soonest dates.`,
      `4) If they asked by topic, prefer category/title/description matches.`,
      `Output can include short HTML (e.g., <br>, <strong>, <a href="...">).`,
    ].join('\n');

    const userPrompt = [
      `User question: "${message}"`,
      `Upcoming events (top candidates):`,
      ctx || '(no upcoming events in the next 90 days)'
    ].join('\n\n');

    // 4) Call provider
    const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
    const answerHtml = provider === 'gemini'
      ? await askGemini(userPrompt, system)
      : await askOpenAI(userPrompt, system);

    return res.json({
      answer: answerHtml,
      matched: top.map(e => ({
        id: e._id, title: e.title, date: e.date, location: e.location, imageUrl: e.imageUrl
      })),
      provider
    });
  } catch (err) {
    console.error('AI chat error:', err);
    return res.status(500).json({ message: 'AI is unavailable right now.' });
  }
};

// ---------------- helpers ----------------

function rankEventsByQuery(query, events) {
  const q = (query || '').toLowerCase();
  const qTokens = new Set(q.split(/\W+/).filter(Boolean));
  const soonBoost = (d) => {
    const diff = (new Date(d) - Date.now()) / (24 * 60 * 60 * 1000); // days from now
    if (diff < 0) return -5;                    // past → penalize (shouldn’t appear, but safe)
    if (diff < 3) return 5;                     // next 72h → big boost
    if (diff < 7) return 3;                     // next week
    if (diff < 14) return 2;
    if (diff < 30) return 1;
    return 0;
  };

  const score = (e) => {
    const text = `${e.title} ${e.description || ''} ${e.category || ''} ${e.location || ''}`.toLowerCase();
    let kscore = 0;
    qTokens.forEach(t => { if (t && text.includes(t)) kscore += 1; });
    return kscore + soonBoost(e.date);
  };

  return [...events].sort((a, b) => score(b) - score(a));
}

async function askOpenAI(userPrompt, system) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallbackAnswer(userPrompt);

  const resp = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.4,
      max_tokens: 600
    },
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );

  const text = resp.data?.choices?.[0]?.message?.content?.trim();
  return text || fallbackAnswer(userPrompt);
}

async function askGemini(userPrompt, system) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return fallbackAnswer(userPrompt);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
  const payload = {
    contents: [
      { role: 'user', parts: [{ text: `${system}\n\n${userPrompt}` }] }
    ],
    generationConfig: { temperature: 0.4, maxOutputTokens: 600 }
  };

  const { data } = await axios.post(url, payload);
  const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('').trim();
  return text || fallbackAnswer(userPrompt);
}

function fallbackAnswer() {
  return `I can help you find suitable upcoming events. Try asking things like:
<strong>“AI workshops next week”</strong> or <strong>“closest hackathon”</strong>.<br><br>
You can also browse all events on the <a href="/events">Events</a> page.`;
}
