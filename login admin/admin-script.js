/* =========================================================
   CAMPUS FIX AI — ADMINISTRATIVE & TEACHER PORTAL
   Role-Aware Authentication Controller & Environmental Parallax
========================================================= */

(() => {
  "use strict";

  /* =======================================================
     DOM REFERENCES
  ======================================================= */
  const videoContainer = document.getElementById("adminVideoContainer");
  const adminVideo = document.getElementById("adminVideo");
  const adminBgFallback = document.getElementById("adminBgFallback");
  const adminOverlay = document.getElementById("adminOverlay");
  const adminGlow = document.getElementById("adminGlow");
  const card = document.getElementById("adminCard");

  // Role elements
  const roleAdminBtn = document.getElementById("roleAdmin");
  const roleTeacherBtn = document.getElementById("roleTeacher");
  const clearanceBadge = document.getElementById("clearanceBadge");
  const portalTitle = document.getElementById("portalTitle");
  const portalSubtitle = document.getElementById("portalSubtitle");
  const submitBtnText = document.getElementById("submitBtnText");

  // Form elements
  const form = document.getElementById("adminLoginForm");
  const emailInput = document.getElementById("adminEmail");
  const passwordInput = document.getElementById("adminPassword");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const rememberCheckbox = document.getElementById("rememberDevice");
  const togglePasswordBtn = document.getElementById("toggleAdminPassword");
  const submitBtn = document.getElementById("adminSubmitBtn");
  const googleBtn = document.getElementById("googleSsoBtn");
  const googleBtnText = document.getElementById("googleBtnText");
  const formFeedback = document.getElementById("formFeedback");
  const forgotLink = document.getElementById("forgotCredentialsLink");

  // State
  let currentRole = "admin";
  let isInteractive = true;

  /* =======================================================
     1. VIDEO PLAYBACK & FALLBACK DISSOLVE
  ======================================================= */
  if (adminVideo) {
    adminVideo.muted = true;
    adminVideo.defaultMuted = true;

    // Smoothly dissolve static fallback once video is active
    adminVideo.addEventListener("playing", () => {
      if (adminBgFallback) {
        adminBgFallback.style.opacity = "0";
      }
    }, { once: true });

    const playPromise = adminVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        const triggerAutoplay = () => {
          adminVideo.play().catch(() => {});
          window.removeEventListener("pointerdown", triggerAutoplay);
          window.removeEventListener("touchstart", triggerAutoplay);
          window.removeEventListener("keydown", triggerAutoplay);
        };
        window.addEventListener("pointerdown", triggerAutoplay, { once: true });
        window.addEventListener("touchstart", triggerAutoplay, { once: true });
        window.addEventListener("keydown", triggerAutoplay, { once: true });
      });
    }
  }

  /* =======================================================
     2. ROLE SWITCHER CONTROLLER
  ======================================================= */
  const roleData = {
    admin: {
      clearance: "SECURITY GATEWAY • INSTITUTIONAL SSO",
      title: "Administrator Access",
      subtitle: "Secure command center for university infrastructure, asset dispatch, and system operations.",
      placeholder: "admin@campus.edu or employee ID",
      buttonText: "Authorize & Sign In",
      googleText: "Continue with Google Workspace (Admin)"
    },
    teacher: {
      clearance: "FACULTY PORTAL • LEVEL 2 CLEARANCE",
      title: "Teacher & Staff Access",
      subtitle: "Manage department facilities, academic space maintenance, and classroom diagnostics.",
      placeholder: "faculty.id@campus.edu or employee ID",
      buttonText: "Sign In to Faculty Portal",
      googleText: "Continue with Google Workspace (Faculty)"
    }
  };

  function setRole(role) {
    if (currentRole === role) return;
    currentRole = role;

    // Update tab visual states
    if (role === "admin") {
      roleAdminBtn.classList.add("active");
      roleAdminBtn.setAttribute("aria-selected", "true");
      roleTeacherBtn.classList.remove("active");
      roleTeacherBtn.setAttribute("aria-selected", "false");
    } else {
      roleTeacherBtn.classList.add("active");
      roleTeacherBtn.setAttribute("aria-selected", "true");
      roleAdminBtn.classList.remove("active");
      roleAdminBtn.setAttribute("aria-selected", "false");
    }

    if (form) {
      form.dataset.currentRole = role;
    }

    // Clear previous feedback
    clearFeedback();

    const data = roleData[role];
    if (!data) return;

    // Subtle transition of copy
    if (clearanceBadge) clearanceBadge.textContent = data.clearance;
    if (emailInput) emailInput.placeholder = data.placeholder;
    if (submitBtnText) submitBtnText.textContent = data.buttonText;
    if (googleBtnText) googleBtnText.textContent = data.googleText;

    if (portalTitle && portalSubtitle) {
      if (typeof gsap !== "undefined") {
        gsap.fromTo(
          [portalTitle, portalSubtitle],
          { opacity: 0.3, y: 4 },
          { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" }
        );
      }
      portalTitle.textContent = data.title;
      portalSubtitle.textContent = data.subtitle;
    }
  }

  if (roleAdminBtn) {
    roleAdminBtn.addEventListener("click", () => setRole("admin"));
  }

  if (roleTeacherBtn) {
    roleTeacherBtn.addEventListener("click", () => setRole("teacher"));
  }

  /* =======================================================
     3. PARALLAX DEPTH & INERTIA (DESKTOP & TOUCH)
  ======================================================= */
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const mouseTarget = { x: 0, y: 0 };
  const mouseCurrent = { x: 0, y: 0 };

  const scrollTarget = { offset: 0 };
  const scrollCurrent = { offset: 0 };

  if (!prefersReducedMotion) {
    window.addEventListener(
      "mousemove",
      (e) => {
        mouseTarget.x = e.clientX / window.innerWidth - 0.5;
        mouseTarget.y = e.clientY / window.innerHeight - 0.5;
      },
      { passive: true }
    );

    window.addEventListener(
      "mouseleave",
      () => {
        mouseTarget.x = 0;
        mouseTarget.y = 0;
      },
      { passive: true }
    );

    window.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches && e.touches.length > 0) {
          const touch = e.touches[0];
          mouseTarget.x = (touch.clientX / window.innerWidth - 0.5) * 0.7;
          mouseTarget.y = (touch.clientY / window.innerHeight - 0.5) * 0.7;
        }
      },
      { passive: true }
    );

    window.addEventListener(
      "wheel",
      (e) => {
        const delta = Math.max(-70, Math.min(70, e.deltaY));
        scrollTarget.offset += delta * 0.025;
        scrollTarget.offset = Math.max(-10, Math.min(10, scrollTarget.offset));
      },
      { passive: true }
    );

    const easing = 0.045;

    function renderParallax() {
      requestAnimationFrame(renderParallax);

      mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * easing;
      mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * easing;

      scrollTarget.offset *= 0.94;
      scrollCurrent.offset += (scrollTarget.offset - scrollCurrent.offset) * 0.06;

      const isMobile = window.innerWidth < 1024;
      const intensity = isMobile ? 0.35 : 1.0;

      // Background video subtle shift (inverse movement, max ~12px)
      const mouseDistance = Math.hypot(mouseCurrent.x, mouseCurrent.y);
      const videoScale = 1.03 + mouseDistance * 0.016 * intensity;
      const videoShiftX = -mouseCurrent.x * 16 * intensity;
      const videoShiftY = -mouseCurrent.y * 12 * intensity + scrollCurrent.offset;

      if (videoContainer) {
        videoContainer.style.transform = `translate3d(${videoShiftX.toFixed(2)}px, ${videoShiftY.toFixed(2)}px, 0) scale(${videoScale.toFixed(4)})`;
      }

      // Overlay & glow shift
      const overlayShiftX = -mouseCurrent.x * 8 * intensity;
      const overlayShiftY = -mouseCurrent.y * 6 * intensity + scrollCurrent.offset * 0.5;

      if (adminOverlay) {
        adminOverlay.style.transform = `translate3d(${overlayShiftX.toFixed(2)}px, ${overlayShiftY.toFixed(2)}px, 0)`;
      }

      if (adminGlow) {
        adminGlow.style.transform = `translate3d(${(overlayShiftX * 1.2).toFixed(2)}px, ${(overlayShiftY * 1.2).toFixed(2)}px, 0)`;
      }

      // Card micro-parallax (very small: 3-5px max)
      if (card && isInteractive && !isMobile) {
        const cardShiftX = mouseCurrent.x * 4;
        const cardShiftY = mouseCurrent.y * 3 - scrollCurrent.offset * 0.2;
        card.style.transform = `translate3d(${cardShiftX.toFixed(2)}px, ${cardShiftY.toFixed(2)}px, 0)`;
      } else if (card && isMobile) {
        card.style.transform = "translate3d(0, 0, 0)";
      }
    }

    renderParallax();
  }

  /* =======================================================
     4. GSAP PAGE ENTRANCE
  ======================================================= */
  if (typeof gsap !== "undefined" && card && !prefersReducedMotion) {
    isInteractive = false;
    gsap.fromTo(
      card,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
          isInteractive = true;
          card.style.opacity = "";
          card.style.transform = "";
        }
      }
    );
  }

  /* =======================================================
     5. FORM VALIDATION & AUTH CONTROLLER
  ======================================================= */
  function clearFeedback() {
    if (formFeedback) {
      formFeedback.textContent = "";
      formFeedback.className = "form-feedback";
    }
  }

  function setFeedback(message, type = "") {
    if (formFeedback) {
      formFeedback.textContent = message;
      formFeedback.className = `form-feedback ${type}`.trim();
    }
  }

  function validate() {
    let isValid = true;

    if (emailError) emailError.textContent = "";
    if (passwordError) passwordError.textContent = "";
    if (emailInput) emailInput.classList.remove("invalid");
    if (passwordInput) passwordInput.classList.remove("invalid");

    const emailVal = emailInput ? emailInput.value.trim() : "";
    if (!emailVal) {
      if (emailError) emailError.textContent = "Institutional email is required.";
      if (emailInput) emailInput.classList.add("invalid");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      if (emailError) emailError.textContent = "Please provide a valid institutional email format.";
      if (emailInput) emailInput.classList.add("invalid");
      isValid = false;
    }

    const passVal = passwordInput ? passwordInput.value : "";
    if (!passVal) {
      if (passwordError) passwordError.textContent = "Security credential is required.";
      if (passwordInput) passwordInput.classList.add("invalid");
      isValid = false;
    } else if (passVal.length < 6) {
      if (passwordError) passwordError.textContent = "Security credential must be at least 6 characters.";
      if (passwordInput) passwordInput.classList.add("invalid");
      isValid = false;
    }

    return isValid;
  }

  // Clear errors while typing
  [emailInput, passwordInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => {
      clearFeedback();
      input.classList.remove("invalid");
      if (input === emailInput && emailError) emailError.textContent = "";
      if (input === passwordInput && passwordError) passwordError.textContent = "";
    });
  });

  // Toggle password visibility
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      togglePasswordBtn.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
    });
  }

  // Form submission connected to server auth
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearFeedback();

      if (!validate()) {
        if (typeof gsap !== "undefined" && card) {
          gsap.fromTo(card, { x: 0 }, { x: -5, duration: 0.07, repeat: 4, yoyo: true, ease: "power1.inOut" });
        }
        return;
      }

      const emailVal = emailInput.value.trim();
      const passVal = passwordInput.value;

      if (submitBtn) {
        submitBtn.classList.add("loading");
        submitBtn.disabled = true;
      }
      setFeedback("Authorizing institutional credentials...", "info");

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailVal, password: passVal })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Authorization failed. Please check your institutional credentials.');
        }

        const user = data.user;
        const role = user.role;

        // Security check: If a student tries to sign in through institutional portal, redirect them
        if (role === 'STUDENT') {
          setFeedback("Student account detected. Redirecting to Student Portal...", "error");
          localStorage.setItem('eduguard_token', data.token);
          localStorage.setItem('eduguard_user', JSON.stringify(user));
          setTimeout(() => {
            window.location.href = '/student/dashboard';
          }, 1000);
          return;
        }

        // Store authoritative session
        localStorage.setItem('eduguard_token', data.token);
        localStorage.setItem('eduguard_user', JSON.stringify(user));

        if (role === "ADMIN") {
          setFeedback("Administrator clearance confirmed. Launching System Command Center...", "success");
        } else if (role === "FACULTY") {
          setFeedback("Faculty identity authenticated. Launching Mentorship Workspace...", "success");
        } else if (role === "DEPARTMENT_HEAD") {
          setFeedback("Department Head clearance confirmed. Launching Executive Analytics...", "success");
        } else {
          setFeedback("Staff credentials verified. Launching Facilities & Maintenance Console...", "success");
        }

        setTimeout(() => {
          if (role === "FACULTY") {
            window.location.href = '/faculty/dashboard';
          } else if (role === "ADMIN") {
            window.location.href = '/admin/dashboard';
          } else if (role === "DEPARTMENT_HEAD") {
            window.location.href = '/department-head/dashboard';
          } else {
            window.location.href = '/staff/dashboard';
          }
        }, 600);

      } catch (err) {
        setFeedback(err.message, "error");
        if (typeof gsap !== "undefined" && card) {
          gsap.fromTo(card, { x: 0 }, { x: -5, duration: 0.07, repeat: 4, yoyo: true, ease: "power1.inOut" });
        }
      } finally {
        if (submitBtn) {
          submitBtn.classList.remove("loading");
          submitBtn.disabled = false;
        }
      }
    });
  }

  // Google Workspace SSO with Account Selector & Backend Authentication
  const googleModal = document.getElementById("googleAuthModal");
  const googleBackdrop = document.getElementById("googleBackdrop");
  const googleCloseBtn = document.getElementById("googleModalCloseBtn");
  const googleModalStatus = document.getElementById("googleModalStatus");
  const googleCustomToggle = document.getElementById("googleCustomToggle");
  const googleCustomPanel = document.getElementById("googleCustomPanel");
  const googleCustomName = document.getElementById("googleCustomName");
  const googleCustomEmail = document.getElementById("googleCustomEmail");
  const googleCustomSubmit = document.getElementById("googleCustomSubmit");

  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  }

  const openGoogleModal = () => {
    if (googleModal) {
      googleModal.style.display = "flex";
      googleModal.setAttribute("aria-hidden", "false");
      if (googleModalStatus) googleModalStatus.innerHTML = "";
    }
  };

  const closeGoogleModal = () => {
    if (googleModal) {
      googleModal.style.display = "none";
      googleModal.setAttribute("aria-hidden", "true");
    }
  };

  if (googleBackdrop) googleBackdrop.addEventListener("click", closeGoogleModal);
  if (googleCloseBtn) googleCloseBtn.addEventListener("click", closeGoogleModal);

  if (googleCustomToggle && googleCustomPanel) {
    googleCustomToggle.addEventListener("click", () => {
      const isClosed = googleCustomPanel.style.display === "none";
      googleCustomPanel.style.display = isClosed ? "block" : "none";
      if (isClosed && googleCustomName) googleCustomName.focus();
    });
  }

  const executeGoogleWorkspaceAuth = async (accountEmail = '', accountName = '', accountRole = '', credential = '', accessToken = '') => {
    const displayName = accountName || (accountEmail ? accountEmail.split('@')[0].replace(/[._-]/g, ' ') : 'Institutional User');
    const targetRole = accountRole || (currentRole === "admin" ? "ADMIN" : "FACULTY");

    if (googleModalStatus) {
      googleModalStatus.innerHTML = `<span style="color: #93c5fd;"><i class="fas fa-spinner fa-spin"></i> Authenticating ${displayName} with Google Workspace...</span>`;
    }
    setFeedback(`Connecting to Google Workspace...`, "info");

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: accountEmail, name: displayName, role: targetRole, credential, accessToken })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Google Workspace authentication failed.');
      }

      // Store authentic session
      localStorage.setItem('eduguard_token', data.token);
      localStorage.setItem('eduguard_user', JSON.stringify(data.user));

      const role = data.user.role;
      if (googleModalStatus) {
        googleModalStatus.innerHTML = `<span style="color: #4ade80;"><i class="fas fa-check-circle"></i> Institutional clearance verified for ${data.user.name}!</span>`;
      }
      setFeedback(`Institutional SSO verified for ${data.user.name} (${role.replace('_', ' ')}). Launching workspace...`, "success");

      setTimeout(() => {
        closeGoogleModal();
        if (role === "FACULTY") {
          window.location.href = '/faculty/dashboard';
        } else if (role === "ADMIN") {
          window.location.href = '/admin/dashboard';
        } else if (role === "DEPARTMENT_HEAD") {
          window.location.href = '/department-head/dashboard';
        } else if (role === "STUDENT") {
          window.location.href = '/student/dashboard';
        } else {
          window.location.href = '/staff/dashboard';
        }
      }, 700);

    } catch (err) {
      if (googleModalStatus) {
        googleModalStatus.innerHTML = `<span style="color: #f87171;"><i class="fas fa-circle-exclamation"></i> ${err.message}</span>`;
      }
      setFeedback(err.message, "error");
    }
  };

  // Adapt Google auth modal and UI based on institution config
  fetch('/api/config/institution')
    .then(r => r.json())
    .then(cfg => {
      if (!cfg.demoMode) {
        document.querySelectorAll(".google-account-item[data-email]").forEach(el => {
          el.style.display = 'none';
        });
        const customPanel = document.getElementById("googleCustomPanel");
        if (customPanel) customPanel.style.display = 'block';
        const customToggle = document.getElementById("googleCustomToggle");
        if (customToggle) customToggle.style.display = 'none';
      }
      if (cfg.name) {
        const sub = document.querySelector(".google-auth-subtitle");
        if (sub) sub.innerHTML = `Sign in with your official account for <span style="color: #93c5fd; font-weight: 700;">${cfg.name}</span>`;
      }
    })
    .catch(() => {});

  // Wire up account items in Google modal
  document.querySelectorAll(".google-account-item[data-email]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const email = btn.getAttribute("data-email");
      const name = btn.getAttribute("data-name");
      const role = btn.getAttribute("data-role");
      executeGoogleWorkspaceAuth(email, name, role);
    });
  });

  // Custom Google email submission
  if (googleCustomSubmit) {
    googleCustomSubmit.addEventListener("click", () => {
      const emailVal = googleCustomEmail ? googleCustomEmail.value.trim() : '';
      const nameVal = googleCustomName ? googleCustomName.value.trim() : '';

      if (!emailVal || !emailVal.includes('@')) {
        if (googleModalStatus) {
          googleModalStatus.innerHTML = `<span style="color: #f87171;">Please enter a valid Google Workspace email address.</span>`;
        }
        if (googleCustomEmail) googleCustomEmail.focus();
        return;
      }
      executeGoogleWorkspaceAuth(emailVal, nameVal || emailVal.split('@')[0], currentRole === "admin" ? "ADMIN" : "FACULTY");
    });

    if (googleCustomEmail) {
      googleCustomEmail.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          googleCustomSubmit.click();
        }
      });
    }
  }

  const GOOGLE_CLIENT_ID = "304812275269-vbgg8usmo95gc77g743bmu5tuh0l00fl.apps.googleusercontent.com";

  const triggerGoogleAdminOAuth = () => {
    clearFeedback();
    if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
      try {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          prompt: 'select_account',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              if (tokenResponse.error !== 'popup_closed_by_user') {
                setFeedback(`Google authorization error: ${tokenResponse.error}`, "error");
              }
              return;
            }
            setFeedback("Authenticating institutional Google account...", "info");
            await executeGoogleWorkspaceAuth('', '', currentRole === "admin" ? "ADMIN" : "FACULTY", '', tokenResponse.access_token);
          }
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('[Google Auth] Native popup init failed, falling back:', err);
      }
    }

    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      try {
        google.accounts.id.prompt();
        return;
      } catch (_) {}
    }

    openGoogleModal();
  };

  // Google button on main form
  if (googleBtn) {
    googleBtn.addEventListener("click", triggerGoogleAdminOAuth);
  }

  // Google Identity Services (GSI) One-Tap handler
  window.addEventListener("load", () => {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      try {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response && response.credential) {
              const payload = parseJwt(response.credential);
              if (payload && payload.email) {
                executeGoogleWorkspaceAuth(payload.email, payload.name, currentRole === "admin" ? "ADMIN" : "FACULTY");
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });
      } catch (_) {}
    }
  });

  // Forgot credentials link
  if (forgotLink) {
    forgotLink.addEventListener("click", async (e) => {
      e.preventDefault();
      clearFeedback();
      const emailVal = emailInput ? emailInput.value.trim() : "";
      if (!emailVal) {
        setFeedback("Please enter your institutional email above to receive password recovery instructions.", "error");
        emailInput?.focus();
        return;
      }
      try {
        setFeedback("Dispatching password reset request...", "info");
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailVal })
        });
        const data = await res.json();
        setFeedback(data.message, "success");
      } catch (err) {
        setFeedback("Unable to process request. Please contact the campus IT Help Desk.", "error");
      }
    });
  }
})();
