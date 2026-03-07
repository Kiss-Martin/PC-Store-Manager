// Health controller: handles health check endpoint
import supabase from '../db.js';

export const healthCheck = async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    const isMissingRelation =
      error &&
      ((error.details && error.details.includes('relation')) ||
        (error.message && error.message.includes('relation')));
    if (isMissingRelation) {
      return res.json({
        status: 'ok',
        supabase: 'reachable',
        note: 'table users missing',
      });
    }
    if (error)
      return res.status(502).json({ status: 'error', error: error.message || error });
    res.json({ status: 'ok', supabase: 'reachable' });
  } catch (err) {
    res.status(500).json({ status: 'error', error: err.message || String(err) });
  }
};
