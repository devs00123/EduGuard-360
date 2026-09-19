/**
 * Institutional Configuration Service
 * Provides centralized branding, institutional identity, contact info,
 * and deployment environment configurations for EduGuard 360.
 */

const getInstitutionConfig = () => {
  const isProd = process.env.NODE_ENV === 'production';
  const demoMode = process.env.DEMO_MODE === 'true';

  return {
    // Institutional Identity
    institutionName: process.env.INSTITUTION_NAME || 'BSAITM Institute of Technology & Management',
    institutionShortName: process.env.INSTITUTION_CODE || 'BSAITM',
    institutionDomain: process.env.INSTITUTION_DOMAIN || 'bsaitm.ac.in',
    tagline: process.env.INSTITUTION_TAGLINE || 'AI-Powered Student Success & Campus Support Platform',

    // Support & Emergency Helplines
    supportEmail: process.env.SUPPORT_EMAIL || 'support@bsaitm.ac.in',
    campusHelpline: process.env.CAMPUS_HELPLINE || '+91-11-23456789',
    emergencyNumber: process.env.EMERGENCY_NUMBER || '112',
    antiRaggingHelpline: process.env.ANTI_RAGGING_HELPLINE || '1800-180-5522',

    // Operational Modes
    demoMode,
    environment: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5050',
    googleClientId: process.env.GOOGLE_CLIENT_ID || '304812275269-vbgg8usmo95gc77g743bmu5tuh0l00fl.apps.googleusercontent.com'
  };
};

/**
 * Returns safe metadata meant for public client consumption (no secrets).
 */
const getPublicConfig = () => {
  const config = getInstitutionConfig();
  return {
    institutionName: config.institutionName,
    institutionShortName: config.institutionShortName,
    institutionDomain: config.institutionDomain,
    tagline: config.tagline,
    supportEmail: config.supportEmail,
    campusHelpline: config.campusHelpline,
    emergencyNumber: config.emergencyNumber,
    antiRaggingHelpline: config.antiRaggingHelpline,
    demoMode: config.demoMode,
    environment: config.environment,
    googleClientId: config.googleClientId
  };
};

module.exports = {
  getInstitutionConfig,
  getPublicConfig
};
