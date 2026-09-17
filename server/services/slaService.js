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
  checkSlaBreaches
};
