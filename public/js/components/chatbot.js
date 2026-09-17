/**
 * EduGuard AI Assistant Component
 * Floating conversational assistant with Web Speech API voice input and interactive tool actions
 */

const Chatbot = {
  isOpen: false,
  isRecording: false,
  recognition: null,
  pendingAction: null,

  init() {
    this.renderWidget();
    this.setupSpeechRecognition();
    this.bindEvents();
  },

  renderWidget() {
    const existing = document.getElementById('eduguard-chatbot');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'eduguard-chatbot';
    container.className = 'chatbot-widget';

    container.innerHTML = `
      <button id="chatbot-toggle" class="chatbot-toggle-btn" title="Open EduGuard AI Assistant">
        <i class="fas fa-robot"></i>
      </button>

      <div id="chatbot-panel" class="chatbot-panel">
        <div class="chatbot-header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center;">
              <i class="fas fa-sparkles"></i>
            </div>
            <div>
              <div style="font-weight: 700; font-size: 0.95rem;">EduGuard AI</div>
              <div style="font-size: 0.7rem; opacity: 0.85;">English • Hindi • Hinglish</div>
            </div>
          </div>
          <button id="chatbot-close" style="background: none; border: none; color: #fff; font-size: 1.1rem; cursor: pointer;">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div id="chatbot-messages" class="chatbot-messages">
          <div class="chat-bubble bot">
            Hello! I am your <strong>EduGuard AI Assistant</strong>. 🎓<br><br>
            You can ask me about your <strong>academic risk</strong>, <strong>attendance</strong>, or report campus issues in <strong>English, Hindi, or Hinglish</strong> (e.g. <em>"Block B mein Wi-Fi nahi chal raha"</em>).<br><br>
            How can I help you today?
          </div>
        </div>

        <div class="chatbot-input-bar">
          <button id="chatbot-voice-btn" class="voice-btn" title="Voice Input (Speak in English or Hindi)">
            <i class="fas fa-microphone"></i>
          </button>
          <input id="chatbot-input" type="text" class="form-control" placeholder="Ask or speak an issue..." style="border-radius: 20px; font-size: 0.85rem;" />
          <button id="chatbot-send-btn" class="btn btn-primary" style="border-radius: 50%; width: 36px; height: 36px; padding: 0;">
            <i class="fas fa-paper-plane" style="font-size: 0.8rem;"></i>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(container);
  },

  setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-IN'; // Works for Indian English and Hinglish

      this.recognition.onstart = () => {
        this.isRecording = true;
        const btn = document.getElementById('chatbot-voice-btn');
        if (btn) btn.classList.add('recording');
        UI.toast('Listening... Speak now', 'info');
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const input = document.getElementById('chatbot-input');
        if (input) {
          input.value = transcript;
          input.focus();
        }
      };

      this.recognition.onerror = (event) => {
        console.warn('[SpeechRecognition Error]', event.error);
        this.isRecording = false;
        const btn = document.getElementById('chatbot-voice-btn');
        if (btn) btn.classList.remove('recording');
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        const btn = document.getElementById('chatbot-voice-btn');
        if (btn) btn.classList.remove('recording');
      };
    }
  },

  bindEvents() {
    const toggleBtn = document.getElementById('chatbot-toggle');
    const closeBtn = document.getElementById('chatbot-close');
    const sendBtn = document.getElementById('chatbot-send-btn');
    const input = document.getElementById('chatbot-input');
    const voiceBtn = document.getElementById('chatbot-voice-btn');

    toggleBtn?.addEventListener('click', () => this.toggle());
    closeBtn?.addEventListener('click', () => this.close());

    sendBtn?.addEventListener('click', () => this.handleSend());
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleSend();
    });

    voiceBtn?.addEventListener('click', () => {
      if (!this.recognition) {
        UI.toast('Speech recognition not supported in this browser. Please type your message.', 'warning');
        return;
      }
      if (this.isRecording) {
        this.recognition.stop();
      } else {
        this.recognition.start();
      }
    });
  },

  toggle() {
    this.isOpen = !this.isOpen;
    const panel = document.getElementById('chatbot-panel');
    if (panel) {
      if (this.isOpen) panel.classList.add('open');
      else panel.classList.remove('open');
    }
  },

  close() {
    this.isOpen = false;
    const panel = document.getElementById('chatbot-panel');
    if (panel) panel.classList.remove('open');
  },

  openWithMessage(msg) {
    if (!this.isOpen) this.toggle();
    const input = document.getElementById('chatbot-input');
    if (input) {
      input.value = msg;
      this.handleSend();
    }
  },

  async handleSend() {
    const input = document.getElementById('chatbot-input');
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    this.appendMessage('user', text);

    // Show typing indicator
    const typingId = this.showTypingIndicator();

    try {
      const res = await API.sendChatMessage(text);
      this.removeTypingIndicator(typingId);

      if (res.reply) {
        this.appendMessage('bot', res.reply);
      }

      // If response asks for confirmation to create complaint
      if (res.requiresConfirmation && res.actionPayload) {
        this.pendingAction = res.actionPayload;
        this.appendConfirmationCard(res.actionPayload);
      }
    } catch (err) {
      this.removeTypingIndicator(typingId);
      this.appendMessage('bot', `I encountered an error processing your query: ${err.message}`);
    }
  },

  appendMessage(sender, text) {
    const container = document.getElementById('chatbot-messages');
    if (!container) return;

    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}`;
    // Format bold and linebreaks nicely
    const formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/•/g, '<span style="color: var(--primary); font-weight: bold;">•</span>')
      .replace(/\n/g, '<br>');
    bubble.innerHTML = formatted;

    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  },

  appendConfirmationCard(payload) {
    const container = document.getElementById('chatbot-messages');
    if (!container) return;

    const card = document.createElement('div');
    card.className = 'chat-bubble bot confirm-card';
    card.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 8px; color: var(--primary);">
        <i class="fas fa-ticket-alt"></i> Confirm Ticket Creation
      </div>
      <div style="font-size: 0.8rem; margin-bottom: 12px; color: var(--text-secondary);">
        Issue: "<strong>${payload.draft?.title}</strong>"<br>
        Location: <strong>${payload.draft?.block}, ${payload.draft?.room}</strong>
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="btn-confirm-complaint" class="btn btn-primary btn-sm" style="flex: 1;">
          <i class="fas fa-check"></i> Submit Complaint
        </button>
        <button id="btn-cancel-complaint" class="btn btn-secondary btn-sm">
          Cancel
        </button>
      </div>
    `;

    container.appendChild(card);
    container.scrollTop = container.scrollHeight;

    card.querySelector('#btn-confirm-complaint').addEventListener('click', async () => {
      card.remove();
      this.appendMessage('user', 'Yes, submit this complaint ticket.');
      const typingId = this.showTypingIndicator();
      try {
        const res = await API.sendChatMessage('', payload);
        this.removeTypingIndicator(typingId);
        this.appendMessage('bot', res.reply);
        UI.toast('Campus complaint logged successfully!', 'success');
        if (typeof App !== 'undefined') App.refreshCurrentView();
      } catch (e) {
        this.removeTypingIndicator(typingId);
        this.appendMessage('bot', `Failed to create complaint: ${e.message}`);
      }
    });

    card.querySelector('#btn-cancel-complaint').addEventListener('click', () => {
      card.remove();
      this.appendMessage('bot', 'Complaint submission cancelled. Let me know if you need anything else!');
    });
  },

  showTypingIndicator() {
    const container = document.getElementById('chatbot-messages');
    if (!container) return null;

    const id = 'typing-' + Date.now();
    const bubble = document.createElement('div');
    bubble.id = id;
    bubble.className = 'chat-bubble bot';
    bubble.style.display = 'flex';
    bubble.style.gap = '4px';
    bubble.style.alignItems = 'center';
    bubble.innerHTML = `
      <span style="animation: pulse 1s infinite;">•</span>
      <span style="animation: pulse 1s infinite 0.2s;">•</span>
      <span style="animation: pulse 1s infinite 0.4s;">•</span>
    `;

    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
    return id;
  },

  removeTypingIndicator(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
  }
};
