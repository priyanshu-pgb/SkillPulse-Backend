/*
 * SKILLPULSE — AUTHENTICATION & OTP CONTROLLER
 * Handles user login, registration, email OTP dispatch & verification, password reset, and logout
 */

document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  // Handles credential submission on the login page
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Signing in...';

      const identifier = document.getElementById('login-identifier').value.trim();
      const password = document.getElementById('login-password').value;
      const rememberMe = document.getElementById('login-remember') ? document.getElementById('login-remember').checked : false;

      try {
        const response = await SkillPulseAPI.post('/api/auth/login/', {
          identifier: identifier,
          password: password,
          remember_me: rememberMe
        });

        // Store into compulsory session memory cache
        if (window.SkillPulseCache) {
          SkillPulseCache.set('user_session', response);
        }

        SkillPulseAPI.showToast('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = response.redirect_url || '/';
        }, 600);
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // Auto-format Aadhaar Card Number input (XXXX XXXX XXXX)
  const aadhaarInput = document.getElementById('reg-aadhaar');
  if (aadhaarInput) {
    aadhaarInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '').substring(0, 12);
      let formatted = '';
      for (let i = 0; i < value.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += ' ';
        formatted += value[i];
      }
      e.target.value = formatted;
    });
  }

  // Auto-format Indian Mobile Number (10 digits)
  const mobileInput = document.getElementById('reg-phone');
  if (mobileInput) {
    mobileInput.addEventListener('input', function(e) {
      e.target.value = e.target.value.replace(/\D/g, '').substring(0, 10);
    });
  }

  // Handles account creation and role registration with Aadhaar
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Creating Account...';

      const aadhaarNameInput = document.getElementById('reg-fullname') || document.getElementById('reg-aadhaar-name');
      const fullName = aadhaarNameInput ? aadhaarNameInput.value.trim() : '';

      const aadhaarEl = document.getElementById('reg-aadhaar');
      const rawAadhaar = aadhaarEl ? aadhaarEl.value.replace(/\s+/g, '').trim() : '';

      const phoneEl = document.getElementById('reg-phone') || document.getElementById('reg-mobile');
      const rawPhone = phoneEl ? phoneEl.value.replace(/\D/g, '').trim() : '';

      const password = document.getElementById('reg-password').value;
      const role = document.getElementById('reg-role').value;
      const provider = document.getElementById('reg-provider') ? document.getElementById('reg-provider').value.trim() : '';
      const district = document.getElementById('reg-district') ? document.getElementById('reg-district').value.trim() : '';
      const otpCode = document.getElementById('reg-otp') ? document.getElementById('reg-otp').value.trim() : '';

      if (rawAadhaar && rawAadhaar.length !== 12) {
        SkillPulseAPI.showToast('Please enter a valid 12-digit Aadhaar Card Number.', 'warning');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        return;
      }

      if (rawPhone && rawPhone.length < 10) {
        SkillPulseAPI.showToast('Please enter a valid 10-digit registered Aadhaar mobile number.', 'warning');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
        return;
      }

      try {
        const response = await SkillPulseAPI.post('/api/auth/register/', {
          full_name: fullName,
          aadhaar_name: fullName,
          aadhaar_number: rawAadhaar,
          phone_number: rawPhone,
          mobile_number: rawPhone,
          password: password,
          role: role,
          provider: provider,
          district: district,
          otp_code: otpCode
        });

        // Store into compulsory session memory cache
        if (window.SkillPulseCache) {
          SkillPulseCache.set('user_session', response);
        }

        SkillPulseAPI.showToast('Account registered successfully with Aadhaar! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = response.redirect_url || '/';
        }, 600);
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // Sends an email OTP from the registration or verification page
  const sendOtpBtn = document.getElementById('btn-send-otp');
  if (sendOtpBtn) {
    sendOtpBtn.addEventListener('click', async function() {
      const emailInput = document.getElementById('reg-email') || document.getElementById('otp-email');
      if (!emailInput || !emailInput.value) {
        SkillPulseAPI.showToast('Please enter your email address first.', 'warning');
        return;
      }

      const email = emailInput.value.trim();
      sendOtpBtn.disabled = true;
      sendOtpBtn.textContent = 'Sending...';

      try {
        const purpose = sendOtpBtn.getAttribute('data-purpose') || 'registration';
        const res = await SkillPulseAPI.post('/api/auth/send-otp/', { email: email, purpose: purpose });
        SkillPulseAPI.showToast(res.message || 'Verification code dispatched to your email!', 'success');

        // Start 60-second cooldown timer
        let countdown = 60;
        const interval = setInterval(() => {
          countdown -= 1;
          sendOtpBtn.textContent = `Resend in ${countdown}s`;
          if (countdown <= 0) {
            clearInterval(interval);
            sendOtpBtn.disabled = false;
            sendOtpBtn.textContent = 'Resend Code';
          }
        }, 1000);
      } catch (err) {
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = 'Send Code';
      }
    });
  }

  // Handles standalone 6-digit OTP verification page
  const verifyOtpForm = document.getElementById('verify-otp-form');
  if (verifyOtpForm) {
    verifyOtpForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const email = document.getElementById('otp-email').value.trim();
      const code = document.getElementById('otp-code').value.trim();

      try {
        await SkillPulseAPI.post('/api/auth/verify-otp/', { email: email, code: code });
        SkillPulseAPI.showToast('Verification successful! You may now sign in.', 'success');
        setTimeout(() => {
          window.location.href = '/login/';
        }, 800);
      } catch (err) {}
    });
  }

  // Handles password reset submission with email OTP
  const forgotPasswordForm = document.getElementById('forgot-password-form');
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const email = document.getElementById('reset-email').value.trim();
      const code = document.getElementById('reset-code').value.trim();
      const newPassword = document.getElementById('reset-new-password').value;

      try {
        const res = await SkillPulseAPI.post('/api/auth/password-reset/', {
          email: email,
          code: code,
          new_password: newPassword
        });
        SkillPulseAPI.showToast(res.message || 'Password reset successful! Please log in.', 'success');
        setTimeout(() => {
          window.location.href = '/login/';
        }, 1000);
      } catch (err) {}
    });
  }

  // Handles universal logout action
  document.querySelectorAll('.btn-logout').forEach(btn => {
    btn.addEventListener('click', async function(e) {
      e.preventDefault();
      try {
        await SkillPulseAPI.post('/api/auth/logout/');
        SkillPulseAPI.showToast('Signed out successfully.', 'success');
        setTimeout(() => {
          window.location.href = '/login/';
        }, 400);
      } catch (err) {
        window.location.href = '/login/';
      }
    });
  });
});
