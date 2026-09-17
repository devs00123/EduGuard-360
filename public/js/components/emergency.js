/**
 * EduGuard 360 — AI Emergency Response & Campus Safety Component
 * Provides:
 * 1. Dedicated floating Emergency Assistance control (coexisting with AI Chatbot)
 * 2. High-visibility Emergency Panel with Medical, Fire, Police, and 112 options
 * 3. One-tap telephone links with explicit safety confirmation modals
 * 4. Location-aware emergency display with GPS detection
 * 5. Device detection (mobile direct call vs. desktop dialer assist)
 * 6. Configurable contacts store with Admin management UI
 */

const Emergency = {
  isOpen: false,
  locationStatus: 'pending', // 'available', 'permission_required', 'unavailable'
  currentLocation: {
    campus: 'EduGuard Central Campus',
    block: 'Academic Block B',
    area: 'Ground Floor & North Quad',
    coords: null
  },

  // Default institutional emergency contacts (stored in localStorage for customization)
  defaultContacts: [
    {
      id: 'national-112',
      category: 'NATIONAL_EMERGENCY',
      name: 'ERSS National Emergency Response',
      role: 'Unified Police • Fire • Medical (Govt. of India)',
      phone: '112',
      availability: '24/7 Active Nationwide',
      location: 'Pan-India Unified Emergency Dispatch (112)',
      isActive: true,
      badge: 'GOVT OF INDIA • 112',
      icon: 'fa-shield-halved'
    },
    {
      id: 'campus-doctor',
      category: 'MEDICAL',
      name: 'Dr. Ananya Sen',
      role: 'Chief Campus Medical Officer',
      phone: '+91 11-2345-6789',
      availability: 'Available • 8:00 AM - 8:00 PM',
      location: 'Campus Health Centre, Ground Floor, Block A',
      isActive: true,
      badge: 'CAMPUS DOCTOR',
      icon: 'fa-user-doctor'
    },
    {
      id: 'medical-ambulance',
      category: 'AMBULANCE',
      name: 'Campus Rapid Ambulance & Bay',
      role: 'Emergency Paramedic Dispatch',
      phone: '+91 11-2345-6790',
      availability: '24/7 On Campus Standby',
      location: 'Emergency Bay, Health Centre',
      isActive: true,
      badge: 'PARAMEDIC',
      icon: 'fa-truck-medical'
    },
    {
      id: 'campus-security',
      category: 'SECURITY',
      name: 'Central Campus Security Control',
      role: 'Quick Response Team (QRT) & Gate Patrol',
      phone: '+91 11-2987-6543',
      availability: '24/7 Main Gate & Patrol Desk',
      location: 'Main Gate Alpha Security Command Post',
      isActive: true,
      badge: 'SECURITY QRT',
      icon: 'fa-shield-dog'
    },
    {
      id: 'fire-contact',
      category: 'FIRE',
      name: 'Campus Fire & Hazard Control',
      role: 'Fire Safety Marshall & Extinguisher Post',
      phone: '+91 11-2345-6799',
      availability: '24/7 Monitored Safety Desk',
      location: 'Block C Safety & Utility Hub',
      isActive: true,
      badge: 'FIRE SAFETY',
      icon: 'fa-fire-extinguisher'
    },
    {
      id: 'student-safety',
      category: 'SAFETY_CELL',
      name: 'Internal Student & Women Safety Cell',
      role: 'Counselor & Emergency Helpline',
      phone: '1091',
      availability: '24/7 Confidential Assistance',
      location: 'Administrative Block, Room 108',
      isActive: true,
      badge: 'CONFIDENTIAL',
      icon: 'fa-heart-circle-check'
    }
  ],

  contacts: [],

  init() {
    this.loadContacts();
    this.renderFloatingButton();
    this.renderEmergencyPanel();
    this.bindEvents();
    this.detectCampusLocation();
  },

  loadContacts() {
    try {
      const stored = localStorage.getItem('eduguard_emergency_contacts');
      if (stored) {
        this.contacts = JSON.parse(stored);
      } else {
        this.contacts = [...this.defaultContacts];
        localStorage.setItem('eduguard_emergency_contacts', JSON.stringify(this.contacts));
      }
    } catch (e) {
      this.contacts = [...this.defaultContacts];
    }
  },

  saveContacts() {
    try {
      localStorage.setItem('eduguard_emergency_contacts', JSON.stringify(this.contacts));
    } catch (e) {
      console.warn('[Emergency] Local storage failed:', e);
    }
  },

  getContact(category) {
    return this.contacts.find(c => c.category === category && c.isActive) ||
           this.defaultContacts.find(c => c.category === category) || null;
  },

  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768 && navigator.maxTouchPoints > 0);
  },

  renderFloatingButton() {
    const existing = document.getElementById('eduguard-emergency-widget');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'eduguard-emergency-widget';
    container.className = 'emergency-widget';

    container.innerHTML = `
      <button id="emergency-toggle-btn" class="emergency-toggle-btn" title="Emergency Help (SOS)" aria-label="Campus Emergency Assistance (SOS)">
        <span class="emergency-pulse-ring" aria-hidden="true"></span>
        <div class="emergency-btn-inner">
          <i class="fas fa-shield-heart emergency-icon" aria-hidden="true"></i>
          <span class="emergency-btn-label">SOS / Emergency</span>
        </div>
      </button>
    `;

    document.body.appendChild(container);
  },

  renderEmergencyPanel() {
    const existing = document.getElementById('eduguard-emergency-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'eduguard-emergency-modal';
    modal.className = 'emergency-modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'emergency-modal-title');

    modal.innerHTML = `
      <div class="emergency-panel" id="emergency-panel-content">
        <!-- HEADER -->
        <div class="emergency-panel-header">
          <div class="emergency-header-left">
            <div class="emergency-header-badge">
              <i class="fas fa-triangle-exclamation"></i>
              <span>CAMPUS SAFETY &amp; RESCUE</span>
            </div>
            <h2 id="emergency-modal-title" class="emergency-title">Emergency Assistance</h2>
            <p class="emergency-subtitle">What type of help do you need?</p>
          </div>
          <button id="emergency-panel-close" class="emergency-close-btn" aria-label="Close emergency panel">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- LOCATION STATUS BANNER -->
        <div class="emergency-location-card" id="emergency-location-card">
          <div class="location-header">
            <div class="location-icon">
              <i class="fas fa-location-dot"></i>
            </div>
            <div class="location-meta">
              <div class="location-label">Your Current Campus Location</div>
              <div id="emergency-location-text" class="location-text">
                📍 ${this.currentLocation.block} • ${this.currentLocation.area}
              </div>
              <div class="location-sub" id="emergency-location-sub">
                Campus: <strong>${this.currentLocation.campus}</strong>
              </div>
            </div>
          </div>
          <div class="location-action">
            <button id="btn-refresh-location" class="location-detect-btn" title="Refresh GPS Location">
              <i class="fas fa-crosshairs"></i>
              <span>Detect My Location</span>
            </button>
            <span id="location-accuracy-pill" class="location-pill">Location Available</span>
          </div>
          <div class="location-disclaimer">
            <i class="fas fa-circle-info"></i>
            <span>India's ERSS 112 and campus responders will coordinate assistance. Please state your room/building verbally when connected.</span>
          </div>
        </div>

        <!-- QUICK ACTIONS BAR -->
        <div class="emergency-quick-bar">
          <div class="quick-bar-label">Quick Dial:</div>
          <div class="quick-bar-actions">
            <button class="quick-chip medical" onclick="Emergency.openType('medical')">
              <i class="fas fa-user-doctor"></i> Medical
            </button>
            <button class="quick-chip fire" onclick="Emergency.openType('fire')">
              <i class="fas fa-fire"></i> Fire
            </button>
            <button class="quick-chip police" onclick="Emergency.openType('police')">
              <i class="fas fa-shield-halved"></i> Police
            </button>
            <button class="quick-chip national" onclick="Emergency.openType('national112')">
              <i class="fas fa-phone-volume"></i> 112
            </button>
          </div>
        </div>

        <!-- 4 PRIMARY EMERGENCY CARDS -->
        <div class="emergency-options-grid">

          <!-- 1. NATIONAL EMERGENCY (112) -->
          <div class="emergency-card national-card">
            <div class="card-glow-edge"></div>
            <div class="card-badge-row">
              <span class="badge-national"><i class="fas fa-flag"></i> UNIFIED 112</span>
              <span class="badge-tag">GOVERNMENT OF INDIA ERSS</span>
            </div>
            <div class="card-body-content">
              <div class="card-icon-box national-icon-box">
                <i class="fas fa-phone-volume"></i>
              </div>
              <div class="card-info">
                <h3 class="card-title">🚨 Call 112</h3>
                <div class="card-services">Police • Fire • Medical Assistance</div>
                <p class="card-desc">India's nationwide unified emergency response number. Covers police, fire and medical assistance.</p>
              </div>
            </div>
            <div class="card-action-bar">
              <button class="btn-emergency-action btn-112" onclick="Emergency.promptCall('112', 'Emergency Services (112)', 'India Unified Emergency Response', '112')">
                <i class="fas fa-phone"></i>
                <span>Call 112 Now</span>
              </button>
            </div>
          </div>

          <!-- 2. MEDICAL EMERGENCY -->
          <div class="emergency-card medical-card">
            <div class="card-badge-row">
              <span class="badge-medical"><i class="fas fa-hospital"></i> MEDICAL HELP</span>
              <span class="badge-status-dot available"><i class="fas fa-circle"></i> Available</span>
            </div>
            <div class="card-body-content">
              <div class="card-icon-box medical-icon-box">
                <i class="fas fa-user-doctor"></i>
              </div>
              <div class="card-info">
                <h3 class="card-title" id="disp-doctor-name">Dr. Ananya Sen</h3>
                <div class="card-services" id="disp-doctor-role">Campus Medical Officer</div>
                <div class="doctor-details">
                  <div class="detail-row"><i class="fas fa-building"></i> <span id="disp-doctor-loc">Campus Health Centre, Ground Floor, Block A</span></div>
                  <div class="detail-row"><i class="fas fa-clock"></i> <span id="disp-doctor-avail">Available • 8:00 AM - 8:00 PM</span></div>
                  <div class="detail-row"><i class="fas fa-phone"></i> <span id="disp-doctor-phone">+91 11-2345-6789</span></div>
                </div>
              </div>
            </div>
            <div class="card-action-bar dual">
              <button class="btn-emergency-action btn-doctor" onclick="Emergency.promptCall(Emergency.getContact('MEDICAL')?.phone || '+91 11-2345-6789', Emergency.getContact('MEDICAL')?.name || 'Dr. Ananya Sen', 'Campus Medical Officer', 'doctor')">
                <i class="fas fa-phone"></i>
                <span>Call Campus Doctor</span>
              </button>
              <button class="btn-emergency-action btn-ambulance" onclick="Emergency.promptCall(Emergency.getContact('AMBULANCE')?.phone || '+91 11-2345-6790', 'Campus Ambulance', 'Emergency Bay Dispatch', 'ambulance')">
                <i class="fas fa-truck-medical"></i>
                <span>Ambulance</span>
              </button>
            </div>
          </div>

          <!-- 3. FIRE EMERGENCY -->
          <div class="emergency-card fire-card">
            <div class="card-badge-row">
              <span class="badge-fire"><i class="fas fa-fire"></i> FIRE EMERGENCY</span>
              <span class="badge-tag">FIRE &amp; RESCUE</span>
            </div>
            <div class="card-body-content">
              <div class="card-icon-box fire-icon-box">
                <i class="fas fa-fire-extinguisher"></i>
              </div>
              <div class="card-info">
                <h3 class="card-title">🔥 Fire &amp; Rescue</h3>
                <div class="card-services">Fire, Smoke, Chemical or Electrical Hazard</div>
                <p class="card-desc">Evacuate immediately to designated campus assembly point. In India, 112 connects to Fire Services.</p>
                <div class="fire-desk-meta">
                  <span>Campus Fire Marshall: <strong>+91 11-2345-6799</strong> (Block C Desk)</span>
                </div>
              </div>
            </div>
            <div class="card-action-bar dual">
              <button class="btn-emergency-action btn-fire" onclick="Emergency.promptCall('112', 'Fire & Rescue Services', 'Emergency Fire Dispatch via 112', 'fire')">
                <i class="fas fa-phone"></i>
                <span>Call Emergency Services (112)</span>
              </button>
              <button class="btn-emergency-action btn-campus-fire" onclick="Emergency.promptCall(Emergency.getContact('FIRE')?.phone || '+91 11-2345-6799', 'Campus Fire Safety Desk', 'Block C Utility Command', 'campus_fire')">
                <i class="fas fa-fire-flame-curved"></i>
                <span>Campus Fire Desk</span>
              </button>
            </div>
          </div>

          <!-- 4. POLICE & CAMPUS SECURITY -->
          <div class="emergency-card police-card">
            <div class="card-badge-row">
              <span class="badge-police"><i class="fas fa-shield-halved"></i> POLICE &amp; SECURITY</span>
              <span class="badge-status-dot available"><i class="fas fa-circle"></i> 24/7 Gate Patrol</span>
            </div>
            <div class="card-body-content">
              <div class="card-icon-box police-icon-box">
                <i class="fas fa-shield-dog"></i>
              </div>
              <div class="card-info">
                <h3 class="card-title">🚔 Police &amp; Campus Security</h3>
                <div class="card-services">Theft, Physical Assault, Harassment &amp; Security</div>
                <p class="card-desc">Call India's unified 112 for Police dispatch, or reach Central Campus Security Alpha Gate for quick response.</p>
                <div class="police-desk-meta">
                  <span>Central Gate Security: <strong>+91 11-2987-6543</strong> • 24/7 Patrol</span>
                </div>
              </div>
            </div>
            <div class="card-action-bar dual">
              <button class="btn-emergency-action btn-police" onclick="Emergency.promptCall('112', 'Police Assistance', 'Emergency Police Dispatch via 112', 'police')">
                <i class="fas fa-phone"></i>
                <span>Call Police (112)</span>
              </button>
              <button class="btn-emergency-action btn-security" onclick="Emergency.promptCall(Emergency.getContact('SECURITY')?.phone || '+91 11-2987-6543', 'Campus Security Control', 'Alpha Gate Quick Response Team', 'security')">
                <i class="fas fa-shield-halved"></i>
                <span>Call Campus Security</span>
              </button>
            </div>
          </div>

        </div>

        <!-- FOOTER NOTICE -->
        <div class="emergency-panel-footer">
          <div class="footer-legal">
            <i class="fas fa-shield-check"></i>
            <span><strong>EduGuard 360 Campus Safety Interface:</strong> Provides immediate emergency calling assistance and verified campus safety contacts. Does not replace government 112 dispatchers or professional medical treatment.</span>
          </div>
          <button class="btn-dismiss-emergency" onclick="Emergency.close()">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  bindEvents() {
    const toggleBtn = document.getElementById('emergency-toggle-btn');
    const closeBtn = document.getElementById('emergency-panel-close');
    const modal = document.getElementById('eduguard-emergency-modal');
    const detectBtn = document.getElementById('btn-refresh-location');

    toggleBtn?.addEventListener('click', () => this.toggle());
    closeBtn?.addEventListener('click', () => this.close());

    // Close on backdrop click (outside panel)
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) this.close();
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });

    detectBtn?.addEventListener('click', () => this.requestBrowserLocation());
  },

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  },

  open() {
    this.isOpen = true;
    const modal = document.getElementById('eduguard-emergency-modal');
    if (modal) {
      modal.classList.add('active');
      document.body.classList.add('emergency-open');
    }
  },

  close() {
    this.isOpen = false;
    const modal = document.getElementById('eduguard-emergency-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.classList.remove('emergency-open');
    }
  },

  openType(type) {
    if (!this.isOpen) this.open();
    setTimeout(() => {
      const modal = document.getElementById('emergency-panel-content');
      if (!modal) return;
      let targetSelector = '';
      if (type === 'medical') targetSelector = '.medical-card';
      else if (type === 'fire') targetSelector = '.fire-card';
      else if (type === 'police') targetSelector = '.police-card';
      else if (type === 'national112') targetSelector = '.national-card';

      if (targetSelector) {
        const el = modal.querySelector(targetSelector);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('highlight-pulse');
          setTimeout(() => el.classList.remove('highlight-pulse'), 1800);
        }
      }
    }, 150);
  },

  detectCampusLocation() {
    // Check if browser has geolocation permission
    if ('geolocation' in navigator) {
      navigator.permissions?.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'granted') {
          this.requestBrowserLocation(true);
        } else if (result.state === 'denied') {
          this.setLocationStatus('unavailable', 'Location access blocked in browser settings. Please tell responder your building.');
        } else {
          this.setLocationStatus('permission_required', 'Allow location access to help responders locate you on campus.');
        }
      }).catch(() => {
        this.setLocationStatus('available', `📍 ${this.currentLocation.block} • North Quad`);
      });
    } else {
      this.setLocationStatus('unavailable', 'Device location unavailable. Tell responder your room.');
    }
  },

  requestBrowserLocation(silent = false) {
    if (!navigator.geolocation) {
      if (!silent) UI.toast('Geolocation is not supported by your browser.', 'warning');
      return;
    }

    const pill = document.getElementById('location-accuracy-pill');
    const text = document.getElementById('emergency-location-text');
    if (pill) pill.innerText = 'Detecting GPS...';

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        const acc = Math.round(pos.coords.accuracy);
        this.currentLocation.coords = { lat, lng, acc };
        this.setLocationStatus('available', `📍 Academic Block B (GPS: ${lat}°N, ${lng}°E ±${acc}m)`);
        if (!silent) UI.toast(`Location identified (Accuracy: ±${acc}m)`, 'success');
      },
      (err) => {
        console.warn('[Emergency Geolocation Error]', err.message);
        this.setLocationStatus('unavailable', 'Location access declined. Please state your room & block verbally.');
        if (!silent) UI.toast('Location permission denied. State your location manually.', 'warning');
      },
      { timeout: 8000, maximumAge: 60000, enableHighAccuracy: true }
    );
  },

  setLocationStatus(status, label) {
    this.locationStatus = status;
    const textEl = document.getElementById('emergency-location-text');
    const pillEl = document.getElementById('location-accuracy-pill');
    if (textEl && label) textEl.innerText = label;
    if (pillEl) {
      if (status === 'available') {
        pillEl.className = 'location-pill status-ready';
        pillEl.innerText = 'Location Available';
      } else if (status === 'permission_required') {
        pillEl.className = 'location-pill status-req';
        pillEl.innerText = 'Permission Needed';
      } else {
        pillEl.className = 'location-pill status-warn';
        pillEl.innerText = 'Tell Responder Location';
      }
    }
  },

  /**
   * Safe Confirmation Modal Before Initiating Call
   * Strictly avoids accidental dialer triggers and complies with safety rule:
   * "Because emergency calls can have serious consequences, implement a clear confirmation screen"
   */
  promptCall(phoneNumber, targetName, targetRole, callType) {
    const is112 = phoneNumber === '112';
    const isMobile = this.isMobileDevice();

    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const footerEl = document.getElementById('modal-footer');

    if (!overlay || !titleEl || !bodyEl || !footerEl) return;

    titleEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; color: ${is112 ? '#ef4444' : '#f59e0b'};">
        <i class="fas ${is112 ? 'fa-triangle-exclamation' : 'fa-phone-volume'}"></i>
        <span>Confirm Emergency Call</span>
      </div>
    `;

    bodyEl.innerHTML = `
      <div class="emergency-confirm-body">
        <div class="confirm-alert-box ${is112 ? 'alert-national' : 'alert-campus'}">
          <div class="confirm-target-title">${is112 ? '🚨 Emergency Services — 112' : `📞 ${targetName}`}</div>
          <div class="confirm-target-role">${targetRole}</div>
          <div class="confirm-target-phone">${phoneNumber}</div>
        </div>

        <p class="confirm-disclaimer-text">
          ${is112 
            ? '<strong>Important:</strong> You are about to initiate a call to <strong>112 (National Emergency Response)</strong>. Use this only for a genuine life-safety, fire, police, or medical emergency.'
            : 'You are about to connect with the authorized campus medical or safety responder. State your name, location, and issue clearly.'
          }
        </p>

        <div class="confirm-location-preview">
          <i class="fas fa-location-crosshairs"></i>
          <span>Reported Location: <strong>${this.currentLocation.block}, ${this.currentLocation.area}</strong></span>
        </div>

        ${!isMobile ? `
          <div class="desktop-dial-assist">
            <i class="fas fa-laptop"></i>
            <div>
              <strong>Desktop Device Detected:</strong> Web browsers on PCs cannot place direct cellular phone calls.
              Please use your mobile phone to dial:
              <div class="desktop-phone-number">${phoneNumber}</div>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    footerEl.innerHTML = `
      <button class="btn btn-secondary" onclick="UI.closeModal()">
        Cancel
      </button>
      <button class="btn btn-danger btn-call-confirm" id="btn-proceed-emergency-call" style="background: ${is112 ? '#ef4444' : 'var(--primary)'}; font-weight: 800;">
        <i class="fas fa-phone"></i>
        <span>${isMobile ? 'Call Now' : 'Copy Number & Proceed'}</span>
      </button>
    `;

    overlay.classList.add('active');

    document.getElementById('btn-proceed-emergency-call')?.addEventListener('click', () => {
      this.executeCall(phoneNumber, targetName, isMobile);
    });
  },

  executeCall(phoneNumber, targetName, isMobile) {
    if (isMobile) {
      UI.toast(`Connecting to ${targetName} (${phoneNumber})...`, 'info');
      setTimeout(() => {
        window.location.href = `tel:${phoneNumber}`;
        UI.closeModal();
      }, 350);
    } else {
      // Desktop assist
      navigator.clipboard?.writeText(phoneNumber).then(() => {
        UI.toast(`Number ${phoneNumber} copied to clipboard. Please dial on your phone.`, 'success');
      }).catch(() => {
        UI.toast(`Please dial ${phoneNumber} on your mobile phone.`, 'info');
      });
      UI.closeModal();
    }
  },

  /**
   * Emergency Detection Helper for AI Chatbot
   * Inspects user message for medical, fire, or police emergency phrases
   */
  detectEmergencyIntent(text) {
    if (!text || typeof text !== 'string') return null;
    const clean = text.toLowerCase().trim();

    // 1. Medical emergency patterns
    const medicalRegex = /\b(collapsed|fainted|unconscious|not breathing|heart attack|chest pain|bleeding|ambulance|choking|stroke|severe seizure|fell down stairs|head injury|fracture|overdose|hospital|dying|died)\b/i;
    if (medicalRegex.test(clean)) {
      return {
        type: 'medical',
        title: '🚨 Possible Medical Emergency',
        message: 'If someone is in immediate danger, contact emergency medical services right now. EduGuard AI cannot diagnose conditions or replace medical responders.',
        actions: [
          { label: 'Call 112', primary: true, is112: true, phone: '112' },
          { label: 'Call Campus Doctor', primary: false, category: 'MEDICAL' },
          { label: 'Continue Chat', dismiss: true }
        ]
      };
    }

    // 2. Fire emergency patterns
    const fireRegex = /\b(fire in|smoke in|flames|cylinder blast|gas leak|burning smell|building on fire|short circuit fire|fire alarm)\b/i;
    if (fireRegex.test(clean)) {
      return {
        type: 'fire',
        title: '🔥 Fire Emergency Detected',
        message: 'If there is an active fire or immediate hazard, immediately evacuate to the nearest campus assembly point and alert emergency services.',
        actions: [
          { label: 'Call 112', primary: true, is112: true, phone: '112' },
          { label: 'Campus Fire Desk', primary: false, category: 'FIRE' },
          { label: 'Close', dismiss: true }
        ]
      };
    }

    // 3. Police / physical safety patterns
    const securityRegex = /\b(security threat|active shooter|armed|weapon|hostage|violent attack|physical fight|harassment|ragging|robbery|break-in|stalking|danger to life)\b/i;
    if (securityRegex.test(clean)) {
      return {
        type: 'police',
        title: '🚔 Police & Security Assistance',
        message: 'If there is an immediate threat to your safety or others, contact police emergency response (112) or Campus Security Control immediately.',
        actions: [
          { label: 'Call 112', primary: true, is112: true, phone: '112' },
          { label: 'Campus Security', primary: false, category: 'SECURITY' },
          { label: 'Close', dismiss: true }
        ]
      };
    }

    return null;
  }
};
