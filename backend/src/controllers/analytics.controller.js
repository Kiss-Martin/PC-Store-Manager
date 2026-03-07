// Analytics controller: handles analytics endpoints
import AnalyticsService from '../services/analytics.service.js';

export const getAnalytics = async (req, res, next) => {
  try {
    const result = await AnalyticsService.getAnalytics(req.user, req.query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const exportAnalytics = async (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  try {
    const { csv, filename } = await AnalyticsService.exportAnalytics(req.query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
};
