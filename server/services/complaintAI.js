const Department = require('../models/Department');
const ComplaintCategory = require('../models/ComplaintCategory');
const Complaint = require('../models/Complaint');
const ComplaintCluster = require('../models/ComplaintCluster');

/**
 * Intelligent complaint analysis engine
 */
async function analyzeComplaint({ title, description, block, room, floor, categoryCode = '' }) {
  const text = `${title} ${description}`.toLowerCase();

  // 1. Detect Category
  let detectedCategoryName = 'General Maintenance';
  let suggestedDepartmentCode = 'MAINTENANCE';
  let suggestedPriority = 'MEDIUM';
  let academicImpact = 'NONE';
  let confidence = 0.92;
  let reason = 'Standard campus service request based on equipment and location details.';

  // Time sensitivity & safety indicators
  const isUrgent = /urgent|immediately|emergency|exam|presentation|class starting|minutes|danger|leak|spark|shock|fire|smoke|injury/i.test(text);
  const isSafetyHazard = /spark|short circuit|bare wire|shock|fire|smoke|broken glass|door lock broken|theft|harassment|security|gas/i.test(text);
  const isAcademicCritical = /exam|presentation|lecture|lab exam|projector|mic|smart board|podium|class in progress|online test/i.test(text);

  // Category Detection
  if (/wifi|wi-fi|internet|lan|network|router|ethernet|slow internet|broadband|no signal|disconnect/i.test(text)) {
    detectedCategoryName = 'Wi-Fi & Network';
    suggestedDepartmentCode = 'IT';
    if (isUrgent || isAcademicCritical) {
      suggestedPriority = 'HIGH';
      academicImpact = 'MODERATE';
      reason = 'Network connectivity issue in academic area may disrupt online assessments and class communication.';
    } else {
      suggestedPriority = 'MEDIUM';
      academicImpact = 'MINOR';
      reason = 'Network instability reported for student devices.';
    }
  } else if (/projector|screen|smart board|hdmi|speaker|microphone|av |audio|podium display/i.test(text)) {
    detectedCategoryName = 'Classroom Equipment';
    suggestedDepartmentCode = 'IT_AV';
    if (isUrgent || isAcademicCritical) {
      suggestedPriority = 'HIGH';
      academicImpact = 'SIGNIFICANT';
      reason = 'Audio/Visual failure directly threatens ongoing or imminent lectures and student presentations.';
    } else {
      suggestedPriority = 'MEDIUM';
      academicImpact = 'MODERATE';
      reason = 'Classroom presentation hardware malfunction reported.';
    }
  } else if (/electric|switch|fan|light|tube light|ac|air conditioner|cooling|power socket|no power|power outage|blackout/i.test(text)) {
    detectedCategoryName = 'Electrical';
    suggestedDepartmentCode = 'ELECTRICAL';
    if (isSafetyHazard) {
      suggestedPriority = 'CRITICAL';
      academicImpact = 'MODERATE';
      reason = 'Potential electrical safety hazard requiring immediate technician dispatch.';
    } else if (isUrgent) {
      suggestedPriority = 'HIGH';
      academicImpact = 'MINOR';
      reason = 'Power failure affecting classroom environment.';
    } else {
      suggestedPriority = 'MEDIUM';
      academicImpact = 'MINOR';
      reason = 'Electrical appliance repair needed.';
    }
  } else if (/water|plumbing|tap|pipe|leak|drain|washroom|flush|toilet|cooler|drinking water/i.test(text)) {
    detectedCategoryName = 'Plumbing & Water';
    suggestedDepartmentCode = 'MAINTENANCE';
    if (/drinking water|water contamination|overflow/i.test(text)) {
      suggestedPriority = 'HIGH';
      reason = 'Hygiene and essential drinking water supply disruption.';
    } else {
      suggestedPriority = 'MEDIUM';
      reason = 'Plumbing fixture leakage or repair request.';
    }
  } else if (/cleaning|dustbin|garbage|waste|dirty|sanitation|smell|stink|cockroach|pest/i.test(text)) {
    detectedCategoryName = 'Sanitation';
    suggestedDepartmentCode = 'SANITATION';
    suggestedPriority = isUrgent ? 'HIGH' : 'LOW';
    reason = 'Cleanliness and sanitation maintenance requested for campus premises.';
  } else if (/security|guard|id card|unauthorized|stranger|gate|lock|stolen|lost|fight/i.test(text)) {
    detectedCategoryName = 'Campus Security';
    suggestedDepartmentCode = 'SECURITY';
    suggestedPriority = isSafetyHazard ? 'CRITICAL' : 'HIGH';
    reason = 'Campus safety and security protocol incident reported.';
  } else if (/desk|chair|bench|board|window|door|ceiling|crack|furniture|table/i.test(text)) {
    detectedCategoryName = 'Infrastructure & Furniture';
    suggestedDepartmentCode = 'MAINTENANCE';
    suggestedPriority = 'LOW';
    reason = 'Physical campus furniture or structural repair request.';
  }

  // Safety escalation override
  if (isSafetyHazard) {
    suggestedPriority = 'CRITICAL';
  }

  // Find DB Department and Category
  let dept = await Department.findOne({ code: suggestedDepartmentCode });
  if (!dept) {
    dept = await Department.findOne({ type: 'FACILITY_SUPPORT' });
  }

  let cat = await ComplaintCategory.findOne({ name: detectedCategoryName });
  if (!cat) {
    cat = await ComplaintCategory.findOne();
  }

  const summary = `${detectedCategoryName} issue reported in ${block}, ${room}: ${title}`;

  return {
    category: cat ? cat._id : null,
    categoryName: detectedCategoryName,
    department: dept ? dept._id : null,
    departmentCode: suggestedDepartmentCode,
    departmentName: dept ? dept.name : 'Campus Facilities',
    priority: suggestedPriority,
    academicImpact,
    summary,
    reason,
    confidence
  };
}

