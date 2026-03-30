// Shared audit log utility — centralizes audit log insertion
import supabase from '../db.js';
import { run } from './supabase.util.js';

/**
 * Write an audit log entry. Failures are silently caught and logged.
 * @param {string} eventType - The event type (e.g. 'logout', 'revoke_session')
 * @param {string|null} actorUserId - The user performing the action
 * @param {string|null} targetUserId - The user being acted upon
 * @param {object|null} details - Additional details
 */
export async function writeAuditLog(eventType, actorUserId = null, targetUserId = null, details = null) {
  try {
    await run(
      supabase.from('audit_logs').insert({
        event_type: eventType,
        actor_user_id: actorUserId,
        target_user_id: targetUserId,
        details,
      }).select().single()
    ).catch(() => null);
  } catch (e) {
    // Audit failures must never break business logic
    console.warn('[audit] Failed to write audit log:', eventType, e && e.message ? e.message : e);
  }
}
