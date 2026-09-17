const { calculateStudentRisk } = require('../services/riskEngine');
const { analyzeComplaint } = require('../services/complaintAI');
const { processUserMessage } = require('../services/chatbotService');

exports.analyzeRisk = async (req, res) => {
  try {
    const { studentId } = req.body;
    const targetStudentId = studentId || req.user.studentId;
    if (!targetStudentId) {
      return res.status(400).json({ success: false, message: 'Student ID required.' });
    }

    const assessment = await calculateStudentRisk(targetStudentId);
    res.json({ success: true, assessment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.analyzeComplaintText = async (req, res) => {
  try {
    const { title, description, block, room } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required for analysis.' });
    }

    const analysis = await analyzeComplaint({ title, description: description || '', block: block || 'Block B', room: room || 'Room 204' });
    res.json({ success: true, analysis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.chatWithAssistant = async (req, res) => {
  try {
    const { message, confirmedAction } = req.body;
    if (!message && !confirmedAction) {
      return res.status(400).json({ success: false, message: 'Message or confirmed action is required.' });
    }

    const result = await processUserMessage({
      message: message || '',
      userId: req.user._id,
      userRole: req.user.role,
      confirmedAction
    });

    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
