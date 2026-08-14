const API_URL = 'http://localhost:3000/api/chat';

const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const sendBtn = document.getElementById('send-btn');
const clearBtn = document.getElementById('clear-btn');

// Store conversation history for multi-turn chat context
let conversationHistory = [];

const INITIAL_WELCOME = "Halo! Saya adalah Asisten Virtual SMK NU Ma'arif Kudus 🎓✨\n\nAda yang bisa saya bantu terkait informasi pendaftaran, jurusan, atau prestasi sekolah kami?";

// Initialize welcoming message
function initChat() {
  chatBox.innerHTML = '';
  conversationHistory = [];
  appendMessage('bot', INITIAL_WELCOME);
}

initChat();

clearBtn.addEventListener('click', () => {
  if (confirm("Apakah Anda yakin ingin menghapus seluruh percakapan?")) {
    initChat();
  }
});

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Append user message
  appendMessage('user', userMessage);
  conversationHistory.push({ role: 'user', text: userMessage });

  input.value = '';
  setLoadingState(true);

  // Show typing indicator
  const typingElem = showTypingIndicator();

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ conversation: conversationHistory })
    });

    const data = await response.json();
    removeTypingIndicator(typingElem);

    if (response.ok && data.result) {
      appendMessage('bot', data.result);
      conversationHistory.push({ role: 'model', text: data.result });
    } else {
      const errorMsg = data.error || data.message || 'Gagal terhubung ke server.';
      appendMessage('bot error', `⚠️ ${errorMsg}`);
      // Remove failed user prompt from conversation history to prevent corrupted context
      conversationHistory.pop();
    }
  } catch (error) {
    removeTypingIndicator(typingElem);
    console.error('Chat connection error:', error);
    appendMessage('bot error', '⚠️ Tidak dapat terhubung ke backend server. Pastikan server backend sedang berjalan pada http://localhost:3000');
    conversationHistory.pop();
  } finally {
    setLoadingState(false);
    input.focus();
  }
});

function appendMessage(sender, text) {
  const msgWrapper = document.createElement('div');
  msgWrapper.classList.add('message-wrapper', sender.includes('user') ? 'user-wrapper' : 'bot-wrapper');

  const msg = document.createElement('div');
  msg.classList.add('message', ...sender.split(' '));

  // Basic formatting: handle newlines and bullet points cleanly
  const formattedText = escapeHtml(text)
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>');

  msg.innerHTML = `<p>${formattedText}</p>`;
  msgWrapper.appendChild(msg);

  chatBox.appendChild(msgWrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showTypingIndicator() {
  const typingWrapper = document.createElement('div');
  typingWrapper.classList.add('message-wrapper', 'bot-wrapper', 'typing-wrapper');
  typingWrapper.id = 'typing-indicator';

  const typingMsg = document.createElement('div');
  typingMsg.classList.add('message', 'bot', 'typing');
  typingMsg.innerHTML = `
    <span class="dot"></span>
    <span class="dot"></span>
    <span class="dot"></span>
  `;

  typingWrapper.appendChild(typingMsg);
  chatBox.appendChild(typingWrapper);
  chatBox.scrollTop = chatBox.scrollHeight;

  return typingWrapper;
}

function removeTypingIndicator(elem) {
  if (elem && elem.parentNode) {
    elem.parentNode.removeChild(elem);
  }
}

function setLoadingState(isLoading) {
  input.disabled = isLoading;
  sendBtn.disabled = isLoading;
  if (isLoading) {
    sendBtn.classList.add('loading');
  } else {
    sendBtn.classList.remove('loading');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

