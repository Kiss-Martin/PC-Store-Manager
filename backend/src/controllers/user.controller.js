// Users controller: handles user-related endpoints (workers, profile)
import UserService from '../services/user.service.js';

export const getWorkers = async (req, res) => {
  const users = await UserService.getWorkers();
  res.json({ users });
};

export const getProfile = async (req, res) => {
  const user = await UserService.getProfile(req.user.id);
  res.json({ user });
};

export const updateProfile = async (req, res) => {
  const user = await UserService.updateProfile(req.user.id, req.body);
  res.json({ user });
};

export const changePassword = async (req, res) => {
  const result = await UserService.changePassword(req.user.id, req.body);
  res.json(result);
};
