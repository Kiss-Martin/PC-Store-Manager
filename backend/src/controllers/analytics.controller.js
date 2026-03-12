// Analytics controller: handles analytics endpoints
import AnalyticsService from '../services/analytics.service.js';

export const getAnalytics = async (req, res) => {
  const result = await AnalyticsService.getAnalytics(req.user, req.query);
  res.json(result);
};

export const exportAnalytics = async (req, res) => {
  const { csv, filename } = await AnalyticsService.exportAnalytics(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
  res.send(csv);
};
