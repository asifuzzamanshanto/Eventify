require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5000;

// If deploying behind a proxy and using secure cookies in prod, uncomment:
// app.set('trust proxy', 1);

app.use(express.json());
app.use(cookieParser());

/* ---------------- CORS setup ---------------- */
const allowedOrigins = [
  process.env.APP_URL_LOCAL,   // e.g. http://localhost:5173 or http://localhost:5175
  process.env.APP_URL          // e.g. https://your-frontend.onrender.com
].filter(Boolean);

const normalizeUrl = (url = "") => url.replace(/\/+$/, "");
const normalizedAllowedOrigins = allowedOrigins.map(normalizeUrl);

// Allow any localhost port in development
const localhostRegexes = [
  /^https?:\/\/localhost(?::\d+)?$/i,
  /^https?:\/\/127\.0\.0\.1(?::\d+)?$/i,
  /^https?:\/\/\[(::1)\](?::\d+)?$/i,
];

// *.onrender.com in any env
const onrenderRegex = /^https?:\/\/([a-z0-9-]+\.)*onrender\.com$/i;

function isAllowedOrigin(origin) {
  const clean = normalizeUrl(origin || "");
  if (!clean) return true; // Non-browser clients (curl/Postman)

  // Exact match from .env
  if (normalizedAllowedOrigins.includes(clean)) return true;

  // Any localhost/127.0.0.1/[::1] with any port in non-production
  if (process.env.NODE_ENV !== 'production') {
    if (localhostRegexes.some((re) => re.test(clean))) return true;
  }

  // *.onrender.com
  if (onrenderRegex.test(clean)) return true;

  return false;
}

app.use(
  cors({
    origin(origin, cb) {
      console.log('🛰 Incoming request from:', origin);
      if (isAllowedOrigin(origin)) return cb(null, true);
      console.log('❌ Blocked by CORS:', origin);
      return cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

/* ---------------- Routes ---------------- */
const authRoutes = require('./routes/auth');
const superadminRoutes = require('./routes/superadminRoutes');
const registrationRoutes = require('./routes/registrations');
const chatbotRoutes = require('./routes/chatbot');
const certificateRoutes = require('./routes/certificates');
const userRoutes = require('./routes/users');

// Optional clubs route: only if present
let clubRoutes;
try {
  clubRoutes = require('./routes/clubRoutes');
} catch {
  clubRoutes = null;
}

app.get('/', (req, res) => {
  res.send('Eventify API is running!');
});

app.use('/api/auth', authRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/registrations', registrationRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/users', userRoutes);
if (clubRoutes) app.use('/api/clubs', clubRoutes);

/* ------------- Mongo & Server ------------- */
let server;
if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log('✅ Successfully connected to MongoDB!');
      server = app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
      });
    })
    .catch((error) => {
      console.error('❌ Connection failed!', error);
    });
}

module.exports = { app, getTestServer: () => server, closeServer: () => server && server.close() };
