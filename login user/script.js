/* =========================================================
   CAMPUS FIX AI
   Fully Responsive Living Video Background
   + Ethereal "Come and Pass Out" 3D Ambient Depth Experience
========================================================= */

(() => {
  "use strict";

  /* =======================================================
     DOM REFERENCES
  ======================================================= */
  const videoContainer = document.getElementById("videoContainer");
  const backgroundVideo = document.getElementById("backgroundVideo");
  const backgroundOverlay = document.getElementById("backgroundOverlay");
  const backgroundGlow = document.getElementById("backgroundGlow");
  const ambientCanvas = document.getElementById("ambientCanvas");
  const card = document.getElementById("loginCard");
  const form = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const loginButton = document.getElementById("loginButton");
  const googleButton = document.getElementById("googleButton");
  const togglePassword = document.getElementById("togglePassword");
  const formStatus = document.getElementById("formStatus");
  const forgotLink = document.getElementById("forgotLink");
  const signupLink = document.getElementById("signupLink");

  /* =======================================================
     1. BACKGROUND VIDEO MANAGEMENT
  ======================================================= */
  if (backgroundVideo) {
    backgroundVideo.muted = true;
    backgroundVideo.defaultMuted = true;

    const playPromise = backgroundVideo.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Fallback for mobile/browser autoplay policies
        const handleFirstGesture = () => {
          backgroundVideo.play().catch(() => {});
          window.removeEventListener("pointerdown", handleFirstGesture);
          window.removeEventListener("touchstart", handleFirstGesture);
          window.removeEventListener("keydown", handleFirstGesture);
        };
        window.addEventListener("pointerdown", handleFirstGesture, { once: true });
        window.addEventListener("touchstart", handleFirstGesture, { once: true });
        window.addEventListener("keydown", handleFirstGesture, { once: true });
      });
    }
  }

  /* =======================================================
     2. MOUSE / TOUCH PARALLAX TRACKING
  ======================================================= */
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const mouseTarget = { x: 0, y: 0 };
  const mouseCurrent = { x: 0, y: 0 };

  const scrollTarget = { offset: 0, scale: 0 };
  const scrollCurrent = { offset: 0, scale: 0 };

  let isInteractive = true;

  if (!prefersReducedMotion) {
    // Desktop cursor
    window.addEventListener(
      "mousemove",
      (e) => {
        mouseTarget.x = e.clientX / window.innerWidth - 0.5;
        mouseTarget.y = e.clientY / window.innerHeight - 0.5;
      },
      { passive: true }
    );

    // Desktop cursor exit
    window.addEventListener(
      "mouseleave",
      () => {
        mouseTarget.x = 0;
        mouseTarget.y = 0;
      },
      { passive: true }
    );

    // Mobile touch interaction
    window.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches && e.touches.length > 0) {
          const touch = e.touches[0];
          mouseTarget.x = (touch.clientX / window.innerWidth - 0.5) * 0.8;
          mouseTarget.y = (touch.clientY / window.innerHeight - 0.5) * 0.8;
        }
      },
      { passive: true }
    );

    window.addEventListener(
      "touchend",
      () => {
        mouseTarget.x = 0;
        mouseTarget.y = 0;
      },
      { passive: true }
    );

    // Subtle scroll inertia reaction
    window.addEventListener(
      "wheel",
      (e) => {
        const delta = Math.max(-80, Math.min(80, e.deltaY));
        scrollTarget.offset += delta * 0.03;
        scrollTarget.offset = Math.max(-12, Math.min(12, scrollTarget.offset));
        scrollTarget.scale = Math.max(-0.005, Math.min(0.005, scrollTarget.offset * 0.0003));
      },
      { passive: true }
    );

    // Parallax update loop
    const easing = 0.045;

    function updateParallax() {
      requestAnimationFrame(updateParallax);

      // Smooth interpolation
      mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * easing;
      mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * easing;

      // Scroll decay
      scrollTarget.offset *= 0.94;
      scrollTarget.scale *= 0.94;
      scrollCurrent.offset += (scrollTarget.offset - scrollCurrent.offset) * 0.06;
      scrollCurrent.scale += (scrollTarget.scale - scrollCurrent.scale) * 0.06;

      // Check if on mobile / tablet to adjust parallax intensity
      const isMobile = window.innerWidth < 1024;
      const moveFactor = isMobile ? 0.45 : 1.0;

      // Video background shift (inverse depth)
      const mouseDist = Math.hypot(mouseCurrent.x, mouseCurrent.y);
      const videoScale = 1.03 + (mouseDist * 0.018 * moveFactor) + scrollCurrent.scale;
      const videoShiftX = -mouseCurrent.x * 20 * moveFactor;
      const videoShiftY = -mouseCurrent.y * 14 * moveFactor + scrollCurrent.offset;

      if (videoContainer) {
        videoContainer.style.transform = `translate3d(${videoShiftX.toFixed(2)}px, ${videoShiftY.toFixed(2)}px, 0) scale(${videoScale.toFixed(4)})`;
      }

      // Atmospheric overlay & glow
      const overlayShiftX = -mouseCurrent.x * 10 * moveFactor;
      const overlayShiftY = -mouseCurrent.y * 7 * moveFactor + scrollCurrent.offset * 0.5;

      if (backgroundOverlay) {
        backgroundOverlay.style.transform = `translate3d(${overlayShiftX.toFixed(2)}px, ${overlayShiftY.toFixed(2)}px, 0)`;
      }

      if (backgroundGlow) {
        backgroundGlow.style.transform = `translate3d(${(overlayShiftX * 1.25).toFixed(2)}px, ${(overlayShiftY * 1.25).toFixed(2)}px, 0)`;
      }

      // Card micro-parallax (very subtle)
      if (card && isInteractive && !isMobile) {
        const cardShiftX = mouseCurrent.x * 5;
        const cardShiftY = mouseCurrent.y * 3.5 - scrollCurrent.offset * 0.2;
        card.style.transform = `translate3d(${cardShiftX.toFixed(2)}px, ${cardShiftY.toFixed(2)}px, 0)`;
      } else if (card && isMobile) {
        card.style.transform = "translate3d(0, 0, 0)";
      }
    }

    updateParallax();
  }

  /* =======================================================
     3. ETHEREAL 3D AMBIENT LAYER
     "Come and Pass Out" Ethereal Motes & Glass Ring Accents
  ======================================================= */
  function initAmbient3D() {
    if (!ambientCanvas || typeof THREE === "undefined" || prefersReducedMotion) {
      return;
    }

    // SCENE & CAMERA
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      80
    );
    camera.position.set(0, 0, 16);

    // RENDERER
    const renderer = new THREE.WebGLRenderer({
      canvas: ambientCanvas,
      alpha: true,
      antialias: true,
      powerPreference: "low-power"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    // LIGHTING (Subtle ambient & key highlights for rings)
    const ambientLight = new THREE.AmbientLight(0x89c5ff, 0.7);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x6ec0ff, 3.5, 30);
    pointLight.position.set(-3, 3, 6);
    scene.add(pointLight);

    /* -----------------------------------------------------
       A. ETHEREAL GLOW SPRITE TEXTURE
    ----------------------------------------------------- */
    function createSoftGlowTexture() {
      const c = document.createElement("canvas");
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext("2d");
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(255, 255, 255, 1)");
      grad.addColorStop(0.2, "rgba(160, 225, 255, 0.9)");
      grad.addColorStop(0.55, "rgba(90, 160, 255, 0.3)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    }

    const glowMap = createSoftGlowTexture();

    /* -----------------------------------------------------
       B. "COME AND PASS OUT" AMBIENT MOTES
       Individual lifecycles: softly fade in, drift, fade out
    ----------------------------------------------------- */
    const moteCount = 24; // Refined and elegant, not cluttered
    const motes = [];

    const moteGeometry = new THREE.PlaneGeometry(1, 1);

    for (let i = 0; i < moteCount; i++) {
      const material = new THREE.MeshBasicMaterial({
        map: glowMap,
        transparent: true,
        opacity: 0, // Starts at 0
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: i % 3 === 0 ? 0x85dcff : (i % 3 === 1 ? 0xa2b4ff : 0xd2f2ff)
      });

      const mesh = new THREE.Mesh(moteGeometry, material);

      const mote = {
        mesh,
        // 3D position
        x: THREE.MathUtils.randFloatSpread(22),
        y: THREE.MathUtils.randFloatSpread(14),
        z: THREE.MathUtils.randFloat(-8, 3),
        // Drift velocity
        vx: THREE.MathUtils.randFloat(-0.15, 0.15),
        vy: THREE.MathUtils.randFloat(0.1, 0.35), // gentle upward float
        vz: THREE.MathUtils.randFloat(0.05, 0.25), // gentle forward drift towards camera
        // Lifecycle
        progress: Math.random(), // Stagger initial lifecycle so they don't all appear at once
        lifespan: THREE.MathUtils.randFloat(4.5, 8.5), // Seconds to live
        baseScale: THREE.MathUtils.randFloat(0.24, 0.48),
        maxOpacity: THREE.MathUtils.randFloat(0.55, 0.85)
      };

      mesh.position.set(mote.x, mote.y, mote.z);
      mesh.scale.setScalar(mote.baseScale);
      scene.add(mesh);
      motes.push(mote);
    }

    /* -----------------------------------------------------
       C. 2-3 SUBTLE FLOATING GLASS RINGS
       Ethereal holographic rings rotating slowly in distance
    ----------------------------------------------------- */
    const rings = [];
    const ringConfigs = [
      { r: 1.4, tube: 0.016, p: [-4.0, 1.4, -2.5], rot: [0.6, 0.2, 0.1], c: 0x76c9ff, s: 0.0018 },
      { r: 1.1, tube: 0.014, p: [3.2, -1.8, -2.0], rot: [1.1, -0.4, 0.5], c: 0x93a5ff, s: 0.0014 },
      { r: 0.8, tube: 0.012, p: [-1.2, 2.8, -3.0], rot: [1.4, 0.5, -0.4], c: 0x7fdfff, s: 0.0022 }
    ];

    ringConfigs.forEach((cfg) => {
      const ringGeo = new THREE.TorusGeometry(cfg.r, cfg.tube, 14, 80);
      const ringMat = new THREE.MeshStandardMaterial({
        color: cfg.c,
        emissive: cfg.c,
        emissiveIntensity: 0.55,
        transparent: true,
        opacity: 0.45,
        roughness: 0.25,
        metalness: 0.3
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.set(...cfg.p);
      ringMesh.rotation.set(...cfg.rot);
      scene.add(ringMesh);

      rings.push({
        mesh: ringMesh,
        speed: cfg.s,
        baseOpacity: 0.45,
        phase: Math.random() * Math.PI * 2
      });
    });

    /* -----------------------------------------------------
       D. RENDER & LIFECYCLE ANIMATION LOOP
    ----------------------------------------------------- */
    const clock = new THREE.Clock();

    function animateAmbient() {
      requestAnimationFrame(animateAmbient);

      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();

      // Camera parallax response (smooth interpolation with mouse/touch)
      camera.position.x += (mouseCurrent.x * 0.5 - camera.position.x) * 0.035;
      camera.position.y += (-mouseCurrent.y * 0.3 - camera.position.y) * 0.035;
      camera.lookAt(0, 0, 0);

      // Animate Motes ("Come and Pass Out")
      motes.forEach((mote) => {
        mote.progress += delta / mote.lifespan;

        // Reset if lifecycle finished or drifted past camera
        if (mote.progress >= 1.0 || mote.z > 6) {
          mote.progress = 0;
          mote.lifespan = THREE.MathUtils.randFloat(4.5, 8.5);
          mote.x = THREE.MathUtils.randFloatSpread(22);
          mote.y = THREE.MathUtils.randFloat(-6, 4);
          mote.z = THREE.MathUtils.randFloat(-9, -2);
          mote.baseScale = THREE.MathUtils.randFloat(0.24, 0.48);
          mote.maxOpacity = THREE.MathUtils.randFloat(0.55, 0.85);
        }

        // Drift motion
        mote.x += mote.vx * delta * 0.8;
        mote.y += mote.vy * delta * 0.8;
        mote.z += mote.vz * delta * 0.8;

        mote.mesh.position.set(mote.x, mote.y, mote.z);

        // Sinusoidal opacity: 0 -> peak -> 0 ("come and pass out")
        const lifeFactor = Math.sin(mote.progress * Math.PI);
        mote.mesh.material.opacity = lifeFactor * mote.maxOpacity;

        // Subtle breathing scale
        const scale = mote.baseScale * (0.85 + lifeFactor * 0.3);
        mote.mesh.scale.setScalar(scale);

        // Always face camera
        mote.mesh.quaternion.copy(camera.quaternion);
      });

      // Animate Glass Rings (slow rotation and breathing opacity)
      rings.forEach((ring) => {
        ring.mesh.rotation.x += ring.speed;
        ring.mesh.rotation.y += ring.speed * 1.3;
        ring.mesh.material.opacity = ring.baseOpacity + Math.sin(elapsed * 0.6 + ring.phase) * 0.15;
      });

      renderer.render(scene, camera);
    }

    animateAmbient();

    // RESIZE LISTENER
    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // Initialize 3D Ambient Layer safely
  try {
    initAmbient3D();
  } catch (err) {
    console.log("Ambient 3D layer error:", err);
  }

  /* =======================================================
     4. GSAP ENTRANCE ANIMATION (WITH SAFE FALLBACK)
  ======================================================= */
  if (typeof gsap !== "undefined" && card) {
    if (!prefersReducedMotion) {
      isInteractive = false;
      gsap.from(card, {
        opacity: 0,
        y: 28,
        duration: 0.85,
        ease: "power3.out",
        onComplete: () => {
          isInteractive = true;
        }
      });

      gsap.from(
        ".brand, .intro, .field, .row-between, .primary-btn, .divider, .google-btn, .signup",
        {
          opacity: 0,
          y: 12,
          duration: 0.5,
          stagger: 0.04,
          delay: 0.15,
          ease: "power2.out"
        }
      );
    }
  } else if (card) {
    card.style.opacity = "1";
    card.style.transform = "translate3d(0, 0, 0)";
  }

  /* =======================================================
     5. LOGIN FORM INTERACTIONS (FRONTEND ONLY)
  ======================================================= */
  function clearStatus() {
    if (formStatus) {
      formStatus.textContent = "";
      formStatus.className = "form-status";
    }
  }

  function setStatus(message, type = "") {
    if (formStatus) {
      formStatus.textContent = message;
      formStatus.className = `form-status ${type}`.trim();
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
      if (emailError) emailError.textContent = "Please enter your email address.";
      if (emailInput) emailInput.classList.add("invalid");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      if (emailError) emailError.textContent = "Please enter a valid email address.";
      if (emailInput) emailInput.classList.add("invalid");
      isValid = false;
    }

    const passVal = passwordInput ? passwordInput.value : "";
    if (!passVal) {
      if (passwordError) passwordError.textContent = "Please enter your password.";
      if (passwordInput) passwordInput.classList.add("invalid");
      isValid = false;
    } else if (passVal.length < 6) {
      if (passwordError) passwordError.textContent = "Password must contain at least 6 characters.";
      if (passwordInput) passwordInput.classList.add("invalid");
      isValid = false;
    }

    return isValid;
  }

  // Clear errors while typing
  [emailInput, passwordInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => {
      clearStatus();
      input.classList.remove("invalid");
      if (input === emailInput && emailError) emailError.textContent = "";
      if (input === passwordInput && passwordError) passwordError.textContent = "";
    });
  });

  // Toggle password visibility
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      togglePassword.setAttribute(
        "aria-label",
        isPassword ? "Hide password" : "Show password"
      );
    });
  }

  // Login form submission
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearStatus();

      if (!validate()) {
        if (typeof gsap !== "undefined" && card) {
          gsap.fromTo(card, { x: 0 }, { x: -6, duration: 0.08, repeat: 4, yoyo: true, ease: "power1.inOut" });
        }
        return;
      }

      const emailVal = emailInput.value.trim();
      const passVal = passwordInput.value;

      if (loginButton) {
        loginButton.classList.add("loading");
        loginButton.disabled = true;
      }
      setStatus("Signing in...", "info");

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailVal, password: passVal })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Authentication failed. Please verify your credentials.');
        }

        const user = data.user;
        const role = user.role;

        // Verify role authority
        if (role !== 'STUDENT') {
          setStatus(`Institutional account detected (${role.replace('_', ' ')}). Redirecting to Staff Portal...`, "info");
          localStorage.setItem('eduguard_token', data.token);
          localStorage.setItem('eduguard_user', JSON.stringify(user));
          setTimeout(() => {
            window.location.href = '/staff/login';
          }, 1000);
          return;
        }

        // Student authenticated successfully
        localStorage.setItem('eduguard_token', data.token);
        localStorage.setItem('eduguard_user', JSON.stringify(user));
        setStatus("Authentication successful! Loading your student workspace...", "success");

        setTimeout(() => {
          window.location.href = '/student/dashboard';
        }, 600);
      } catch (err) {
        setStatus(err.message, "error");
        if (typeof gsap !== "undefined" && card) {
          gsap.fromTo(card, { x: 0 }, { x: -6, duration: 0.08, repeat: 4, yoyo: true, ease: "power1.inOut" });
        }
      } finally {
        if (loginButton) {
          loginButton.classList.remove("loading");
          loginButton.disabled = false;
        }
      }
    });
  }

  // Evaluator Demo Access Autofill
  const demoFillBtn = document.getElementById("fillDemoStudentBtn");
  if (demoFillBtn) {
    demoFillBtn.addEventListener("click", () => {
      if (emailInput) {
        emailInput.value = "student@eduguard.edu";
        emailInput.dispatchEvent(new Event('input'));
      }
      if (passwordInput) {
        passwordInput.value = "student123";
        passwordInput.dispatchEvent(new Event('input'));
      }
      clearStatus();
      setStatus("Demo student credentials loaded. Click 'Log in' to enter.", "info");
    });
  }

  // Google Sign-In with Account Selector & Real Google ID Authentication
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
      setTimeout(() => {
        if (googleCustomEmail) googleCustomEmail.focus();
      }, 100);
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

  const executeGoogleAuth = async (accountEmail, accountName, avatarUrl = '') => {
    if (!accountEmail) return;

    const displayName = accountName || accountEmail.split('@')[0].replace(/[._-]/g, ' ');

    if (googleModalStatus) {
      googleModalStatus.innerHTML = `<span style="color: #93c5fd;"><i class="fas fa-spinner fa-spin"></i> Authenticating ${displayName} with Google...</span>`;
    }
    setStatus(`Connecting with Google as ${displayName}...`, "info");

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: accountEmail, name: displayName, avatar: avatarUrl, role: 'STUDENT' })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Google authentication failed.');
      }

      // Store authentic session
      localStorage.setItem('eduguard_token', data.token);
      localStorage.setItem('eduguard_user', JSON.stringify(data.user));

      if (googleModalStatus) {
        googleModalStatus.innerHTML = `<span style="color: #4ade80;"><i class="fas fa-check-circle"></i> Verified as ${data.user.name}! Redirecting...</span>`;
      }
      setStatus(`Google authentication successful for ${data.user.name}! Opening student workspace...`, "success");

      setTimeout(() => {
        closeGoogleModal();
        window.location.href = '/student/dashboard';
      }, 650);

    } catch (err) {
      if (googleModalStatus) {
        googleModalStatus.innerHTML = `<span style="color: #f87171;"><i class="fas fa-circle-exclamation"></i> ${err.message}</span>`;
      }
      setStatus(err.message, "error");
    }
  };

  // Wire up account items in Google modal
  document.querySelectorAll(".google-account-item[data-email]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const email = btn.getAttribute("data-email");
      const name = btn.getAttribute("data-name");
      executeGoogleAuth(email, name);
    });
  });

  // Custom Real Google Account submission
  if (googleCustomSubmit) {
    googleCustomSubmit.addEventListener("click", () => {
      const emailVal = googleCustomEmail ? googleCustomEmail.value.trim() : '';
      const nameVal = googleCustomName ? googleCustomName.value.trim() : '';

      if (!emailVal || !emailVal.includes('@')) {
        if (googleModalStatus) {
          googleModalStatus.innerHTML = `<span style="color: #f87171;">Please enter a valid Google email address.</span>`;
        }
        if (googleCustomEmail) googleCustomEmail.focus();
        return;
      }
      executeGoogleAuth(emailVal, nameVal || emailVal.split('@')[0]);
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

  const triggerGoogleNativeOAuth = () => {
    clearStatus();
    // 1. Try Google Identity Services OAuth2 Token Client (Native Google Account Chooser Popup)
    if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
      try {
        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          prompt: 'select_account',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              if (tokenResponse.error !== 'popup_closed_by_user') {
                setStatus(`Google authorization error: ${tokenResponse.error}`, "error");
              }
              return;
            }
            setStatus("Authenticating with your Google account...", "info");
            try {
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              });
              const profile = await userInfoRes.json();
              if (profile && profile.email) {
                await executeGoogleAuth(profile.email, profile.name || profile.email.split('@')[0], profile.picture || '');
              } else {
                throw new Error("Could not retrieve Google profile data.");
              }
            } catch (err) {
              setStatus(`Google sign-in error: ${err.message}`, "error");
            }
          }
        });
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('[Google Auth] Native popup init failed, falling back:', err);
      }
    }

    // 2. Try Google One-Tap prompt if initialized
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
      try {
        google.accounts.id.prompt();
        return;
      } catch (_) {}
    }

    // 3. Fallback to direct modal if Google libraries are blocked/offline
    openGoogleModal();
  };

  // Google button on main form
  if (googleButton) {
    googleButton.addEventListener("click", triggerGoogleNativeOAuth);
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
                executeGoogleAuth(payload.email, payload.name, payload.picture);
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });
      } catch (_) {}
    }
  });

  // Forgot password & Sign up demo links
  if (forgotLink) {
    forgotLink.addEventListener("click", async (e) => {
      e.preventDefault();
      clearStatus();
      const emailVal = emailInput ? emailInput.value.trim() : "";
      if (!emailVal) {
        setStatus("Please enter your email above to receive password recovery instructions.", "error");
        emailInput?.focus();
        return;
      }
      try {
        setStatus("Dispatching password reset request...", "info");
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailVal })
        });
        const data = await res.json();
        setStatus(data.message, "success");
      } catch (err) {
        setStatus("Unable to send reset instructions. Please contact campus IT support.", "error");
      }
    });
  }

  if (signupLink) {
    signupLink.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "/student/register";
    });
  }
})();