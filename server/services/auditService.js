const AuditLog = require('../models/AuditLog');

const logAudit = async ({ actor = null, action, entity, entityId = null, metadata = {}, ipAddress = '', userAgent = '' }) => {
  try {
    await AuditLog.create({
      actor: actor?._id || actor || null,
      action,
      entity,
      entityId,
      metadata,
      ipAddress,
      userAgent,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('[AuditLog] Error logging audit trail:', err.message);
  }
};

module.exports = { logAudit };
