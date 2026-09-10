/*
 * SKILLPULSE — REAL-TIME IN-APP NOTIFICATION SYSTEM
 * Manages unread badge counter, popover display, item mark-read, and bulk clearance
 */

document.addEventListener('DOMContentLoaded', function() {
  'use strict';

  const bellBtn = document.getElementById('notification-bell-btn');
  const badge = document.getElementById('notification-badge');
  const popover = document.getElementById('notification-popover');
  const notifList = document.getElementById('notification-list');
  const markAllBtn = document.getElementById('notif-mark-all-btn');

  if (!bellBtn || !popover) return;

  // Fetches recent notifications and updates unread badge counter
  async function fetchNotifications() {
    try {
      const res = await SkillPulseAPI.get('/api/notifications/');
      const unread = res.unread_count || 0;

      if (badge) {
        if (unread > 0) {
          badge.textContent = unread > 99 ? '99+' : unread;
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      }

      renderNotificationList(res.notifications || []);
    } catch (err) {
      console.warn('Notifications polling error:', err);
    }
  }

  // Renders notification cards in popover drawer
  function renderNotificationList(notifications) {
    if (!notifList) return;

    if (!notifications || notifications.length === 0) {
      notifList.innerHTML = '<div style="padding: 24px 16px; text-align: center; color: var(--color-text-muted); font-size: 0.85rem;">No notifications yet.</div>';
      return;
    }

    notifList.innerHTML = notifications.map(n => {
      const unreadStyle = !n.is_read ? 'background: rgba(14, 129, 118, 0.06); font-weight: 600;' : '';
      const dot = !n.is_read ? '<span style="display:inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--color-teal); margin-right: 6px;"></span>' : '';
      const timeStr = new Date(n.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      return `
        <div class="notif-item" data-id="${n.id}" style="padding: 10px 14px; border-bottom: 1px solid var(--color-border); cursor: pointer; transition: background 0.15s ease; ${unreadStyle}">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
            <div style="font-size: 0.82rem; color: var(--color-text); display: flex; align-items: center;">
              ${dot}<span>${escapeHTML(n.title)}</span>
            </div>
            <span style="font-size: 0.7rem; color: var(--color-text-muted); font-family: var(--font-mono);">${timeStr}</span>
          </div>
          <div style="font-size: 0.78rem; color: var(--color-text-muted); line-height: 1.35;">${escapeHTML(n.body)}</div>
        </div>
      `;
    }).join('');

    // Attach click listeners to individual items
    notifList.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', async function() {
        const notifId = this.getAttribute('data-id');
        try {
          await SkillPulseAPI.post(`/api/notifications/${notifId}/read/`);
          this.style.background = 'transparent';
          this.style.fontWeight = 'normal';
          fetchNotifications();
        } catch (e) {}
      });
    });
  }

  // Escapes HTML content for safe rendering
  function escapeHTML(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Toggles the notification popover dropdown
  bellBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    const isVisible = (popover.style.display === 'block');
    popover.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) {
      fetchNotifications();
    }
  });

  // Closes popover when clicking elsewhere in document
  document.addEventListener('click', function(e) {
    if (popover && !popover.contains(e.target) && e.target !== bellBtn && !bellBtn.contains(e.target)) {
      popover.style.display = 'none';
    }
  });

  // Bulk marks all unread notifications as read
  if (markAllBtn) {
    markAllBtn.addEventListener('click', async function(e) {
      e.stopPropagation();
      try {
        await SkillPulseAPI.post('/api/notifications/read-all/');
        fetchNotifications();
      } catch (err) {}
    });
  }

  // Initial load and recurrent polling every 60 seconds
  fetchNotifications();
  setInterval(fetchNotifications, 60000);
});
