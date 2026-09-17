/**
 * EduGuard 360 Socket Client
 */
let socket = null;

const SocketClient = {
  init() {
    const token = API.getToken();
    if (!token) return;

    if (socket) {
      socket.disconnect();
    }

    try {
      socket = io({
        auth: { token }
      });

      socket.on('connect', () => {
        console.log('[Socket] Connected to real-time event bus.');
      });

      socket.on('notification', (notif) => {
        console.log('[Socket] Received notification:', notif);
        UI.toast(`${notif.title}: ${notif.message}`, 'info');
        UI.incrementNotificationBadge();
        // Refresh notifications list if drawer is open
        if (typeof App !== 'undefined' && App.loadNotifications) {
          App.loadNotifications();
        }
      });

      socket.on('new_complaint', (complaint) => {
        UI.toast(`New campus complaint lodged: ${complaint.ticketId} (${complaint.title})`, 'warning');
        if (window.currentView === 'complaints' || window.currentView === 'admin' || window.currentView === 'staff' || window.currentView === 'head') {
          App.refreshCurrentView();
        }
      });

      socket.on('complaint_escalated', (complaint) => {
        UI.toast(`CRITICAL: Complaint ${complaint.ticketId} has been escalated!`, 'error');
        if (window.currentView === 'complaints' || window.currentView === 'admin' || window.currentView === 'head') {
          App.refreshCurrentView();
        }
      });

    } catch (err) {
      console.warn('[Socket] Socket initialization error:', err);
    }
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }
};