/**
 * Duplicate Complaint & Incident Cluster Detection
 * Finds complaints in the same block/room with similar keywords within 48 hours
 */
async function checkAndClusterDuplicates(complaint) {
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  // Look for active complaints in the exact same block and room OR category in the same block
  const existingComplaints = await Complaint.find({
    _id: { $ne: complaint._id },
    block: complaint.block,
    status: { $in: ['SUBMITTED', 'AI_ANALYZED', 'ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS'] },
    createdAt: { $gte: fortyEightHoursAgo }
  }).populate('category');

  if (existingComplaints.length === 0) return null;

  // Compare semantic similarity
  const tokensA = new Set(complaint.title.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  
  for (const candidate of existingComplaints) {
    const tokensB = new Set(candidate.title.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const intersection = [...tokensA].filter(x => tokensB.has(x));
    const similarity = intersection.length / Math.max(tokensA.size, tokensB.size);

    const sameCategory = candidate.category?.toString() === complaint.category?.toString();
    const sameRoom = candidate.room && complaint.room && candidate.room.toLowerCase() === complaint.room.toLowerCase();

    if (similarity >= 0.35 || (sameCategory && sameRoom)) {
      // Found a matching incident!
      let cluster = null;
      if (candidate.cluster) {
        cluster = await ComplaintCluster.findById(candidate.cluster);
      }

      if (!cluster) {
        const incidentCount = await ComplaintCluster.countDocuments();
        cluster = await ComplaintCluster.create({
          incidentId: `INC-${new Date().getFullYear()}-${String(incidentCount + 1).padStart(4, '0')}`,
          title: `Reported incident: ${complaint.title} (${complaint.block})`,
          category: complaint.category,
          location: {
            block: complaint.block,
            building: complaint.building,
            floor: complaint.floor,
            room: complaint.room
          },
          priority: complaint.priority === 'CRITICAL' || candidate.priority === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          status: 'ACTIVE',
          relatedComplaints: [candidate._id, complaint._id],
          aiSimilarityScore: Math.round((similarity || 0.8) * 100) / 100
        });
        candidate.cluster = cluster._id;
        await candidate.save();
      } else {
        if (!cluster.relatedComplaints.includes(complaint._id)) {
          cluster.relatedComplaints.push(complaint._id);
          await cluster.save();
        }
      }

      complaint.cluster = cluster._id;
      await complaint.save();
      return cluster;
    }
  }

  return null;
}

module.exports = {
  analyzeComplaint,
  checkAndClusterDuplicates
};
