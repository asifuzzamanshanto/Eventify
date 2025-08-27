const Event = require('../models/Event');
const Registration = require('../models/Registration');
const sharp = require('sharp');
const axios = require('axios');

/**
 * Download certificate PNG for the current user.
 * Renders text using mapping: x/y/w are %, y is vertical CENTER of the block (like your FE preview),
 * font is auto-scaled for template size and will wrap to fit width.
 */
exports.downloadCertificate = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    // Must be registered & completed
    const reg = await Registration.findOne({ event: event._id, user: req.user._id });
    if (!reg) return res.status(403).json({ message: 'You are not registered for this event.' });
    if (reg.status !== 'completed') {
      return res.status(403).json({ message: 'Certificate not available yet. (Not completed)' });
    }

    if (!event.certificateTemplateUrl || !event.certificateMapping) {
      return res.status(404).json({ message: 'Certificate not available for this event.' });
    }

    // fetch template
    const resp = await axios.get(event.certificateTemplateUrl, { responseType: 'arraybuffer' });
    const input = Buffer.from(resp.data);
    const meta = await sharp(input).metadata();
    const W = meta.width;
    const H = meta.height;

    // Text values
    const textData = {
      name: req.user.name || req.user.username || 'Participant',
      institution: req.user.university || '',
      eventName: event.title,
      eventDate: new Date(event.date).toLocaleDateString(),
    };

    // Build SVG overlay
    const svg = Buffer.from(`
      <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
        ${renderMappedText(event.certificateMapping, textData, W, H)}
      </svg>
    `);

    const out = await sharp(input)
      .composite([{ input: svg, left: 0, top: 0 }])
      .png()
      .toBuffer();

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="certificate_${event._id}.png"`);
    return res.send(out);
  } catch (err) {
    return res.status(400).json({ message: 'Failed to generate certificate: ' + err.message });
  }
};

/* --------------------------- helpers --------------------------- */

/**
 * Renders all mapped fields as <text> elements.
 * - x,y,w are percentages from mapping.
 * - y is treated as the vertical CENTER of the block (matches your FE preview).
 * - Font size scales with template width (baseline 1920px).
 * - Word wraps to fit width; if needed, auto-shrinks font to keep lines within block width.
 * - align: left|center|right handled by text-anchor and an internal dx offset.
 * - Optional mapping extras (if you add them later): color, lineH, maxLines
 */
function renderMappedText(mapping, data, W, H) {
  const items = [];
  const m = mapping || {};

  for (const key of Object.keys(data)) {
    const cfg = m[key];
    if (!cfg || cfg.visible === false) continue;

    // Percent → px
    const xPct = toNum(cfg.x, 50);
    const yPct = toNum(cfg.y, 50);
    const wPct = toNum(cfg.w, 40);

    const x = (xPct / 100) * W;
    const yCenter = (yPct / 100) * H;
    const boxW = (wPct / 100) * W;

    // Scale font relative to template width (baseline 1920)
    const baseFs = toNum(cfg.font, 22);
    let fs = Math.max(8, Math.round(baseFs * (W / 1920)));

    const align = (cfg.align || 'center').toLowerCase();
    const color = cfg.color || '#000000';
    const lineH = toNum(cfg.lineH, 1.2);    // line-height multiplier
    const maxLines = toNum(cfg.maxLines, 3); // prevent infinite line growth

    const value = String(data[key] ?? '');

    // Word-wrap, then auto-shrink if needed
    let lines = wrapByApprox(value, fs, boxW);
    while (lines.length > maxLines && fs > 8) {
      fs -= 1;
      lines = wrapByApprox(value, fs, boxW);
    }

    // Vertical layout: y is the center of the whole block
    const totalHeight = (lines.length - 1) * (fs * lineH);
    const yStart = yCenter - totalHeight / 2;

    // Horizontal anchoring
    const anchor = align === 'left' ? 'start' : align === 'right' ? 'end' : 'middle';
    const dx = align === 'left' ? 0 : align === 'right' ? boxW : boxW / 2;

    // Build <text> per line
    lines.forEach((line, i) => {
      const y = yStart + i * (fs * lineH);
      items.push(`
        <text
          x="${x + dx}"
          y="${y}"
          font-family="DejaVu Sans, Arial, sans-serif"
          font-size="${fs}"
          fill="${color}"
          text-anchor="${anchor}"
          dominant-baseline="middle"
        >${escapeXml(line)}</text>
      `);
    });
  }

  return items.join('\n');
}

// Very rough width estimate: avg glyph ≈ 0.55em
function approxWidthPx(text, fs) {
  return text.length * fs * 0.55;
}

// Greedy word wrap using the approximate width
function wrapByApprox(text, fs, maxW) {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return [''];

  const lines = [];
  let line = words[0];

  for (let i = 1; i < words.length; i++) {
    const test = line + ' ' + words[i];
    if (approxWidthPx(test, fs) <= maxW) {
      line = test;
    } else {
      lines.push(line);
      line = words[i];
    }
  }
  lines.push(line);
  return lines;
}

function toNum(v, dflt) {
  const n = Number(v);
  return Number.isFinite(n) ? n : dflt;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
