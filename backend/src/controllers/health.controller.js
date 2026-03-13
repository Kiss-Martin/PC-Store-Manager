// Health controller: handles health check endpoint
import supabase from '../db.js';

export const healthCheck = async (req, res) => {
  const result = await supabase.from('users').select('id').limit(1);
  const error = result?.error;
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
  if (error) return res.status(502).json({ status: 'error', error: error.message || error });
  res.json({ status: 'ok', supabase: 'reachable' });
};

export const healthReady = async (req, res) => {
  // Similar to healthCheck but fail fast if Supabase unreachable
  try {
    const result = await supabase.from('users').select('id').limit(1);
    const error = result?.error;
    if (error) return res.status(502).json({ status: 'error', supabase: 'unreachable', error: error.message || error });
    return res.json({ status: 'ready', supabase: 'reachable' });
  } catch (e) {
    return res.status(502).json({ status: 'error', supabase: 'unreachable', error: e && e.message ? e.message : String(e) });
  }
};
