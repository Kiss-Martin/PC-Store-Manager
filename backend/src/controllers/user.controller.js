// Users controller: handles user-related endpoints (workers, profile)
import UserService from '../services/user.service.js';
import { updateProfileSchema } from '../validators.js';
import path from 'path';
import fs from 'fs';

export const getWorkers = async (req, res) => {
  const users = await UserService.getWorkers();
  res.json({ users });
};

export const getProfile = async (req, res) => {
  const user = await UserService.getProfile(req.user.id);
  res.json({ user });
};

export const updateProfile = async (req, res) => {
  const validated = await updateProfileSchema.parseAsync(req.body);
  const user = await UserService.updateProfile(req.user.id, validated, req.lang);
  res.json({ user });
};

export const changePassword = async (req, res) => {
  const result = await UserService.changePassword(req.user.id, req.body, req.lang);
  res.json(result);
};

export const deleteProfile = async (req, res) => {
  await UserService.deleteProfile(req.user.id, req.lang);
  const userId = req.user.id;
  const dir = path.join(process.cwd(), 'uploads', 'avatars');
  try {
    const files = fs.readdirSync(dir).filter((f) => f.startsWith(String(userId) + '.'));
    for (const f of files) {
      try { fs.unlinkSync(path.join(dir, f)); } catch (_e) { /* ignore */ }
    }
  } catch (_e) { /* ignore */ }
  res.json({ success: true });
};

// Upload avatar (multipart/form-data 'avatar')
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    // Multer saves the new avatar as {userId}.{ext}.
    // Remove any previous avatar files with a different extension so only one exists.
    const userId = req.user.id;
    const dir = path.join(process.cwd(), 'uploads', 'avatars');
    const currentFile = req.file.filename; // e.g. "abc123.png"
    try {
      const existing = fs.readdirSync(dir).filter(
        (f) => f.startsWith(String(userId) + '.') && f !== currentFile
      );
      for (const f of existing) {
        try { fs.unlinkSync(path.join(dir, f)); } catch (_e) { /* ignore */ }
      }
    } catch (_e) { /* ignore */ }
    res.json({ success: true, message: 'Avatar uploaded' });
  } catch (e) {
    console.warn('uploadAvatar error', e && (e.message || e));
    res.status(500).json({ error: 'Failed to upload' });
  }
};

// Serve current user's avatar as a binary stream (auth required)
export const getMyAvatar = async (req, res) => {
  const userId = req.user.id;
  return serveAvatarForId(userId, req, res);
};

export const getAvatarById = async (req, res) => {
  const userId = req.params.id;
  // allow the owner or any admin to access the avatar
  if (String(req.user.id) !== String(userId) && req.user.role !== 'admin') {
    return res.status(403).send('Forbidden');
  }
  return serveAvatarForId(userId, req, res);
};

export const deleteAvatar = async (req, res) => {
  const userId = req.user.id;
  const dir = path.join(process.cwd(), 'uploads', 'avatars');
  try {
    const files = fs.readdirSync(dir).filter((f) => f.startsWith(String(userId) + '.'));
    for (const f of files) {
      try { fs.unlinkSync(path.join(dir, f)); } catch (e) { /* ignore */ }
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete avatar' });
  }
};

function serveAvatarForId(userId, req, res) {
  const dir = path.join(process.cwd(), 'uploads', 'avatars');
  try {
    const files = fs.readdirSync(dir).filter((f) => f.startsWith(String(userId) + '.'));
    if (!files || files.length === 0) return res.status(404).send('Not found');
    // if multiple matches pick the first
    const filePath = path.join(dir, files[0]);
    // prevent stale browser caching so newly uploaded avatars are seen immediately
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.sendFile(filePath);
  } catch (e) {
    return res.status(404).send('Not found');
  }
}
