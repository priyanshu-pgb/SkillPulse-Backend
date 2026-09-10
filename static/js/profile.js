/*
 * SKILLPULSE — EDITABLE PROFILE CONTROLLER
 * Manages user profile fields updating, profile avatar upload, password change,
 * and loading of enrolled or instructed vocational courses
 */

document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  // Escapes HTML content to prevent XSS injection
  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Loads authenticated user profile into the editor form and triggers course listing
  async function loadUserProfile() {
    let u = null;
    try {
      const res = await SkillPulseAPI.get('/api/profile/');
      if (res && res.user) u = res.user;
    } catch (err) {}

    if (!u) {
      u = (window.SkillPulseMockAuth && window.SkillPulseMockAuth.getSession()) ||
          (window.SkillPulseCache && window.SkillPulseCache.get('user_session')) || {};
    }

    const nameInput = document.getElementById('profile-name');
    const emailInput = document.getElementById('profile-email');
    const phoneInput = document.getElementById('profile-phone');
    const idInput = document.getElementById('profile-id');
    const langInput = document.getElementById('profile-language');
    const providerInput = document.getElementById('profile-provider');
    const districtInput = document.getElementById('profile-district');
    const stateInput = document.getElementById('profile-state');
    const addressInput = document.getElementById('profile-address');
    const bioInput = document.getElementById('profile-bio');
    const avatarImg = document.getElementById('profile-avatar-preview');

    if (nameInput) nameInput.value = u.full_name || u.aadhaar_name || '';
    if (emailInput) emailInput.value = u.email || '';
    if (phoneInput) phoneInput.value = u.phone_number || '';
    if (idInput) idInput.value = u.field_atlas_id || '';
    if (langInput) langInput.value = u.preferred_language || 'en';
    if (providerInput) providerInput.value = u.provider || '';
    if (districtInput) districtInput.value = u.district || '';
    if (stateInput) stateInput.value = u.state || '';
    if (addressInput) addressInput.value = u.address || '';
    if (bioInput) bioInput.value = u.bio || '';

    const photoUrl = u.profile_picture || u.profile_photo_url;
    if (avatarImg && photoUrl) {
      avatarImg.src = photoUrl;
    }

    // Update left card labels
    const displayNameEl = document.getElementById('user-display-name');
    if (displayNameEl) displayNameEl.textContent = u.full_name || u.aadhaar_name || 'Citizen User';

    const displayRoleEl = document.getElementById('user-display-role');
    if (displayRoleEl) displayRoleEl.textContent = u.role === 'trainer' ? 'Vocational Instructor / Trainer' : 'Registered Skilling Trainee';

    const displayIdEl = document.getElementById('display-atlas-id');
    if (displayIdEl) displayIdEl.textContent = u.field_atlas_id || 'FA-26-0000';

    // Also update sidebar avatar if present
    const sidebarAvatar = document.getElementById('sidebar-avatar');
    if (sidebarAvatar) {
      if (photoUrl) {
        sidebarAvatar.innerHTML = `<img src="${photoUrl}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" alt="Avatar">`;
      } else if (u.full_name) {
        const initials = u.full_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        sidebarAvatar.textContent = initials;
      }
    }
    const sidebarName = document.getElementById('sidebar-user-name');
    if (sidebarName && u.full_name) {
      sidebarName.textContent = u.full_name;
    }

    if (u.role) {
      loadProfileCourses(u.role);
    }
  }

  // Fetches and displays enrolled or instructed courses based on user role
  async function loadProfileCourses(role) {
    const container = document.getElementById('profile-courses-container');
    if (!container) return;

    try {
      if (role === 'trainee') {
        const enrollments = await SkillPulseAPI.get('/api/trainee/me/enrollments/');
        if (!enrollments || enrollments.length === 0) {
          container.innerHTML = '<div style="color: var(--color-text-muted); font-size: 0.85rem; text-align: center; padding: 1rem;">No course enrollments on record.</div>';
          return;
        }

        container.innerHTML = enrollments.map(e => {
          const certBadge = e.certificate && e.certificate.status === 'issued'
            ? `<a href="/api/certificates/${e.certificate.id}/download/" target="_blank" class="btn btn-outline btn-sm" style="font-size: 0.75rem; padding: 3px 8px;">Download Certificate</a>`
            : '';

          return `
            <div style="padding: 10px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-md); margin-bottom: 8px; background: var(--color-bg); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <strong style="font-size: 0.95rem; color: var(--color-deep-indigo);">${escapeHTML(e.course_title)}</strong>
                <div style="font-size: 0.75rem; color: var(--color-text-muted);">
                  ${escapeHTML(e.category || 'Vocational')} · Progress: ${e.completion_percent}% · Status: ${e.status}
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                ${certBadge}
                <span class="badge ${e.status === 'completed' ? 'badge-teal' : 'badge-indigo'}">${e.status.toUpperCase()}</span>
              </div>
            </div>
          `;
        }).join('');
      } else {
        const courses = await SkillPulseAPI.get('/api/courses/');
        if (!courses || courses.length === 0) {
          container.innerHTML = '<div style="color: var(--color-text-muted); font-size: 0.85rem; text-align: center; padding: 1rem;">No courses created under this instructor account.</div>';
          return;
        }

        container.innerHTML = courses.map(c => {
          return `
            <div style="padding: 10px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-md); margin-bottom: 8px; background: var(--color-bg); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <strong style="font-size: 0.95rem; color: var(--color-deep-indigo);">${escapeHTML(c.title)}</strong>
                <div style="font-size: 0.75rem; color: var(--color-text-muted);">
                  Code: ${escapeHTML(c.course_code)} · ${c.enrolled_count}/${c.capacity} enrolled · ${c.duration_weeks} weeks
                </div>
              </div>
              <div>
                <span class="badge ${c.status === 'published' ? 'badge-teal' : (c.status === 'closed' ? 'badge-coral' : 'badge-neutral')}">${c.status.toUpperCase()}</span>
              </div>
            </div>
          `;
        }).join('');
      }
    } catch (err) {
      container.innerHTML = '<div style="color: var(--color-coral); font-size: 0.85rem;">Failed to load course records.</div>';
    }
  }

  // Handles updating profile fields via PATCH /api/profile/
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const submitBtn = profileForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Saving...';

      const payload = {
        full_name: document.getElementById('profile-name').value.trim(),
        phone_number: document.getElementById('profile-phone').value.trim(),
        preferred_language: document.getElementById('profile-language').value,
        district: document.getElementById('profile-district').value.trim(),
        state: document.getElementById('profile-state').value.trim(),
        address: document.getElementById('profile-address').value.trim(),
      };

      const bioEl = document.getElementById('profile-bio');
      if (bioEl) payload.bio = bioEl.value.trim();

      const providerEl = document.getElementById('profile-provider');
      if (providerEl && !providerEl.disabled) payload.provider = providerEl.value.trim();

      // Immediately synchronize into compulsory session cache
      if (window.SkillPulseMockAuth) {
        const s = window.SkillPulseMockAuth.getSession() || {};
        Object.assign(s, payload);
        window.SkillPulseMockAuth.saveSession(s);
      }
      if (window.SkillPulseCache) {
        const s = window.SkillPulseCache.get('user_session') || {};
        Object.assign(s, payload);
        window.SkillPulseCache.set('user_session', s);
      }

      // Update sidebar name immediately
      const sidebarName = document.getElementById('sidebar-user-name');
      if (sidebarName && payload.full_name) {
        sidebarName.textContent = payload.full_name;
      }

      try {
        const res = await SkillPulseAPI.patch('/api/profile/', payload);
        SkillPulseAPI.showToast(res.message || 'Profile updated successfully!', 'success');

        // Apply updated language if changed
        if (payload.preferred_language && window.SkillPulseI18N) {
          SkillPulseI18N.setLanguage(payload.preferred_language, false);
        }
      } catch (err) {
        SkillPulseAPI.showToast('Profile saved locally in session cache.', 'success');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // Handles profile photo selection and asynchronous upload with instant local preview
  const photoInput = document.getElementById('profile-photo-input');
  if (photoInput) {
    photoInput.addEventListener('change', function() {
      if (!photoInput.files || photoInput.files.length === 0) return;

      const file = photoInput.files[0];
      const reader = new FileReader();

      reader.onload = async function(e) {
        const photoDataUrl = e.target.result;

        // 1. Instantly update UI avatar preview
        const avatarImg = document.getElementById('profile-avatar-preview');
        if (avatarImg) {
          avatarImg.src = photoDataUrl;
        }

        // 2. Instantly update sidebar avatar in DOM
        const sidebarAvatar = document.getElementById('sidebar-avatar');
        if (sidebarAvatar) {
          sidebarAvatar.innerHTML = `<img src="${photoDataUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" alt="Avatar">`;
        }

        // 3. Immediately update compulsory session cache memory
        if (window.SkillPulseMockAuth) {
          const s = window.SkillPulseMockAuth.getSession() || {};
          s.profile_picture = photoDataUrl;
          s.profile_photo_url = photoDataUrl;
          window.SkillPulseMockAuth.saveSession(s);
        }
        if (window.SkillPulseCache) {
          const s = window.SkillPulseCache.get('user_session') || {};
          s.profile_picture = photoDataUrl;
          s.profile_photo_url = photoDataUrl;
          window.SkillPulseCache.set('user_session', s);
        }

        SkillPulseAPI.showToast('Profile photo updated successfully!', 'success');

        // 4. Asynchronously push to backend
        try {
          const formData = new FormData();
          formData.append('profile_photo', file);
          await SkillPulseAPI.post('/api/profile/photo/', formData, { silent: true });
        } catch (backendErr) {
          // Offline / mock mode — preserved in memory session cache
        }
      };

      reader.readAsDataURL(file);
    });
  }

  // Handles changing account password securely
  const passwordForm = document.getElementById('change-password-form');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const currentPassword = document.getElementById('current-password').value;
      const newPassword = document.getElementById('new-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      if (newPassword !== confirmPassword) {
        SkillPulseAPI.showToast('New passwords do not match.', 'error');
        return;
      }

      try {
        const res = await SkillPulseAPI.post('/api/auth/change-password/', {
          current_password: currentPassword,
          new_password: newPassword
        });
        SkillPulseAPI.showToast(res.message || 'Password changed successfully!', 'success');
        passwordForm.reset();
      } catch (err) {}
    });
  }

  loadUserProfile();
});
