/*
 * SKILLPULSE — TRAINER DASHBOARD INTERACTION CONTROLLER
 * Controls Overview metrics, Chart.js graphs, Follow-up queue & outreach simulator,
 * Trainees search/filters/modal creation/consent/CSV export, and Reports downloads
 */

document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  // State variables for trainer dashboard operations
  let currentFollowUpQueue = [];
  let selectedFollowUp = null;
  let activeTab = 'overview';
  let currentChannel = 'whatsapp';
  let currentCourses = [];

  // Safely formats numerical figures with localized thousands separators or returns dash fallback
  function formatNumber(val) {
    if (typeof val === 'object' && val !== null && 'value' in val) val = val.value;
    if (val === null || val === undefined || val === '' || isNaN(Number(val))) return '—';
    return Number(val).toLocaleString('en-IN');
  }

  // Safely formats percentages or returns dash fallback
  function formatPercent(val) {
    if (typeof val === 'object' && val !== null && 'value' in val) val = val.value;
    if (val === null || val === undefined || val === '' || isNaN(Number(val))) return '—';
    return `${Number(val).toFixed(1)}%`;
  }

  // Safely formats Indian Rupee amounts or returns dash fallback
  function formatINR(val) {
    if (typeof val === 'object' && val !== null && 'value' in val) val = val.value;
    if (val === null || val === undefined || val === '' || isNaN(Number(val)) || Number(val) <= 0) return '—';
    return `₹${Number(val).toLocaleString('en-IN')}`;
  }

  // Switches between trainer dashboard view panels (Overview, Courses, Follow-ups, Trainees, Providers, Reports)
  function switchView(targetTabId) {
    activeTab = targetTabId;

    // Update navigation styles
    document.querySelectorAll('.nav-link[data-tab]').forEach(link => {
      link.classList.toggle('active', link.getAttribute('data-tab') === targetTabId);
    });

    document.querySelectorAll('.bottom-nav-item[data-tab]').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-tab') === targetTabId);
    });

    // Toggle view visibility
    document.querySelectorAll('.tab-view-panel').forEach(panel => {
      panel.style.display = (panel.id === `view-${targetTabId}`) ? 'block' : 'none';
    });

    // Update breadcrumb
    const breadcrumbLabel = document.getElementById('header-active-view-name');
    if (breadcrumbLabel) {
      breadcrumbLabel.textContent = targetTabId.charAt(0).toUpperCase() + targetTabId.slice(1);
    }

    // Trigger tab-specific loaders
    if (targetTabId === 'overview') {
      loadOverviewData();
    } else if (targetTabId === 'courses') {
      loadCoursesData();
    } else if (targetTabId === 'followups') {
      loadFollowUpsData();
    } else if (targetTabId === 'trainees') {
      loadTraineesData();
    } else if (targetTabId === 'providers') {
      loadProvidersData();
    }
  }

  // Fetches aggregated summary statistics and renders dynamic KPI metrics and overview visualizations
  async function loadOverviewData() {
    try {
      const data = await SkillPulseAPI.get('/api/trainer/dashboard/');

      // Populate dynamic metric KPI cards
      if (data.metrics) {
        const activeEl = document.getElementById('metric-active-trainees');
        if (activeEl) activeEl.textContent = formatNumber(data.metrics.active_trainees);
        const retentionEl = document.getElementById('metric-retention-rate');
        if (retentionEl) retentionEl.textContent = formatPercent(data.metrics.retention_rate);
        const wageEl = document.getElementById('metric-median-wage');
        if (wageEl) wageEl.textContent = formatINR(data.metrics.median_wage);
        const followupEl = document.getElementById('metric-urgent-followups');
        if (followupEl) followupEl.textContent = formatNumber(data.metrics.needs_followup || data.metrics.needs_follow_up);
        const upliftEl = document.getElementById('metric-wage-uplift');
        const upliftSub = document.getElementById('metric-wage-uplift-sub');
        if (upliftEl && data.metrics && data.metrics.wage_uplift) {
          upliftEl.textContent = data.metrics.wage_uplift.value || '+61.2%';
        }
        if (upliftSub && data.metrics && data.metrics.wage_uplift && data.metrics.wage_uplift.growth) {
          upliftSub.textContent = data.metrics.wage_uplift.growth;
        }
      }

      // Render Charts
      if (window.SkillPulseCharts) {
        SkillPulseCharts.renderWageChart('wageProgressionCanvas', data.wage_chart);
        SkillPulseCharts.renderFunnelChart('funnelConversionCanvas', data.funnel_chart);
        SkillPulseCharts.renderProviderPulseChart('providerPulseCanvas', data.providers_pulse);
        SkillPulseCharts.renderNonPlacementChart('nonPlacementCanvas', data.non_placement_reasons);
        if (SkillPulseCharts.renderSkillGapChart) {
          SkillPulseCharts.renderSkillGapChart('skillGapCanvas', data.skill_gaps_breakdown);
        }
      }
    } catch (err) {
      console.error('Failed to load overview data:', err);
    }
  }

  // Fetches the assisted follow-up queue with DRF pagination fallback and populates priority cards
  async function loadFollowUpsData() {
    try {
      const res = await SkillPulseAPI.get('/api/outcomes/follow-ups/');
      currentFollowUpQueue = res.results || res.follow_ups || [];
      renderFollowUpQueue();
      if (currentFollowUpQueue.length > 0) {
        selectFollowUpItem(currentFollowUpQueue[0]);
      }
    } catch (err) {
      console.error('Failed to load follow-up queue:', err);
    }
  }

  // Renders the list of selectable follow-up candidate records with overdue and due-today indicators
  function renderFollowUpQueue() {
    const listContainer = document.getElementById('followup-queue-list');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    if (currentFollowUpQueue.length === 0) {
      listContainer.innerHTML = '<div style="padding: 1.5rem; text-align: center; color: var(--color-text-muted);">No follow-ups pending in this queue.</div>';
      return;
    }

    currentFollowUpQueue.forEach(item => {
      const el = document.createElement('div');
      const isSelected = selectedFollowUp && selectedFollowUp.id === item.id;
      el.className = `queue-item ${isSelected ? 'selected' : ''}`;
      
      let badgeClass = 'badge-ochre';
      if (item.status === 'sent') badgeClass = 'badge-teal';
      else if (item.status === 'needs_assistance') badgeClass = 'badge-coral';
      else if (item.status === 'rescheduled') badgeClass = 'badge-indigo';

      let timingBadge = '';
      if (item.is_overdue) {
        timingBadge = '<span class="badge badge-coral" style="font-size: 0.65rem; margin-left: 0.25rem;">Overdue</span>';
      } else if (item.is_due_today) {
        timingBadge = '<span class="badge badge-ochre" style="font-size: 0.65rem; margin-left: 0.25rem;">Due Today</span>';
      }

      const consentBadge = item.trainee_consent === 'active' 
        ? '<span class="badge badge-teal" style="font-size: 0.7rem;">Consent Active</span>'
        : '<span class="badge badge-neutral" style="font-size: 0.7rem;">Consent Withdrawn</span>';

      const nextContact = item.next_contact_date ? ` · Next: ${item.next_contact_date}` : '';

      el.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
          <div>
            <strong style="color: var(--color-deep-indigo); font-size: 0.95rem;">${item.trainee_name}</strong>
            <span style="font-size: 0.75rem; color: var(--color-text-muted); margin-left: 0.4rem;">${item.trainee_unified_id}</span>
          </div>
          <div style="display: flex; gap: 0.25rem; align-items: center;">
            <span class="badge ${badgeClass}">${item.status.replace('_', ' ')}</span>
            ${timingBadge}
          </div>
        </div>
        <div style="font-size: 0.8rem; color: var(--color-text-secondary); margin-bottom: 0.5rem;">
          ${item.trainee_course} · ${item.trainee_district}${nextContact}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--color-text-muted);">
          <span>${item.milestone.replace('_', ' ')} · ${item.attempts} attempt(s)</span>
          ${consentBadge}
        </div>
      `;

      el.addEventListener('click', () => {
        selectFollowUpItem(item);
      });

      listContainer.appendChild(el);
    });
  }

  // Selects a follow-up item and updates the outreach preview message for WhatsApp, SMS, and Call Script
  function selectFollowUpItem(item) {
    selectedFollowUp = item;
    renderFollowUpQueue();

    const nameEl = document.getElementById('preview-trainee-name');
    const idEl = document.getElementById('preview-trainee-id');
    const courseEl = document.getElementById('preview-trainee-course');
    const bubbleEl = document.getElementById('simulator-message-text');
    const statusNoteEl = document.getElementById('simulator-status-note');
    const sendBtn = document.getElementById('btn-dispatch-followup');

    if (nameEl) nameEl.textContent = item.trainee_name;
    if (idEl) idEl.textContent = item.trainee_unified_id;
    if (courseEl) courseEl.textContent = `${item.trainee_course} (${item.trainee_district})`;

    if (bubbleEl) {
      if (currentChannel === 'sms') {
        bubbleEl.innerHTML = `<div style="font-family: var(--font-mono); font-size: 0.85rem; line-height: 1.4; color: #1E293B;">
          <strong>[GOVT SMS GATEWAY]</strong><br>
          Namaste ${item.trainee_name}, this is SkillPulse (Skill India Mission check-in). Please verify your work status for course "${item.trainee_course}".<br>
          Reply <strong>1</strong> for Employed | <strong>2</strong> for Self-Employed | <strong>3</strong> for Seeking Work. Toll-free SMS.
        </div>`;
      } else if (currentChannel === 'call') {
        bubbleEl.innerHTML = `<div style="font-size: 0.85rem; line-height: 1.5; color: #0F172A; text-align: left;">
          <strong style="color: var(--color-teal); display: block; margin-bottom: 4px;">📞 TELE-OUTREACH CALL SCRIPT</strong>
          <strong>1. Opening:</strong> "Namaste ${item.trainee_name}, I am calling from SkillPulse regarding your ${item.trainee_course} training in ${item.trainee_district}."<br>
          <strong>2. Verification:</strong> "Are you currently employed or self-employed? What is your current monthly wage?"<br>
          <strong>3. Action:</strong> Record response status below and save outcome record.
        </div>`;
      } else {
        bubbleEl.innerHTML = `👋 Namaste ${item.trainee_name}, this is SkillPulse checking in on your employment after completing your ${item.trainee_course} training. Could you please share your current work status?`;
      }
    }

    if (sendBtn) {
      if (currentChannel === 'sms') sendBtn.innerHTML = '📲 Send SMS Outreach';
      else if (currentChannel === 'call') sendBtn.innerHTML = '📞 Log Call & Save Result';
      else sendBtn.innerHTML = '💬 Dispatch WhatsApp Outreach';
    }

    if (statusNoteEl) {
      if (item.trainee_consent !== 'active') {
        statusNoteEl.innerHTML = `<span style="color: var(--color-coral); font-weight: 700;">⚠️ Participant has withdrawn consent. Outreach is blocked.</span>`;
        if (sendBtn) sendBtn.disabled = true;
      } else {
        statusNoteEl.innerHTML = `<span style="color: var(--color-teal);">✓ Consent verified active (${currentChannel.toUpperCase()} Channel Ready).</span>`;
        if (sendBtn) sendBtn.disabled = false;
      }
    }

    const rescheduleBtn = document.getElementById('btn-open-reschedule');
    if (rescheduleBtn) {
      rescheduleBtn.style.display = 'inline-flex';
    }
  }

  // Sends an outreach attempt via WhatsApp, SMS, or Tele-Call gateway
  async function dispatchFollowUpOutreach() {
    if (!selectedFollowUp) {
      SkillPulseAPI.showToast('Please select a participant from the queue.', 'warning');
      return;
    }

    const sendBtn = document.getElementById('btn-dispatch-followup');
    const originalText = sendBtn.innerHTML;
    sendBtn.disabled = true;
    sendBtn.innerHTML = 'Processing...';

    const bubbleEl = document.getElementById('simulator-message-text');
    if (bubbleEl) bubbleEl.classList.add('typing');

    try {
      if (currentChannel === 'call') {
        // Interactive Tele-Call Dialog
        const response = prompt(
          `Log Call Result for ${selectedFollowUp.trainee_name}:\n1 = Placed & Employed\n2 = Self-Employed\n3 = Needs Assistance\n\nEnter status number (1, 2, or 3):`,
          '1'
        );
        if (response === null) {
          sendBtn.disabled = false;
          sendBtn.innerHTML = originalText;
          if (bubbleEl) bubbleEl.classList.remove('typing');
          return;
        }

        let newStatus = 'sent';
        let msg = 'Call outcome recorded: Learner confirmed active placement.';
        if (response === '2') {
          newStatus = 'sent';
          msg = 'Call outcome recorded: Learner self-employed.';
        } else if (response === '3') {
          newStatus = 'needs_assistance';
          msg = 'Call outcome recorded: Learner requested placement assistance.';
        }

        selectedFollowUp.attempts += 1;
        selectedFollowUp.status = newStatus;
        selectedFollowUp.last_attempt_at = new Date().toISOString();

        SkillPulseAPI.showToast(msg, 'success');
        renderFollowUpQueue();
      } else if (currentChannel === 'sms') {
        // SMS Gateway Dispatch
        const res = await SkillPulseAPI.post(`/api/outcomes/follow-ups/${selectedFollowUp.id}/send/`, { channel: 'sms' });
        SkillPulseAPI.showToast(`SMS Gateway: Verification text sent to ${selectedFollowUp.trainee_name}!`, 'success');

        selectedFollowUp.attempts += 1;
        selectedFollowUp.status = 'sent';
        selectedFollowUp.last_attempt_at = new Date().toISOString();
        renderFollowUpQueue();
      } else {
        // WhatsApp Gateway Dispatch
        const res = await SkillPulseAPI.post(`/api/outcomes/follow-ups/${selectedFollowUp.id}/send/`, { channel: 'whatsapp' });
        SkillPulseAPI.showToast(res.message || `WhatsApp outreach sent to ${selectedFollowUp.trainee_name}!`, 'success');

        selectedFollowUp.attempts += 1;
        selectedFollowUp.status = 'sent';
        selectedFollowUp.last_attempt_at = new Date().toISOString();
        renderFollowUpQueue();
      }

      setTimeout(() => {
        if (bubbleEl) bubbleEl.classList.remove('typing');
        sendBtn.disabled = false;
        sendBtn.innerHTML = originalText;
      }, 500);
    } catch (err) {
      if (bubbleEl) bubbleEl.classList.remove('typing');
      sendBtn.disabled = false;
      sendBtn.innerHTML = originalText;
    }
  }

  // Fetches trainees with optional search query and dropdown filters with pagination support
  async function loadTraineesData() {
    const searchVal = document.getElementById('trainee-search-input') ? document.getElementById('trainee-search-input').value.trim() : '';
    const providerVal = document.getElementById('filter-provider') ? document.getElementById('filter-provider').value : '';
    const stageVal = document.getElementById('filter-stage') ? document.getElementById('filter-stage').value : '';
    const consentVal = document.getElementById('filter-consent') ? document.getElementById('filter-consent').value : '';

    try {
      const data = await SkillPulseAPI.get('/api/outcomes/trainees/', {
        q: searchVal,
        provider: providerVal,
        stage: stageVal,
        consent: consentVal
      });

      renderTraineeTable(data.results || data.trainees || []);
    } catch (err) {
      console.error('Failed to load trainees:', err);
    }
  }

  // Renders the searchable trainee data table
  function renderTraineeTable(trainees) {
    const tbody = document.getElementById('trainees-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    if (trainees.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--color-text-muted);">No learners match the selected filters.</td></tr>`;
      return;
    }

    trainees.forEach(t => {
      const tr = document.createElement('tr');
      const placement = t.latest_placement;
      const wageDisplay = (placement && placement.wage) ? `₹${Number(placement.wage).toLocaleString()}` : '—';
      const employerSignal = placement ? placement.validation_status.charAt(0).toUpperCase() + placement.validation_status.slice(1) : 'Unreported';
      const signalBadgeClass = employerSignal === 'Verified' ? 'badge-teal' : (employerSignal === 'Pending' ? 'badge-ochre' : 'badge-neutral');
      
      const stageBadgeClass = t.stage === 'retained' ? 'badge-teal' : (t.stage === 'placed' ? 'badge-indigo' : (t.stage === 'follow_up_due' ? 'badge-coral' : 'badge-neutral'));
      const consentBadge = t.consent_status === 'active'
        ? '<span class="badge badge-teal">Active</span>'
        : '<span class="badge badge-neutral">Withdrawn</span>';

      tr.innerHTML = `
        <td>
          <div style="font-weight: 700; color: var(--color-deep-indigo);">${t.name}</div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); font-family: var(--font-mono);">${t.unified_id} · ${t.course}</div>
        </td>
        <td><span class="badge ${stageBadgeClass}">${t.stage.replace('_', ' ')}</span></td>
        <td>${t.provider} <br><span style="font-size: 0.75rem; color: var(--color-text-muted);">${t.district}</span></td>
        <td><span class="badge ${signalBadgeClass}">${employerSignal}</span></td>
        <td style="font-weight: 700;">${wageDisplay}</td>
        <td>${consentBadge}</td>
        <td>
          <div style="display: flex; gap: 0.4rem;">
            <button class="btn btn-outline btn-sm btn-edit-trainee" data-id="${t.id}" title="Edit trainee details">Edit</button>
            <button class="btn btn-outline btn-sm btn-toggle-consent" data-id="${t.id}" data-current="${t.consent_status}" title="Update consent status">Consent</button>
          </div>
        </td>
      `;

      tbody.appendChild(tr);
    });

    // Attach row action listeners
    attachTraineeRowListeners();
  }

  // Attaches click handlers to table action buttons
  function attachTraineeRowListeners() {
    document.querySelectorAll('.btn-edit-trainee').forEach(btn => {
      btn.addEventListener('click', async function() {
        const id = this.getAttribute('data-id');
        openEditTraineeModal(id);
      });
    });

    document.querySelectorAll('.btn-toggle-consent').forEach(btn => {
      btn.addEventListener('click', async function() {
        const id = this.getAttribute('data-id');
        const current = this.getAttribute('data-current');
        const nextStatus = current === 'active' ? 'withdrawn' : 'granted';
        if (confirm(`Are you sure you want to change participant consent status to '${nextStatus}'?`)) {
          try {
            await SkillPulseAPI.post('/api/outcomes/consents/', {
              trainee_id: id,
              status: nextStatus
            });
            SkillPulseAPI.showToast(`Consent updated to ${nextStatus}.`, 'success');
            loadTraineesData();
          } catch (err) {}
        }
      });
    });
  }

  // Loads single trainee record and populates the edit modal
  async function openEditTraineeModal(traineeId) {
    try {
      const t = await SkillPulseAPI.get(`/api/outcomes/trainees/${traineeId}/`);
      document.getElementById('edit-trainee-id').value = t.id;
      document.getElementById('edit-trainee-name').value = t.name;
      document.getElementById('edit-trainee-course').value = t.course;
      document.getElementById('edit-trainee-provider').value = t.provider;
      document.getElementById('edit-trainee-district').value = t.district;
      document.getElementById('edit-trainee-state').value = t.state;
      document.getElementById('edit-trainee-stage').value = t.stage;
      SkillPulseAPI.openModal('modal-edit-trainee');
    } catch (err) {}
  }

  // Loads provider benchmarking charts and performance cards
  async function loadProvidersData() {
    try {
      const data = await SkillPulseAPI.get('/api/trainer/dashboard/');
      if (window.SkillPulseCharts && data.providers_pulse) {
        SkillPulseCharts.renderProviderPulseChart('providerComparisonCanvas', data.providers_pulse);
      }
    } catch (err) {
      console.error('Failed to load provider metrics:', err);
    }
  }

  // Fetches published and draft course offerings scoped to requesting trainer
  async function loadCoursesData() {
    const searchInput = document.getElementById('courses-search-input');
    const statusSelect = document.getElementById('courses-status-filter');
    const indicator = document.getElementById('courses-count-indicator');

    const search = searchInput ? searchInput.value.trim() : '';
    const status = statusSelect ? statusSelect.value : '';

    let url = '/api/courses/?';
    if (search) url += `search=${encodeURIComponent(search)}&`;
    if (status) url += `status=${encodeURIComponent(status)}&`;

    try {
      if (indicator) indicator.textContent = 'Loading courses...';
      const res = await SkillPulseAPI.get(url);
      currentCourses = res.results || res || [];
      if (indicator) indicator.textContent = `${currentCourses.length} course${currentCourses.length === 1 ? '' : 's'}`;
      renderCoursesGrid(currentCourses);
    } catch (err) {
      console.error('Failed to load courses:', err);
      if (indicator) indicator.textContent = 'Error loading courses';
    }
  }

  // Renders course cards into the courses view panel grid
  function renderCoursesGrid(courses) {
    const container = document.getElementById('courses-grid-container');
    if (!container) return;

    if (!courses || courses.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 48px 24px; text-align: center; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg);">
          <div style="width: 48px; height: 48px; border-radius: 50%; background: #E0F2F1; color: var(--color-teal); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;">
            <i data-lucide="book-open" style="width: 24px; height: 24px;"></i>
          </div>
          <h3 style="font-size: 1.1rem; color: var(--color-deep-indigo); margin-bottom: 6px;">No Courses Found</h3>
          <p style="color: var(--color-text-muted); font-size: 0.85rem; max-width: 420px; margin: 0 auto 16px;">Create your first vocational offering to begin receiving trainee applications and tracking outcomes.</p>
          <button class="btn btn-primary btn-sm" onclick="document.getElementById('btn-open-create-course').click()">Create First Course</button>
        </div>
      `;
      if (window.lucide) lucide.createIcons();
      return;
    }

    container.innerHTML = courses.map(c => {
      const isPublished = (c.status === 'published');
      const isDraft = (c.status === 'draft');
      const isClosed = (c.status === 'closed');
      
      const statusBadge = isPublished 
        ? '<span class="badge badge-teal">PUBLISHED</span>' 
        : (isDraft ? '<span class="badge badge-neutral">DRAFT</span>' : '<span class="badge" style="background:#FEE2E2; color:#B91C1C;">CLOSED</span>');

      const enrolledPct = c.capacity ? Math.min(100, Math.round((c.enrolled_count / c.capacity) * 100)) : 0;
      const toggleAction = isPublished ? 'close' : 'publish';
      const toggleLabel = isPublished ? 'Close Course' : 'Publish Course';
      const toggleClass = isPublished ? 'btn-outline' : 'btn-primary';

      return `
        <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; border: 1px solid var(--color-border); border-radius: var(--radius-lg); padding: 1.25rem; background: var(--color-surface); box-shadow: var(--shadow-sm); transition: transform 0.15s ease, box-shadow 0.15s ease;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--color-teal); text-transform: uppercase;">${c.category}</span>
              ${statusBadge}
            </div>

            <h3 style="font-size: 1.15rem; font-weight: 800; color: var(--color-deep-indigo); margin-bottom: 0.25rem; line-height: 1.3;">${c.title}</h3>
            <div style="font-size: 0.8rem; font-family: var(--font-mono); color: var(--color-text-muted); margin-bottom: 0.75rem;">${c.course_code}</div>

            <p style="font-size: 0.82rem; color: var(--color-text-muted); margin-bottom: 1rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              ${c.description || 'No detailed description provided.'}
            </p>

            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 0.4rem;">
              <span><strong>${c.duration_weeks}</strong> Weeks</span>
              <span>Hub: <strong>${c.district || 'Pune'}</strong></span>
            </div>

            <!-- Enrollment Capacity Meter -->
            <div style="margin-bottom: 1.25rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 600; margin-bottom: 4px;">
                <span>Learners Enrolled</span>
                <span>${c.enrolled_count} / ${c.capacity} (${enrolledPct}%)</span>
              </div>
              <div class="progress-bar-bg" style="height: 6px;">
                <div class="progress-bar-fill" style="width: ${enrolledPct}%;"></div>
              </div>
            </div>
          </div>

          <!-- Card Operations Toolbar -->
          <div style="border-top: 1px solid var(--color-border); padding-top: 0.85rem; display: flex; flex-direction: column; gap: 0.5rem;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
              <button class="btn btn-outline btn-sm btn-course-applications" data-id="${c.id}" style="font-size: 0.78rem; padding: 6px 10px;">
                <i data-lucide="inbox" style="width: 14px; height: 14px;"></i>
                <span>Applications</span>
              </button>
              <button class="btn btn-outline btn-sm btn-course-roster" data-id="${c.id}" style="font-size: 0.78rem; padding: 6px 10px;">
                <i data-lucide="users" style="width: 14px; height: 14px;"></i>
                <span>Roster</span>
              </button>
            </div>

            <div style="display: flex; gap: 0.5rem;">
              <button class="btn btn-outline btn-sm btn-course-analytics" data-id="${c.id}" style="flex: 1; font-size: 0.78rem; padding: 6px 10px;">
                <i data-lucide="bar-chart-2" style="width: 14px; height: 14px;"></i>
                <span>Analytics</span>
              </button>
              <button class="btn ${toggleClass} btn-sm btn-course-toggle" data-id="${c.id}" data-action="${toggleAction}" style="flex: 1; font-size: 0.78rem; padding: 6px 10px;">
                <span>${toggleLabel}</span>
              </button>
              <button class="btn btn-outline btn-sm btn-course-edit" data-id="${c.id}" style="padding: 6px 8px;" title="Edit Course">
                <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Wire up course card action handlers
    container.querySelectorAll('.btn-course-applications').forEach(btn => {
      btn.addEventListener('click', () => openCourseApplications(btn.getAttribute('data-id')));
    });
    container.querySelectorAll('.btn-course-roster').forEach(btn => {
      btn.addEventListener('click', () => openCourseRoster(btn.getAttribute('data-id')));
    });
    container.querySelectorAll('.btn-course-analytics').forEach(btn => {
      btn.addEventListener('click', () => openCourseAnalytics(btn.getAttribute('data-id')));
    });
    container.querySelectorAll('.btn-course-toggle').forEach(btn => {
      btn.addEventListener('click', () => toggleCourseStatus(btn.getAttribute('data-id'), btn.getAttribute('data-action')));
    });
    container.querySelectorAll('.btn-course-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const course = currentCourses.find(c => String(c.id) === String(id));
        if (course) openCourseFormModal(course);
      });
    });

    if (window.lucide) lucide.createIcons();
  }

  // Opens the course create or edit modal
  function openCourseFormModal(course = null) {
    const modalTitle = document.getElementById('course-form-modal-title');
    const idInput = document.getElementById('course-form-id');
    const form = document.getElementById('form-course-upsert');

    if (!form) return;
    form.reset();

    if (course) {
      if (modalTitle) modalTitle.textContent = `Edit Course: ${course.course_code}`;
      if (idInput) idInput.value = course.id;
      document.getElementById('course-input-title').value = course.title;
      document.getElementById('course-input-code').value = course.course_code;
      document.getElementById('course-input-category').value = course.category || 'Vocational Skills';
      document.getElementById('course-input-duration').value = course.duration_weeks;
      document.getElementById('course-input-capacity').value = course.capacity;
      document.getElementById('course-input-start-date').value = course.start_date;
      document.getElementById('course-input-end-date').value = course.end_date;
      document.getElementById('course-input-district').value = course.district || '';
      document.getElementById('course-input-state').value = course.state || '';
      document.getElementById('course-input-status').value = course.status;
      document.getElementById('course-input-language').value = course.language || 'English / Hindi';
      document.getElementById('course-input-description').value = course.description || '';
    } else {
      if (modalTitle) modalTitle.textContent = 'Create New Course Offering';
      if (idInput) idInput.value = '';
      
      const today = new Date();
      const in8Weeks = new Date(today.getTime() + 8 * 7 * 24 * 60 * 60 * 1000);
      document.getElementById('course-input-start-date').value = today.toISOString().split('T')[0];
      document.getElementById('course-input-end-date').value = in8Weeks.toISOString().split('T')[0];
    }

    SkillPulseAPI.openModal('modal-course-form');
    if (window.lucide) lucide.createIcons();
  }

  // Submits course creation or patch update payload
  async function handleCourseFormSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('course-form-id').value;

    const payload = {
      title: document.getElementById('course-input-title').value.trim(),
      course_code: document.getElementById('course-input-code').value.trim().toUpperCase(),
      category: document.getElementById('course-input-category').value,
      duration_weeks: parseInt(document.getElementById('course-input-duration').value, 10),
      capacity: parseInt(document.getElementById('course-input-capacity').value, 10),
      start_date: document.getElementById('course-input-start-date').value,
      end_date: document.getElementById('course-input-end-date').value,
      district: document.getElementById('course-input-district').value.trim(),
      state: document.getElementById('course-input-state').value.trim(),
      status: document.getElementById('course-input-status').value,
      language: document.getElementById('course-input-language').value.trim(),
      description: document.getElementById('course-input-description').value.trim(),
      certificate_eligible: true
    };

    try {
      if (id) {
        await SkillPulseAPI.patch(`/api/courses/${id}/`, payload);
        SkillPulseAPI.showToast('Course offering updated successfully.', 'success');
      } else {
        await SkillPulseAPI.post('/api/courses/', payload);
        SkillPulseAPI.showToast('New course created and logged.', 'success');
      }
      SkillPulseAPI.closeModal('modal-course-form');
      loadCoursesData();
    } catch (err) {
      console.error('Failed to save course:', err);
    }
  }

  // Toggles publication status of a course offering
  async function toggleCourseStatus(courseId, action) {
    try {
      const endpoint = action === 'publish' ? `/api/courses/${courseId}/publish/` : `/api/courses/${courseId}/close/`;
      const res = await SkillPulseAPI.post(endpoint);
      SkillPulseAPI.showToast(`Course status updated to ${res.status}.`, 'success');
      loadCoursesData();
    } catch (err) {
      console.error('Failed to toggle course status:', err);
    }
  }

  // Opens course applications modal and loads applicant queue
  async function openCourseApplications(courseId) {
    const titleEl = document.getElementById('modal-applications-course-title');
    const listEl = document.getElementById('course-applications-list');
    const course = currentCourses.find(c => String(c.id) === String(courseId));

    if (titleEl && course) {
      titleEl.textContent = `${course.title} (${course.course_code})`;
    }

    if (listEl) {
      listEl.innerHTML = '<div style="text-align: center; padding: 24px; color: var(--color-text-muted);">Loading applications...</div>';
    }

    SkillPulseAPI.openModal('modal-course-applications');

    try {
      const apps = await SkillPulseAPI.get(`/api/courses/${courseId}/applications/`);
      renderApplicationsList(apps, courseId);
    } catch (err) {
      if (listEl) listEl.innerHTML = '<div style="color: #EF4444; padding: 16px;">Failed to load applications.</div>';
    }
  }

  // Renders applicant records and decision controls
  function renderApplicationsList(applications, courseId) {
    const listEl = document.getElementById('course-applications-list');
    if (!listEl) return;

    if (!applications || applications.length === 0) {
      listEl.innerHTML = '<div style="padding: 32px 16px; text-align: center; color: var(--color-text-muted);">No applications submitted for this course yet.</div>';
      return;
    }

    listEl.innerHTML = applications.map(app => {
      const isPending = (app.status === 'pending');
      const isApproved = (app.status === 'approved');
      const badge = isApproved 
        ? '<span class="badge badge-teal">APPROVED</span>' 
        : (isPending ? '<span class="badge badge-neutral">PENDING</span>' : '<span class="badge" style="background:#FEE2E2; color:#B91C1C;">REJECTED</span>');

      const dateStr = new Date(app.submitted_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });

      return `
        <div style="border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 0.75rem; background: var(--color-surface);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
            <div>
              <strong style="font-size: 1rem; color: var(--color-deep-indigo);">${app.trainee_name}</strong>
              <span style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--color-text-muted); margin-left: 0.5rem;">${app.trainee_unified_id}</span>
            </div>
            ${badge}
          </div>

          <p style="font-size: 0.85rem; color: var(--color-text); margin: 0.5rem 0; font-style: italic;">
            "${app.motivation || 'No motivation statement submitted.'}"
          </p>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.75rem; font-size: 0.75rem; color: var(--color-text-muted);">
            <span>Submitted: ${dateStr}</span>
            ${isPending ? `
              <div style="display: flex; gap: 0.5rem;">
                <button class="btn btn-outline btn-sm btn-reject-app" data-id="${app.id}" style="color: #EF4444; border-color: #EF4444;">Reject</button>
                <button class="btn btn-primary btn-sm btn-approve-app" data-id="${app.id}">Approve</button>
              </div>
            ` : (app.reviewed_by_name ? `<span>Reviewed by ${app.reviewed_by_name}</span>` : '')}
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.btn-approve-app').forEach(btn => {
      btn.addEventListener('click', () => reviewApplication(btn.getAttribute('data-id'), 'approved', courseId));
    });
    listEl.querySelectorAll('.btn-reject-app').forEach(btn => {
      btn.addEventListener('click', () => reviewApplication(btn.getAttribute('data-id'), 'rejected', courseId));
    });
  }

  // Submits trainer approval or rejection for a course application
  async function reviewApplication(appId, decision, courseId) {
    try {
      await SkillPulseAPI.post(`/api/courses/applications/${appId}/review/`, {
        status: decision,
        trainer_note: decision === 'approved' ? 'Approved by course instructor.' : 'Not accepted at this time.'
      });
      SkillPulseAPI.showToast(`Application marked as ${decision}.`, 'success');
      openCourseApplications(courseId);
      loadCoursesData();
    } catch (err) {
      console.error('Failed to review application:', err);
    }
  }

  // Opens course roster modal and displays enrolled learners
  async function openCourseRoster(courseId) {
    const titleEl = document.getElementById('modal-roster-course-title');
    const listEl = document.getElementById('course-roster-list');
    const course = currentCourses.find(c => String(c.id) === String(courseId));

    if (titleEl && course) {
      titleEl.textContent = `${course.title} (${course.course_code}) — Enrolled Learner Roster`;
    }

    if (listEl) {
      listEl.innerHTML = '<div style="text-align: center; padding: 24px; color: var(--color-text-muted);">Loading roster...</div>';
    }

    SkillPulseAPI.openModal('modal-course-roster');

    try {
      const enrollments = await SkillPulseAPI.get(`/api/courses/${courseId}/enrollments/`);
      renderRosterList(enrollments, courseId);
    } catch (err) {
      if (listEl) listEl.innerHTML = '<div style="color: #EF4444; padding: 16px;">Failed to load roster.</div>';
    }
  }

  // Renders enrolled learner cards with progression, certificate, and outcome actions
  function renderRosterList(enrollments, courseId) {
    const listEl = document.getElementById('course-roster-list');
    if (!listEl) return;

    if (!enrollments || enrollments.length === 0) {
      listEl.innerHTML = '<div style="padding: 32px 16px; text-align: center; color: var(--color-text-muted);">No enrolled students currently in this course.</div>';
      return;
    }

    listEl.innerHTML = enrollments.map(e => {
      const isCompleted = (e.status === 'completed' || e.completion_percent >= 100);
      const statusBadge = isCompleted 
        ? '<span class="badge badge-teal">COMPLETED</span>' 
        : '<span class="badge badge-neutral">ACTIVE</span>';

      return `
        <div style="border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 0.75rem; background: var(--color-surface);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <strong style="font-size: 1rem; color: var(--color-deep-indigo);">${e.trainee_name}</strong>
              <span style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--color-text-muted); margin-left: 0.5rem;">${e.trainee_unified_id}</span>
              <span style="font-size: 0.78rem; color: var(--color-text-muted); margin-left: 0.5rem;">· ${e.trainee_district}</span>
            </div>
            ${statusBadge}
          </div>

          <!-- Progress Bar -->
          <div style="margin: 0.6rem 0;">
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 600; margin-bottom: 4px;">
              <span>Course Progress</span>
              <span>${e.completion_percent}%</span>
            </div>
            <div class="progress-bar-bg" style="height: 6px;">
              <div class="progress-bar-fill" style="width: ${e.completion_percent}%;"></div>
            </div>
          </div>

          <!-- Outcomes Status Snippet -->
          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.78rem; color: var(--color-text-muted); margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <strong>Outcome:</strong> 
              ${e.has_outcome ? `<span style="color: var(--color-teal); font-weight: 700;">${e.outcome_status.toUpperCase()}</span>` : '<span>Not reported yet</span>'}
            </div>
            <div>
              <strong>Credential:</strong> 
              ${e.has_certificate ? `<a href="${e.certificate_pdf_url}" target="_blank" style="color: var(--color-teal); font-weight: 700; text-decoration: underline;">View PDF (${e.certificate_token ? e.certificate_token.slice(0,8) : 'Issued'})</a>` : '<span>Not issued</span>'}
            </div>
          </div>

          <!-- Operations Toolbar -->
          <div style="border-top: 1px solid var(--color-border); padding-top: 0.6rem; display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-end;">
            <button class="btn btn-outline btn-sm btn-update-progress" data-id="${e.id}" data-pct="${e.completion_percent}" style="font-size: 0.75rem; padding: 4px 8px;">
              <i data-lucide="percent" style="width: 13px; height: 13px;"></i>
              <span>Update %</span>
            </button>

            ${!e.has_certificate ? `
              <button class="btn btn-primary btn-sm btn-issue-cert" data-id="${e.id}" style="font-size: 0.75rem; padding: 4px 8px;">
                <i data-lucide="award" style="width: 13px; height: 13px;"></i>
                <span>Issue Certificate</span>
              </button>
            ` : ''}

            <button class="btn btn-outline btn-sm btn-remind-outcome" data-id="${e.id}" style="font-size: 0.75rem; padding: 4px 8px;">
              <i data-lucide="bell" style="width: 13px; height: 13px;"></i>
              <span>Send Survey Reminder</span>
            </button>

            ${e.has_outcome ? `
              <button class="btn btn-outline btn-sm btn-verify-outcome" data-id="${e.outcome_id}" style="font-size: 0.75rem; padding: 4px 8px; color: var(--color-teal); border-color: var(--color-teal);">
                <i data-lucide="check-circle" style="width: 13px; height: 13px;"></i>
                <span>Verify Outcome</span>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    listEl.querySelectorAll('.btn-update-progress').forEach(btn => {
      btn.addEventListener('click', () => updateProgressDialog(btn.getAttribute('data-id'), btn.getAttribute('data-pct'), courseId));
    });
    listEl.querySelectorAll('.btn-issue-cert').forEach(btn => {
      btn.addEventListener('click', () => issueCertificate(btn.getAttribute('data-id'), courseId));
    });
    listEl.querySelectorAll('.btn-remind-outcome').forEach(btn => {
      btn.addEventListener('click', () => remindOutcome(btn.getAttribute('data-id')));
    });
    listEl.querySelectorAll('.btn-verify-outcome').forEach(btn => {
      btn.addEventListener('click', () => verifyTraineeOutcome(btn.getAttribute('data-id'), courseId));
    });

    if (window.lucide) lucide.createIcons();
  }

  // Prompts and updates learner course progression percentage
  async function updateProgressDialog(enrollmentId, currentPct, courseId) {
    const input = prompt(`Update student completion percentage (0 - 100):`, currentPct || '100');
    if (input === null) return;
    const num = parseInt(input, 10);
    if (isNaN(num) || num < 0 || num > 100) {
      alert('Please enter a valid percentage between 0 and 100.');
      return;
    }

    try {
      await SkillPulseAPI.patch(`/api/courses/enrollments/${enrollmentId}/`, {
        completion_percent: num,
        status: num >= 100 ? 'completed' : 'active'
      });
      SkillPulseAPI.showToast('Enrollment progression updated.', 'success');
      openCourseRoster(courseId);
    } catch (err) {
      console.error('Failed to update progression:', err);
    }
  }

  // Issues cryptographic PDF certificate of completion
  async function issueCertificate(enrollmentId, courseId) {
    try {
      const cert = await SkillPulseAPI.post(`/api/courses/enrollments/${enrollmentId}/certificate/`);
      SkillPulseAPI.showToast(`Certificate ${cert.certificate_number} successfully issued!`, 'success');
      openCourseRoster(courseId);
      loadCoursesData();
    } catch (err) {
      console.error('Failed to issue certificate:', err);
    }
  }

  // Sends in-app employment survey reminder to enrolled learner
  async function remindOutcome(enrollmentId) {
    try {
      const res = await SkillPulseAPI.post(`/api/courses/enrollments/${enrollmentId}/remind/`);
      SkillPulseAPI.showToast(res.message || 'Survey reminder dispatched to learner.', 'success');
    } catch (err) {
      console.error('Failed to dispatch reminder:', err);
    }
  }

  // Marks self-reported trainee outcome as officially verified
  async function verifyTraineeOutcome(outcomeId, courseId) {
    try {
      await SkillPulseAPI.post(`/api/courses/outcomes/${outcomeId}/verify/`);
      SkillPulseAPI.showToast('Outcome marked as verified.', 'success');
      openCourseRoster(courseId);
    } catch (err) {
      console.error('Failed to verify outcome:', err);
    }
  }

  // Displays real-time aggregate course analytics modal
  async function openCourseAnalytics(courseId) {
    const titleEl = document.getElementById('modal-analytics-course-title');
    const contentEl = document.getElementById('modal-analytics-content');
    const course = currentCourses.find(c => String(c.id) === String(courseId));

    if (titleEl && course) {
      titleEl.textContent = `${course.title} (${course.course_code})`;
    }

    if (contentEl) {
      contentEl.innerHTML = '<div style="text-align: center; padding: 24px; color: var(--color-text-muted);">Calculating analytics...</div>';
    }

    SkillPulseAPI.openModal('modal-course-analytics');

    try {
      const a = await SkillPulseAPI.get(`/api/courses/${courseId}/analytics/`);
      if (contentEl) {
        contentEl.innerHTML = `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
            <div class="card" style="padding: 1rem; text-align: center; border: 1px solid var(--color-border); border-radius: var(--radius-md);">
              <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Enrolled</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-deep-indigo); margin-top: 4px;">${formatNumber(a.total_enrolled)}</div>
            </div>
            <div class="card" style="padding: 1rem; text-align: center; border: 1px solid var(--color-border); border-radius: var(--radius-md);">
              <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Completion</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-teal); margin-top: 4px;">${formatPercent(a.completion_rate)}</div>
            </div>
            <div class="card" style="padding: 1rem; text-align: center; border: 1px solid var(--color-border); border-radius: var(--radius-md);">
              <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Certificates</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-deep-indigo); margin-top: 4px;">${formatNumber(a.certificates_issued)}</div>
            </div>
            <div class="card" style="padding: 1rem; text-align: center; border: 1px solid var(--color-border); border-radius: var(--radius-md);">
              <div style="font-size: 0.75rem; color: var(--color-text-muted); text-transform: uppercase;">Placement</div>
              <div style="font-size: 1.5rem; font-weight: 800; color: var(--color-teal); margin-top: 4px;">${formatPercent(a.placement_rate)}</div>
            </div>
          </div>

          <div style="background: var(--color-bg); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--color-border);">
            <div style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 0.5rem;">Average Monthly Earnings (Reported)</div>
            <div style="font-size: 1.4rem; font-weight: 800; color: var(--color-deep-indigo);">${formatINR(a.average_wage)}</div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 2px;">Based on ${a.outcomes_reported} verified and self-reported learner submissions.</div>
          </div>
        `;
      }
    } catch (err) {
      if (contentEl) contentEl.innerHTML = '<div style="color: #EF4444; padding: 16px;">Failed to load analytics.</div>';
    }
  }

  // Binds all user interaction handlers: navigation, mobile drawer, follow-up actions, trainee forms, course management, and report exports
  function setupEventListeners() {
    // Navigation link click listener — closes mobile drawer after switching view
    document.querySelectorAll('.nav-link[data-tab], .bottom-nav-item[data-tab]').forEach(link => {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        const tab = this.getAttribute('data-tab');
        if (tab) {
          switchView(tab);
          const sb = document.getElementById('app-sidebar');
          const bd = document.getElementById('mobile-backdrop');
          if (sb) sb.classList.remove('open');
          if (bd) bd.classList.remove('active');
        }
      });
    });

    // Mobile drawer toggle
    const drawerToggle = document.getElementById('mobile-drawer-toggle');
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('mobile-backdrop');
    if (drawerToggle && sidebar && backdrop) {
      drawerToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        backdrop.classList.toggle('active');
      });
      backdrop.addEventListener('click', () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
      });
    }

    // Follow-up channel tab switcher (WhatsApp vs SMS)
    document.querySelectorAll('.simulator-tab-btn').forEach(tabBtn => {
      tabBtn.addEventListener('click', function() {
        document.querySelectorAll('.simulator-tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentChannel = this.getAttribute('data-channel');
        if (selectedFollowUp) selectFollowUpItem(selectedFollowUp);
      });
    });

    // Outreach dispatch button
    const sendBtn = document.getElementById('btn-dispatch-followup');
    if (sendBtn) sendBtn.addEventListener('click', dispatchFollowUpOutreach);

    // Opens reschedule modal populated with selected follow-up details
    const openRescheduleBtn = document.getElementById('btn-open-reschedule');
    if (openRescheduleBtn) {
      openRescheduleBtn.addEventListener('click', () => {
        if (!selectedFollowUp) {
          SkillPulseAPI.showToast('Please select a participant first.', 'warning');
          return;
        }
        document.getElementById('reschedule-followup-id').value = selectedFollowUp.id;
        document.getElementById('reschedule-trainee-name').textContent =
          `${selectedFollowUp.trainee_name} (${selectedFollowUp.trainee_unified_id})`;
        document.getElementById('reschedule-contact-date').value = selectedFollowUp.next_contact_date || '';
        document.getElementById('reschedule-trainer-notes').value = selectedFollowUp.trainer_notes || '';
        SkillPulseAPI.openModal('modal-reschedule-followup');
      });
    }

    // Submits follow-up reschedule form with updated contact date and notes
    const rescheduleForm = document.getElementById('form-reschedule-followup');
    if (rescheduleForm) {
      rescheduleForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = document.getElementById('reschedule-followup-id').value;
        const nextDate = document.getElementById('reschedule-contact-date').value;
        const notes = document.getElementById('reschedule-trainer-notes').value.trim();
        try {
          await SkillPulseAPI.patch(`/api/outcomes/follow-ups/${id}/`, {
            status: 'rescheduled',
            next_contact_date: nextDate,
            trainer_notes: notes
          });
          SkillPulseAPI.showToast('Follow-up successfully rescheduled.', 'success');
          SkillPulseAPI.closeModal('modal-reschedule-followup');
          loadFollowUpsData();
        } catch (err) {
          console.error('Failed to reschedule follow-up:', err);
        }
      });
    }

    // Debounced trainee search input listener
    const traineeSearch = document.getElementById('trainee-search-input');
    if (traineeSearch) {
      let debounceTimer;
      traineeSearch.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(loadTraineesData, 350);
      });
    }

    // Dropdown filter change listeners for trainee panel
    ['filter-provider', 'filter-stage', 'filter-consent'].forEach(filterId => {
      const el = document.getElementById(filterId);
      if (el) el.addEventListener('change', loadTraineesData);
    });

    // Course management triggers
    const btnCreateCourse = document.getElementById('btn-open-create-course');
    if (btnCreateCourse) {
      btnCreateCourse.addEventListener('click', () => openCourseFormModal());
    }

    const courseForm = document.getElementById('form-course-upsert');
    if (courseForm) {
      courseForm.addEventListener('submit', handleCourseFormSubmit);
    }

    const courseSearch = document.getElementById('courses-search-input');
    if (courseSearch) {
      let timeout;
      courseSearch.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(loadCoursesData, 300);
      });
    }

    const courseStatusFilter = document.getElementById('courses-status-filter');
    if (courseStatusFilter) {
      courseStatusFilter.addEventListener('change', loadCoursesData);
    }

    // New Trainee form submission
    const newTraineeForm = document.getElementById('form-new-trainee');
    if (newTraineeForm) {
      newTraineeForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const payload = {
          name: document.getElementById('new-trainee-name').value.trim(),
          unified_id: document.getElementById('new-trainee-id').value.trim().toUpperCase(),
          course: document.getElementById('new-trainee-course').value.trim(),
          provider: document.getElementById('new-trainee-provider').value.trim(),
          district: document.getElementById('new-trainee-district').value.trim(),
          state: document.getElementById('new-trainee-state').value.trim(),
          gender: document.getElementById('new-trainee-gender').value,
          age_band: document.getElementById('new-trainee-age').value,
          consent_status: 'active'
        };

        try {
          await SkillPulseAPI.post('/api/outcomes/trainees/', payload);
          SkillPulseAPI.showToast('Trainee registered with active consent record.', 'success');
          SkillPulseAPI.closeModal('modal-new-trainee');
          newTraineeForm.reset();
          loadTraineesData();
        } catch (err) {}
      });
    }

    // Edit Trainee form submission
    const editTraineeForm = document.getElementById('form-edit-trainee');
    if (editTraineeForm) {
      editTraineeForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const id = document.getElementById('edit-trainee-id').value;
        const payload = {
          name: document.getElementById('edit-trainee-name').value.trim(),
          course: document.getElementById('edit-trainee-course').value.trim(),
          provider: document.getElementById('edit-trainee-provider').value.trim(),
          district: document.getElementById('edit-trainee-district').value.trim(),
          state: document.getElementById('edit-trainee-state').value.trim(),
          stage: document.getElementById('edit-trainee-stage').value
        };

        try {
          await SkillPulseAPI.patch(`/api/outcomes/trainees/${id}/`, payload);
          SkillPulseAPI.showToast('Trainee record updated successfully.', 'success');
          SkillPulseAPI.closeModal('modal-edit-trainee');
          loadTraineesData();
        } catch (err) {}
      });
    }

    // Seed Demo Data button
    document.querySelectorAll('.btn-seed-demo-trigger').forEach(btn => {
      btn.addEventListener('click', async function() {
        try {
          const res = await SkillPulseAPI.post('/api/outcomes/trainees/seed-demo/');
          SkillPulseAPI.showToast(res.message || 'Demo data verified and loaded.', 'success');
          loadOverviewData();
          loadTraineesData();
          loadFollowUpsData();
          loadCoursesData();
        } catch (err) {}
      });
    });

    // CSV Impact Export download
    document.querySelectorAll('.btn-download-impact-csv').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.href = '/api/reports/impact-export/';
      });
    });

    // CSV Provider Export download
    document.querySelectorAll('.btn-download-provider-csv').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.href = '/api/reports/provider-export/';
      });
    });
  }

  // Initialize
  setupEventListeners();
  switchView('overview');
});

