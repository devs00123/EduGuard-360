/* =========================================================
   EDUGUARD 360 — STUDENT REGISTRATION CONTROLLER
   Background Video + Ambient 3D Engine + Backend API
========================================================= */

(() => {
  "use strict";

  const videoContainer = document.getElementById("videoContainer");
  const backgroundVideo = document.getElementById("backgroundVideo");
  const ambientCanvas = document.getElementById("ambientCanvas");
  const card = document.getElementById("loginCard");
  const form = document.getElementById("registerForm");

  const nameInput = document.getElementById("regName");
  const rollInput = document.getElementById("regRollNumber");
  const emailInput = document.getElementById("regEmail");
  const semesterInput = document.getElementById("regSemester");
  const courseInput = document.getElementById("regCourse");
  const passwordInput = document.getElementById("regPassword");
  const confirmInput = document.getElementById("regConfirmPassword");

  const nameError = document.getElementById("nameError");
  const rollError = document.getElementById("rollError");
  const emailError = document.getElementById("emailError");
  const passwordError = document.getElementById("passwordError");
  const confirmError = document.getElementById("confirmError");
  const regButton = document.getElementById("registerButton");
  const regStatus = document.getElementById("regStatus");

  // Video Autoplay Handling
  if (backgroundVideo) {
    backgroundVideo.muted = true;
    backgroundVideo.play().catch(() => {
      const trigger = () => {
        backgroundVideo.play().catch(() => {});
        window.removeEventListener("pointerdown", trigger);
      };
      window.addEventListener("pointerdown", trigger, { once: true });
    });
  }

  // GSAP Entrance
  if (typeof gsap !== "undefined" && card) {
    gsap.from(card, {
      opacity: 0,
      y: 20,
      duration: 0.65,
      ease: "power2.out"
    });
  }

  function clearStatus() {
    if (regStatus) {
      regStatus.textContent = "";
      regStatus.className = "form-status";
    }
  }

  function setStatus(msg, type = "") {
    if (regStatus) {
      regStatus.textContent = msg;
      regStatus.className = `form-status ${type}`.trim();
    }
  }

  function validate() {
    let isValid = true;
    if (nameError) nameError.textContent = "";
    if (rollError) rollError.textContent = "";
    if (emailError) emailError.textContent = "";
    if (passwordError) passwordError.textContent = "";
    if (confirmError) confirmError.textContent = "";

    if (!nameInput.value.trim()) {
      nameError.textContent = "Full name is required.";
      isValid = false;
    }

    if (!rollInput.value.trim()) {
      rollError.textContent = "Roll / Student ID number is required.";
      isValid = false;
    }

    const emailVal = emailInput.value.trim();
    if (!emailVal) {
      emailError.textContent = "Email is required.";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      emailError.textContent = "Please enter a valid email address.";
      isValid = false;
    }

    const pass = passwordInput.value;
    if (!pass || pass.length < 6) {
      passwordError.textContent = "Password must be at least 6 characters.";
      isValid = false;
    }

    if (pass !== confirmInput.value) {
      confirmError.textContent = "Passwords do not match.";
      isValid = false;
    }

    return isValid;
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearStatus();

      if (!validate()) {
        if (typeof gsap !== "undefined" && card) {
          gsap.fromTo(card, { x: 0 }, { x: -6, duration: 0.08, repeat: 4, yoyo: true });
        }
        return;
      }

      if (regButton) {
        regButton.classList.add("loading");
        regButton.disabled = true;
      }
      setStatus("Creating account...", "info");

      try {
        const payload = {
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          password: passwordInput.value,
          rollNumber: rollInput.value.trim(),
          semester: parseInt(semesterInput.value) || 1
        };

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Registration failed');
        }

        setStatus("Account created successfully! Loading student workspace...", "success");
        localStorage.setItem('eduguard_token', data.token);
        localStorage.setItem('eduguard_user', JSON.stringify(data.user));

        setTimeout(() => {
          window.location.href = '/student/dashboard';
        }, 800);

      } catch (err) {
        setStatus(err.message, "error");
        if (typeof gsap !== "undefined" && card) {
          gsap.fromTo(card, { x: 0 }, { x: -6, duration: 0.08, repeat: 4, yoyo: true });
        }
      } finally {
        if (regButton) {
          regButton.classList.remove("loading");
          regButton.disabled = false;
        }
      }
    });
  }
})();
