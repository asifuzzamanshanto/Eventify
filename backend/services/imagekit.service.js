// backend/services/imagekit.service.js
const { imagekit } = require('../config/imagekit');

/** Normalize folder to begin with "/" and collapse duplicate slashes */
function normalizeFolder(folder = '/') {
  let f = String(folder || '/').trim();
  if (!f.startsWith('/')) f = '/' + f;
  return f.replace(/\/{2,}/g, '/');
}

/** Basic safe filename (letters, numbers, dash/underscore/dot) */
function safeFileName(name = 'file.jpg') {
  const base = String(name).trim().replace(/[^a-zA-Z0-9._-]+/g, '_');
  return base || 'file.jpg';
}

/** Small helper to retry an async fn a couple times on transient errors */
async function withRetry(fn, { retries = 2, delayMs = 200 } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === retries) break;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

/**
 * Upload a raw buffer to ImageKit.
 * Returns: { url, fileId }
 */
async function uploadBuffer(buffer, fileName, folder) {
  const normalizedFolder = normalizeFolder(folder);
  const cleanName = safeFileName(fileName);

  const res = await withRetry(() =>
    imagekit.upload({
      file: buffer,                 // raw buffer
      fileName: cleanName,          // sanitized filename
      folder: normalizedFolder,     // e.g. "/avatars" or "/club-logos"
      useUniqueFileName: true,      // cache-busting new URL per upload
      isPrivateFile: false,         // public by default
    })
  );

  return { url: res.url, fileId: res.fileId };
}

/**
 * Delete by ImageKit fileId (safe to call with null).
 * Retries on transient errors; swallows 404s.
 */
async function deleteById(fileId) {
  if (!fileId) return;
  await withRetry(() => imagekit.deleteFile(fileId)).catch(() => {});
}

/**
 * Replace old file with new buffer: await delete, then upload.
 * Returns: { url, fileId }
 */
async function replaceBuffer(buffer, fileName, folder, oldFileId) {
  await deleteById(oldFileId);
  return uploadBuffer(buffer, fileName, folder);
}

module.exports = { uploadBuffer, deleteById, replaceBuffer };
