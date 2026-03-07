// Users controller: handles user-related endpoints (workers, profile)
import UserService from '../services/user.service.js';

export const getWorkers = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  try {
    const users = await UserService.getWorkers();
    res.json({ users });
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const user = await UserService.getProfile(req.user.id);
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await UserService.updateProfile(req.user.id, req.body);
    res.json({ user });
  } catch (err) {
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const result = await UserService.changePassword(req.user.id, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
