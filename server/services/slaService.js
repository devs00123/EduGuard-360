const SlaRule = require('../models/SlaRule');
const Complaint = require('../models/Complaint');

/**
 * Calculates deadline date based on priority
 */
async function calculateSlaDeadline(priority) {
  let hours = 24; // default
  try {
    const rule = await SlaRule.findOne({ priority });
    if (rule) {
      hours = rule.maxResolutionHours;
    } else {
      if (priority === 'CRITICAL') hours = parseInt(process.env.SLA_CRITICAL_HOURS || '4');
      else if (priority === 'HIGH') hours = parseInt(process.env.SLA_HIGH_HOURS || '12');
      else if (priority === 'MEDIUM') hours = parseInt(process.env.SLA_MEDIUM_HOURS || '24');
      else hours = parseInt(process.env.SLA_LOW_HOURS || '48');
    }
  } catch (err) {
    console.warn('[SlaService] Error reading SLA rule:', err.message);
  }

  const deadline = new Date(Date.now() + hours * 60 * 60 * 1000);
  return { deadline, hours };
}

/**
 * Computes dynamic SLA status for a complaint:
 * 'RESOLVED' if status is RESOLVED or CLOSED
 * 'OVERDUE' if now > slaDeadline
 * 'DUE_SOON' if remaining time <= 4 hours and not overdue
 * 'ON_TRACK' otherwise
 */
function getSlaStatus(complaint) {
  if (!complaint) return 'ON_TRACK';
  if (['RESOLVED', 'CLOSED'].includes(complaint.status)) {
    return 'RESOLVED';
  }
  if (!complaint.slaDeadline) return 'ON_TRACK';
  const now = new Date();
  const deadline = new Date(complaint.slaDeadline);
  const diffMs = deadline.getTime() - now.getTime();
  if (diffMs < 0) {
    return 'OVERDUE';
  }
  // If due within 4 hours
  if (diffMs <= 4 * 60 * 60 * 1000) {
    return 'DUE_SOON';
  }
  return 'ON_TRACK';
}

/**
 * Checks all active complaints for SLA breaches and updates status
 */
async function checkSlaBreaches() {
  const now = new Date();
  const breachedComplaints = await Complaint.find({
    status: { $in: ['SUBMITTED', 'AI_ANALYZED', 'ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS'] },
    slaDeadline: { $lt: now },
    isSlaBreached: false
  });

  const updated = [];
  for (const c of breachedComplaints) {
    c.isSlaBreached = true;
    c.slaBreachedAt = now;
    await c.save();
    updated.push(c);
  }

  return updated;
}

module.exports = {
  calculateSlaDeadline,
  getSlaStatus,
  checkSlaBreaches
};
