const AuditLog = require('../models/AuditLog');
const { normalizeRole } = require('../schemas/roleTaxonomy');

/**
 * Log a tamper-evident audit event.
 * Resilient against runtime or database faults (will never interrupt user request pipeline).
 *
 * @param {Object} params
 * @param {Object} [params.req] - Express request object
 * @param {Object} [params.actor] - Explicit actor override { id, email, role }
 * @param {string} params.action - Canonical action identifier (e.g. 'USER_LOGIN', 'USER_DELETE')
 * @param {Object} params.resource - Impacted entity { type: string, id: string }
 * @param {Object} [params.details] - Arbitrary JSON metadata
 * @returns {Promise<Object|null>}
 */
const logAuditEvent = async ({ req, actor, action, resource, details = {} }) => {
  try {
    const actorId = actor?.id || actor?._id || req?.user?._id || req?.user?.id || null;
    const actorEmail = actor?.email || req?.user?.email || 'system';
    const rawRole = actor?.role || req?.user?.role || 'ANONYMOUS';
    const actorRole = normalizeRole(rawRole);

    let ip = '';
    let userAgent = '';

    if (req) {
      ip = req.ip ||
        req.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.connection?.remoteAddress ||
        '';
      userAgent = req.headers?.['user-agent'] || '';
    }

    const logEntry = new AuditLog({
      actor: {
        id: actorId,
        email: actorEmail,
        role: actorRole,
      },
      action: action || 'UNKNOWN_ACTION',
      resource: {
        type: resource?.type || 'SYSTEM',
        id: resource?.id ? String(resource.id) : undefined,
      },
      details: details || {},
      ip: String(ip),
      userAgent: String(userAgent),
      timestamp: new Date(),
    });

    await logEntry.save();

    try {
      const siemService = require('../services/siemService');
      siemService.dispatch(logEntry);
    } catch (_) {}

    return logEntry;
  } catch (err) {
    console.warn(`[AuditLogger] Non-fatal error persisting audit log for action ${action}:`, err.message);
    return null;
  }
};

module.exports = {
  logAuditEvent,
};
