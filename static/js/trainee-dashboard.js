/*
 * SKILLPULSE — TRAINEE PORTAL CONTROLLER
 * Mobile-first controller managing learner stage timeline, learning records,
 * course discovery, applications, verifiable certificates, and employment outcomes
 */

document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  let currentDashboardData = null;
  let myEnrollmentsData = [];
  let myApplicationsData = [];

  // Escapes HTML characters to prevent XSS vulnerabilities
  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Formats raw numeric values safely for currency or count displays
  function formatINR(val) {
    if (val === null || val === undefined || isNaN(Number(val))) return '—';
    return '₹' + Number(val).toLocaleString('en-IN');
  }

  // Fetches personalized dashboard details for the logged-in learner
  async function loadTraineeDashboard() {
    try {
      const data = await SkillPulseAPI.get('/api/trainee/me/dashboard/');
      currentDashboardData = data;
      renderTraineeInterface(data);
    } catch (err) {
      console.error('Failed to load trainee portal:', err);
    }
  }

  // Populates learner cards, milestone rail, placement card, and check-in prompt
  function renderTraineeInterface(data) {
    const t = data.trainee;

    // Populate learner identity
    const nameEl = document.getElementById('trainee-name-display');
    const courseEl = document.getElementById('trainee-course-display');
    const idEl = document.getElementById('trainee-id-display');
    const completionEl = document.getElementById('trainee-completion-pct');
    const completionBar = document.getElementById('trainee-completion-bar');

    if (nameEl) nameEl.textContent = t.name;
    if (courseEl) courseEl.textContent = `${t.course} · ${t.provider}`;
    if (idEl) idEl.textContent = t.unified_id;
    if (completionEl) completionEl.textContent = `${data.completion_percentage}%`;
    if (completionBar) completionBar.style.width = `${data.completion_percentage}%`;

    // Render Stage Timeline Rail
    const railSteps = document.querySelectorAll('.trainee-stage-step');
    railSteps.forEach((stepEl, idx) => {
      if (idx <= data.current_stage_index) {
        stepEl.classList.add('active');
      } else {
        stepEl.classList.remove('active');
      }
    });

    // Render Placement Card
    const placementCard = document.getElementById('trainee-placement-card');
    const placementEmpty = document.getElementById('trainee-placement-empty');
    if (data.latest_placement) {
      if (placementCard) placementCard.style.display = 'block';
      if (placementEmpty) placementEmpty.style.display = 'none';

      const p = data.latest_placement;
      document.getElementById('placement-employer').textContent = p.employer_name;
      document.getElementById('placement-role').textContent = p.role;
      document.getElementById('placement-wage').textContent = p.wage ? `₹${Number(p.wage).toLocaleString()}/month` : 'Self-Reported Wage';
      document.getElementById('placement-status').textContent = p.validation_status.toUpperCase();
    } else {
      if (placementCard) placementCard.style.display = 'none';
      if (placementEmpty) placementEmpty.style.display = 'block';
    }

    // Render Upcoming Check-in Card
    const checkinCard = document.getElementById('trainee-checkin-card');
    const checkinPrompt = document.getElementById('trainee-checkin-prompt');
    const checkinEmpty = document.getElementById('trainee-checkin-empty');

    if (data.upcoming_follow_up) {
      if (checkinCard) checkinCard.style.display = 'block';
      if (checkinEmpty) checkinEmpty.style.display = 'none';
      if (checkinPrompt) {
        checkinPrompt.textContent = `Scheduled ${data.upcoming_follow_up.milestone.replace('_', ' ')} check-in. How has your employment progressed recently?`;
      }
    } else {
      if (checkinCard) checkinCard.style.display = 'none';
      if (checkinEmpty) checkinEmpty.style.display = 'block';
    }

    // Render Consent Status
    const consentBadge = document.getElementById('trainee-consent-badge');
    const consentBtn = document.getElementById('btn-toggle-my-consent');
    if (consentBadge) {
      if (t.consent_status === 'active') {
        consentBadge.className = 'badge badge-teal';
        consentBadge.textContent = 'Active & Protected';
        if (consentBtn) consentBtn.textContent = 'Withdraw Consent';
      } else {
        consentBadge.className = 'badge badge-neutral';
        consentBadge.textContent = 'Consent Withdrawn';
        if (consentBtn) consentBtn.textContent = 'Grant Consent';
      }
    }
  }

  // Fetches enrolled courses, certificates, and outcomes for the learner
  async function loadMyEnrollments() {
    const container = document.getElementById('trainee-enrollments-container');
    if (!container) return;

    try {
      const enrollments = await SkillPulseAPI.get('/api/trainee/me/enrollments/');
      myEnrollmentsData = enrollments;
      renderMyEnrollments(enrollments);
    } catch (err) {
      container.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--color-coral);">Failed to load learning records.</div>';
    }
  }

  // Renders course enrollment cards with progress bars, certificate downloads, and outcome triggers
  function renderMyEnrollments(enrollments) {
    const container = document.getElementById('trainee-enrollments-container');
    if (!container) return;

    if (!enrollments || enrollments.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 2.5rem 1rem; color: var(--color-text-muted);">
          <div style="font-size: 2rem; margin-bottom: 0.5rem;">📚</div>
          <strong style="display: block; font-size: 1rem; color: var(--color-deep-indigo); margin-bottom: 0.25rem;">No Active Course Enrollments</strong>
          <p style="font-size: 0.85rem; max-width: 440px; margin: 0 auto 1.25rem auto;">You are not currently enrolled in any courses. Explore the published course catalog below to apply.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = enrollments.map(e => {
      const pct = e.completion_percent || 0;
      const statusBadge = e.status === 'completed'
        ? '<span class="badge badge-teal">Completed</span>'
        : (e.status === 'dropped' ? '<span class="badge badge-coral">Dropped</span>' : '<span class="badge badge-indigo">In Progress</span>');

      // Certificate section
      let certHtml = '';
      if (e.certificate && e.certificate.status === 'issued') {
        const cert = e.certificate;
        certHtml = `
          <div style="background: rgba(14, 129, 118, 0.08); border: 1px solid rgba(14, 129, 118, 0.25); border-radius: var(--radius-md); padding: 1rem 1.25rem; margin-top: 1rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <div style="font-size: 0.75rem; text-transform: uppercase; font-weight: 700; color: var(--color-teal); letter-spacing: 0.05em;">Verifiable Digital Credential</div>
              <strong style="font-size: 0.95rem; color: var(--color-deep-indigo); font-family: var(--font-mono);">${escapeHTML(cert.certificate_number)}</strong>
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">Issued on ${cert.issued_at ? new Date(cert.issued_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Verified'}</div>
            </div>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <a href="/api/certificates/${cert.id}/download/" target="_blank" class="btn btn-primary btn-sm" style="display: flex; align-items: center; gap: 0.35rem;">
                <span>Download Certificate (PDF)</span>
              </a>
              <a href="/certificate/verify/${cert.verification_token}/" target="_blank" class="btn btn-outline btn-sm" style="display: flex; align-items: center; gap: 0.35rem;">
                <span>Public Verification</span>
              </a>
            </div>
          </div>
        `;
      }

      // Outcome section
      let outcomeHtml = '';
      if (e.outcome) {
        const out = e.outcome;
        const verifiedTag = out.verification_status === 'verified'
          ? '<span class="badge badge-teal">Verified by Trainer</span>'
          : '<span class="badge badge-neutral">Self-Reported</span>';

        outcomeHtml = `
          <div style="background: rgba(30, 39, 73, 0.04); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 0.85rem 1.15rem; margin-top: 0.75rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Recorded Employment Outcome</div>
              <div style="font-size: 0.9rem; font-weight: 700; color: var(--color-deep-indigo);">
                ${escapeHTML(out.employment_status_display || out.employment_status)}
                ${out.job_role ? ' · ' + escapeHTML(out.job_role) : ''}
                ${out.employer_name ? ' at ' + escapeHTML(out.employer_name) : ''}
              </div>
              <div style="font-size: 0.78rem; color: var(--color-text-muted);">
                ${out.monthly_earning ? 'Monthly: ' + formatINR(out.monthly_earning) + ' · ' : ''}
                ${verifiedTag}
              </div>
            </div>
            <button type="button" class="btn btn-outline btn-sm btn-open-outcome-modal" data-enrollment-id="${e.id}" data-course-title="${escapeHTML(e.course_title)}">
              Update Outcome
            </button>
          </div>
        `;
      } else if (e.status === 'completed' || pct >= 80) {
        outcomeHtml = `
          <div style="background: rgba(224, 159, 62, 0.1); border: 1px dashed var(--color-ochre); border-radius: var(--radius-md); padding: 0.85rem 1.15rem; margin-top: 0.75rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <strong style="font-size: 0.85rem; color: var(--color-deep-indigo);">Course Complete! Report Your Outcome</strong>
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">Share your employment or livelihood status to validate skilling success.</div>
            </div>
            <button type="button" class="btn btn-primary btn-sm btn-open-outcome-modal" data-enrollment-id="${e.id}" data-course-title="${escapeHTML(e.course_title)}" style="background: var(--color-ochre); border-color: var(--color-ochre);">
              Report Outcome
            </button>
          </div>
        `;
      }

      return `
        <div class="enrollment-card" style="border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1rem; background: var(--color-surface); transition: box-shadow 0.2s ease;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <span class="badge badge-neutral" style="font-family: var(--font-mono); font-size: 0.7rem;">${escapeHTML(e.course_code || 'COURSE')}</span>
                <span class="badge badge-teal" style="font-size: 0.7rem;">${escapeHTML(e.category || 'Vocational')}</span>
              </div>
              <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--color-deep-indigo); margin: 0;">${escapeHTML(e.course_title)}</h3>
              <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 0.2rem;">
                Trainer: <strong>${escapeHTML(e.trainer_name || 'Assigned Coordinator')}</strong>
              </div>
            </div>
            <div style="text-align: right;">
              ${statusBadge}
            </div>
          </div>

          <!-- Progress Bar -->
          <div style="margin: 0.85rem 0 0.5rem 0;">
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.35rem;">
              <span style="color: var(--color-text-muted);">Course Progress</span>
              <strong style="color: var(--color-teal);">${pct}%</strong>
            </div>
            <div class="progress-bar-bg" style="height: 8px;">
              <div class="progress-bar-fill" style="width: ${pct}%;"></div>
            </div>
          </div>

          ${certHtml}
          ${outcomeHtml}
        </div>
      `;
    }).join('');

    // Attach click listeners to outcome buttons
    container.querySelectorAll('.btn-open-outcome-modal').forEach(btn => {
      btn.addEventListener('click', function() {
        const enrollmentId = this.getAttribute('data-enrollment-id');
        const courseTitle = this.getAttribute('data-course-title');
        openOutcomeSurveyModal(enrollmentId, courseTitle);
      });
    });

    if (window.lucide) lucide.createIcons();
  }

  // Opens outcome modal pre-populated with existing data if present
  async function openOutcomeSurveyModal(enrollmentId, courseTitle) {
    document.getElementById('outcome-enrollment-id').value = enrollmentId;
    document.getElementById('outcome-modal-course-title').textContent = courseTitle;

    // Reset form
    document.getElementById('outcome-employment-status').value = 'employed';
    document.getElementById('outcome-employer').value = '';
    document.getElementById('outcome-role').value = '';
    document.getElementById('outcome-monthly-earning').value = '';
    document.getElementById('outcome-employment-type').value = 'full_time';
    document.getElementById('outcome-district').value = '';
    document.getElementById('outcome-state').value = '';
    document.getElementById('outcome-notes').value = '';

    // Fetch existing outcome if already submitted
    try {
      const res = await SkillPulseAPI.get(`/api/trainee/me/enrollments/${enrollmentId}/outcome/`);
      if (res && res.id) {
        document.getElementById('outcome-employment-status').value = res.employment_status || 'employed';
        document.getElementById('outcome-employer').value = res.employer_name || '';
        document.getElementById('outcome-role').value = res.job_role || '';
        document.getElementById('outcome-monthly-earning').value = res.monthly_earning || '';
        document.getElementById('outcome-employment-type').value = res.employment_type || 'full_time';
        document.getElementById('outcome-district').value = res.current_district || '';
        document.getElementById('outcome-state').value = res.current_state || '';
        document.getElementById('outcome-notes').value = res.response_notes || '';
      }
    } catch (err) {}

    SkillPulseAPI.openModal('modal-outcome-survey');
  }

  // Submits the trainee outcome survey via POST
  const formOutcome = document.getElementById('form-outcome-survey');
  if (formOutcome) {
    formOutcome.addEventListener('submit', async function(e) {
      e.preventDefault();
      const enrollmentId = document.getElementById('outcome-enrollment-id').value;
      const submitBtn = document.getElementById('btn-submit-outcome');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Submitting...';

      const payload = {
        employment_status: document.getElementById('outcome-employment-status').value,
        employer_name: document.getElementById('outcome-employer').value.trim(),
        job_role: document.getElementById('outcome-role').value.trim(),
        monthly_earning: document.getElementById('outcome-monthly-earning').value || null,
        employment_type: document.getElementById('outcome-employment-type').value,
        current_district: document.getElementById('outcome-district').value.trim(),
        current_state: document.getElementById('outcome-state').value.trim(),
        response_notes: document.getElementById('outcome-notes').value.trim()
      };

      try {
        await SkillPulseAPI.post(`/api/trainee/me/enrollments/${enrollmentId}/outcome/`, payload);
        SkillPulseAPI.showToast('Outcome recorded successfully!', 'success');
        SkillPulseAPI.closeModal('modal-outcome-survey');
        loadMyEnrollments();
        loadTraineeDashboard();
      } catch (err) {} finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // Fetches applications submitted by the logged-in trainee
  async function loadMyApplications() {
    const container = document.getElementById('trainee-applications-container');
    const badge = document.getElementById('applications-count-badge');
    if (!container) return;

    try {
      const apps = await SkillPulseAPI.get('/api/trainee/me/applications/');
      myApplicationsData = apps;
      if (badge) badge.textContent = apps.length;
      renderMyApplications(apps);
    } catch (err) {
      container.innerHTML = '<div style="color: var(--color-coral); font-size: 0.85rem;">Failed to load applications.</div>';
    }
  }

  // Renders submitted course application cards
  function renderMyApplications(apps) {
    const container = document.getElementById('trainee-applications-container');
    if (!container) return;

    if (!apps || apps.length === 0) {
      container.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--color-text-muted); font-size: 0.85rem;">No course applications submitted yet.</div>';
      return;
    }

    container.innerHTML = apps.map(a => {
      let statusBadge = '<span class="badge badge-ochre">Pending Review</span>';
      if (a.status === 'approved') statusBadge = '<span class="badge badge-teal">Approved & Enrolled</span>';
      if (a.status === 'rejected') statusBadge = '<span class="badge badge-coral">Rejected</span>';

      const submittedDate = a.submitted_at ? new Date(a.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

      return `
        <div style="padding: 10px 14px; border: 1px solid var(--color-border); border-radius: var(--radius-md); margin-bottom: 8px; background: var(--color-bg); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <strong style="font-size: 0.9rem; color: var(--color-deep-indigo);">${escapeHTML(a.course_title)}</strong>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">
              Submitted on ${submittedDate}
              ${a.review_notes ? ' · Note: ' + escapeHTML(a.review_notes) : ''}
            </div>
          </div>
          <div>${statusBadge}</div>
        </div>
      `;
    }).join('');
  }

  // Toggles visibility of the applications drawer
  const btnToggleApps = document.getElementById('btn-toggle-applications');
  if (btnToggleApps) {
    btnToggleApps.addEventListener('click', function() {
      const container = document.getElementById('trainee-applications-container');
      const label = document.getElementById('btn-toggle-apps-label');
      if (!container) return;
      const isOpen = container.style.display === 'block';
      container.style.display = isOpen ? 'none' : 'block';
      if (label) label.textContent = isOpen ? 'View Applications' : 'Hide Applications';
    });
  }

  // Fetches published courses available for learner application
  async function loadBrowseCourses() {
    const grid = document.getElementById('trainee-courses-grid');
    if (!grid) return;

    const searchInput = document.getElementById('trainee-course-search');
    const categorySelect = document.getElementById('trainee-category-filter');
    const searchVal = searchInput ? searchInput.value.trim() : '';
    const catVal = categorySelect ? categorySelect.value : '';

    try {
      const params = {};
      if (searchVal) params.search = searchVal;
      if (catVal) params.category = catVal;

      const courses = await SkillPulseAPI.get('/api/trainee/courses/', params);
      renderBrowseCourses(courses);
    } catch (err) {
      grid.innerHTML = '<div style="color: var(--color-coral); padding: 1rem; grid-column: 1/-1;">Failed to load course catalog.</div>';
    }
  }

  // Renders course cards in the discovery grid
  function renderBrowseCourses(courses) {
    const grid = document.getElementById('trainee-courses-grid');
    if (!grid) return;

    if (!courses || courses.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1/-1; padding: 2rem; text-align: center; color: var(--color-text-muted);">No published courses found matching your criteria.</div>';
      return;
    }

    const enrolledCourseIds = myEnrollmentsData.map(e => e.course);
    const pendingAppCourseIds = myApplicationsData.filter(a => a.status === 'pending').map(a => a.course);

    grid.innerHTML = courses.map(c => {
      const isEnrolled = enrolledCourseIds.includes(c.id);
      const isApplied = pendingAppCourseIds.includes(c.id);
      const isFull = c.is_full;
      const seatsLeft = Math.max(0, c.capacity - (c.enrolled_count || 0));

      let actionBtn = '';
      if (isEnrolled) {
        actionBtn = '<span class="badge badge-teal" style="padding: 6px 12px;">Enrolled</span>';
      } else if (isApplied) {
        actionBtn = '<span class="badge badge-ochre" style="padding: 6px 12px;">Applied</span>';
      } else if (isFull) {
        actionBtn = '<span class="badge badge-neutral" style="padding: 6px 12px;">Course Full</span>';
      } else {
        actionBtn = `<button type="button" class="btn btn-primary btn-sm btn-open-apply-modal" data-id="${c.id}" data-title="${escapeHTML(c.title)}">Apply Now</button>`;
      }

      return `
        <div class="course-browse-card" style="border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1.25rem; background: var(--color-surface); display: flex; flex-direction: column; justify-content: space-between; box-shadow: var(--shadow-sm); transition: transform 0.15s ease, box-shadow 0.15s ease;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; gap: 0.5rem;">
              <span class="badge badge-teal" style="font-size: 0.7rem;">${escapeHTML(c.category)}</span>
              <span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-muted);">${escapeHTML(c.course_code)}</span>
            </div>
            <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--color-deep-indigo); margin: 0.25rem 0 0.5rem 0; line-height: 1.35;">${escapeHTML(c.title)}</h4>
            <p style="font-size: 0.8rem; color: var(--color-text-secondary); line-height: 1.45; margin-bottom: 0.85rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${escapeHTML(c.description || 'Comprehensive vocational training aligned to national skill qualification standards.')}
            </p>

            <div style="font-size: 0.75rem; color: var(--color-text-muted); display: grid; grid-template-columns: 1fr 1fr; gap: 0.35rem; margin-bottom: 1rem;">
              <div>Duration: <strong>${c.duration_weeks} weeks</strong></div>
              <div>Seats: <strong>${seatsLeft} open</strong></div>
              <div>Provider: <strong>${escapeHTML(c.provider || 'Saksham')}</strong></div>
              <div>Trainer: <strong>${escapeHTML(c.trainer_name || 'Trainer')}</strong></div>
            </div>
          </div>

          <div style="border-top: 1px solid var(--color-border); padding-top: 0.75rem; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
            <button type="button" class="btn btn-outline btn-sm btn-open-course-perf" data-id="${c.id}" data-title="${escapeHTML(c.title)}" style="font-size: 0.75rem; padding: 4px 8px;">
              Outcomes Pulse
            </button>
            ${actionBtn}
          </div>
        </div>
      `;
    }).join('');

    // Attach listener to Apply buttons
    grid.querySelectorAll('.btn-open-apply-modal').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        const title = this.getAttribute('data-title');
        openApplyModal(id, title);
      });
    });

    // Attach listener to Outcomes Pulse buttons
    grid.querySelectorAll('.btn-open-course-perf').forEach(btn => {
      btn.addEventListener('click', function() {
        const id = this.getAttribute('data-id');
        const title = this.getAttribute('data-title');
        openCoursePerformanceModal(id, title);
      });
    });
  }

  // Opens course application modal
  function openApplyModal(courseId, courseTitle) {
    document.getElementById('apply-course-id').value = courseId;
    document.getElementById('apply-modal-course-title').textContent = courseTitle;
    document.getElementById('apply-motivation').value = '';
    SkillPulseAPI.openModal('modal-apply-course');
  }

  // Submits learner course application via POST
  const formApply = document.getElementById('form-apply-course');
  if (formApply) {
    formApply.addEventListener('submit', async function(e) {
      e.preventDefault();
      const courseId = document.getElementById('apply-course-id').value;
      const motivation = document.getElementById('apply-motivation').value.trim();
      const submitBtn = document.getElementById('btn-submit-application');
      const originalText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Submitting...';

      try {
        await SkillPulseAPI.post(`/api/trainee/courses/${courseId}/apply/`, { motivation: motivation });
        SkillPulseAPI.showToast('Application submitted successfully! The trainer has been notified.', 'success');
        SkillPulseAPI.closeModal('modal-apply-course');
        await loadMyApplications();
        await loadBrowseCourses();
      } catch (err) {} finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    });
  }

  // Opens modal showing course performance and transparent placement metrics
  async function openCoursePerformanceModal(courseId, courseTitle) {
    document.getElementById('performance-modal-course-title').textContent = courseTitle;
    const content = document.getElementById('performance-modal-content');
    content.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--color-text-muted);">Loading course outcomes metrics...</div>';
    SkillPulseAPI.openModal('modal-course-performance');

    try {
      const data = await SkillPulseAPI.get(`/api/courses/${courseId}/performance/`);

      let wageBlock = '';
      if (data.privacy_threshold_met && data.average_monthly_wage) {
        wageBlock = `
          <div style="background: rgba(14, 129, 118, 0.08); border: 1px solid var(--color-teal); border-radius: var(--radius-md); padding: 1.25rem; text-align: center; margin-top: 1rem;">
            <div style="font-size: 0.8rem; color: var(--color-text-muted); text-transform: uppercase;">Average Verified Monthly Earning</div>
            <strong style="font-size: 1.75rem; color: var(--color-teal); font-family: var(--font-mono);">${formatINR(data.average_monthly_wage)}</strong>
            <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.25rem;">Based on ${data.outcomes_reported} verified responses</div>
          </div>
        `;
      } else {
        wageBlock = `
          <div style="background: rgba(224, 159, 62, 0.1); border: 1px solid var(--color-ochre); border-radius: var(--radius-md); padding: 1.25rem; text-align: center; margin-top: 1rem;">
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--color-ochre); margin-bottom: 0.25rem;">🛡️ Privacy Protected</div>
            <div style="font-size: 0.8rem; color: var(--color-text-secondary);">${escapeHTML(data.wage_notice || 'Wage data hidden to protect learner privacy (< 5 responses)')}</div>
          </div>
        `;
      }

      content.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
          <div style="background: var(--color-bg); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--color-border); text-align: center;">
            <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Total Learners</div>
            <strong style="font-size: 1.5rem; color: var(--color-deep-indigo);">${data.total_enrolled}</strong>
          </div>
          <div style="background: var(--color-bg); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--color-border); text-align: center;">
            <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Completion Rate</div>
            <strong style="font-size: 1.5rem; color: var(--color-teal);">${data.completion_rate}%</strong>
          </div>
          <div style="background: var(--color-bg); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--color-border); text-align: center;">
            <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Outcomes Reported</div>
            <strong style="font-size: 1.5rem; color: var(--color-deep-indigo);">${data.outcomes_reported}</strong>
          </div>
          <div style="background: var(--color-bg); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--color-border); text-align: center;">
            <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Placement Rate</div>
            <strong style="font-size: 1.5rem; color: var(--color-teal);">${data.placement_rate !== null ? data.placement_rate + '%' : 'Pending'}</strong>
          </div>
        </div>
        ${wageBlock}
      `;
    } catch (err) {
      content.innerHTML = '<div style="color: var(--color-coral); text-align: center; padding: 1rem;">Failed to load course performance metrics.</div>';
    }
  }

  // Submits the learner's self-reported check-in status
  async function respondToCheckIn(responseChoice) {
    if (!currentDashboardData || !currentDashboardData.upcoming_follow_up) {
      SkillPulseAPI.showToast('No active check-in pending.', 'warning');
      return;
    }

    const followUpId = currentDashboardData.upcoming_follow_up.id;
    try {
      const res = await SkillPulseAPI.post(`/api/trainee/me/follow-ups/${followUpId}/respond/`, {
        response_choice: responseChoice
      });
      SkillPulseAPI.showToast(res.message || 'Check-in response saved successfully!', 'success');
      loadTraineeDashboard();
    } catch (err) {}
  }

  // Toggles learner consent status between active and withdrawn
  async function toggleConsent() {
    if (!currentDashboardData) return;
    const current = currentDashboardData.trainee.consent_status;
    const nextStatus = current === 'active' ? 'withdrawn' : 'granted';

    const confirmMsg = (nextStatus === 'withdrawn')
      ? 'Withdrawing consent will mask your contact details from outreach queues and anonymize your record in reports. Proceed?'
      : 'Grant consent to allow your training provider to assist with verified employment records?';

    if (confirm(confirmMsg)) {
      try {
        const res = await SkillPulseAPI.post('/api/trainee/me/consent/', {
          status: nextStatus
        });
        SkillPulseAPI.showToast(res.message, 'success');
        loadTraineeDashboard();
      } catch (err) {}
    }
  }

  // Generates and downloads the learner progress summary document
  async function downloadProgressReport() {
    try {
      const res = await SkillPulseAPI.get('/api/trainee/me/progress-report/');
      const rep = res.report;

      // Generate formatted printable HTML report window
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>SkillPulse Progress Report — ${rep.learner_name}</title>
          <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px; color: #1E2749; line-height: 1.6; }
            .header { border-bottom: 3px solid #0E8176; padding-bottom: 15px; margin-bottom: 25px; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; background: #E0F2F1; color: #0E8176; font-weight: bold; }
            .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E2E8F0; }
            .footer { margin-top: 40px; font-size: 0.85rem; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>SKILLPULSE — LEARNER PROGRESS REPORT</h2>
            <p>Unified ID: <strong>${rep.unified_id}</strong> | Generated: ${rep.generated_at}</p>
          </div>
          <div class="row"><span>Learner Name:</span><strong>${rep.learner_name}</strong></div>
          <div class="row"><span>Vocational Course:</span><strong>${rep.course}</strong></div>
          <div class="row"><span>Training Provider:</span><strong>${rep.provider}</strong></div>
          <div class="row"><span>District & State:</span><strong>${rep.location}</strong></div>
          <div class="row"><span>Current Outcome Stage:</span><span class="badge">${rep.current_stage}</span></div>
          <div class="row"><span>Consent Status:</span><strong>${rep.consent_status}</strong></div>
          <div class="row"><span>Recorded Placements:</span><strong>${rep.placements_count}</strong></div>
          <div class="footer">
            <p>${rep.program_verification}</p>
            <p>Consent-aware by design · No raw Aadhaar stored</p>
          </div>
          <script>window.print();</script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (err) {}
  }

  // Debounces input event execution for search filter performance
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // Setup click listeners for check-in action buttons and search controls
  function setupTraineeListeners() {
    const btnWork = document.getElementById('btn-trainee-working');
    if (btnWork) btnWork.addEventListener('click', () => respondToCheckIn('working'));

    const btnBusiness = document.getElementById('btn-trainee-business');
    if (btnBusiness) btnBusiness.addEventListener('click', () => respondToCheckIn('own_work'));

    const btnSupport = document.getElementById('btn-trainee-support');
    if (btnSupport) btnSupport.addEventListener('click', () => respondToCheckIn('need_help'));

    const btnConsent = document.getElementById('btn-toggle-my-consent');
    if (btnConsent) btnConsent.addEventListener('click', toggleConsent);

    const btnReport = document.getElementById('btn-trainee-download-report');
    if (btnReport) btnReport.addEventListener('click', downloadProgressReport);

    const searchInput = document.getElementById('trainee-course-search');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(loadBrowseCourses, 350));
    }

    const catSelect = document.getElementById('trainee-category-filter');
    if (catSelect) {
      catSelect.addEventListener('change', loadBrowseCourses);
    }
  }

  setupTraineeListeners();
  loadTraineeDashboard();
  loadMyEnrollments().then(() => {
    loadMyApplications().then(() => {
      loadBrowseCourses();
    });
  });
});
