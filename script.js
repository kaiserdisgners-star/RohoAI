/**
 * RohoAI - Modern JavaScript Application
 * AI Chat Assistant with Gemini API Integration
 * Author: RohoAI Team
 */

// ==========================================
// CONFIGURATION
// ==========================================

const CONFIG = {
  API_KEY: "WEKA_GEMINI_KEY_HAPA",
  API_ENDPOINT: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
  STORAGE_KEYS: {
    PROFILE: "roho_profile",
    MEMORY: "roho_memory",
  },
  DEFAULTS: {
    USERNAME: "Guest",
    ERROR_MESSAGE: "Samahani, sijapata jibu. Tafadhali jaribu tena.",
    CONNECTION_ERROR: "Kosa la Mtandao - Hakuna Muunganisho",
    MAX_MEMORY: 20,
    TYPING_INDICATOR: "● ● ●",
  },
  TIMEOUTS: {
    REQUEST: 30000, // 30 seconds
  },
};

// ==========================================
// DOM ELEMENTS
// ==========================================

const DOM = {
  app: document.getElementById("app"),
  chatArea: document.getElementById("chat"),
  prompt: document.getElementById("prompt"),
  sendBtn: document.getElementById("sendBtn"),
  editBtn: document.getElementById("editProfileBtn"),
  username: document.getElementById("username"),
  chatForm: document.getElementById("chatForm"),
  status: document.getElementById("status"),
};

// ==========================================
// STATE MANAGEMENT
// ==========================================

const STATE = {
  profile: loadFromStorage(CONFIG.STORAGE_KEYS.PROFILE) || {
    name: CONFIG.DEFAULTS.USERNAME,
  },
  memory: loadFromStorage(CONFIG.STORAGE_KEYS.MEMORY) || [],
  isLoading: false,
  isOnline: navigator.onLine,
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Load data from localStorage with error handling
 * @param {string} key - Storage key
 * @returns {any} Parsed data or null
 */
function loadFromStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
    return null;
  }
}

/**
 * Save data to localStorage with error handling
 * @param {string} key - Storage key
 * @param {any} data - Data to save
 * @returns {boolean} Success status
 */
function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
    showNotification("Storage error", "error");
    return false;
  }
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
function sanitizeText(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show notification to user
 * @param {string} message - Message to display
 * @param {string} type - Type (success, error, info)
 */
function showNotification(message, type = "info") {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // Can be extended with a toast notification library
}

/**
 * Debounce function for input events
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Throttle function for scroll events
 * @param {Function} func - Function to throttle
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, delay = 1000) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func.apply(this, args);
    }
  };
}

// ==========================================
// PROFILE MANAGEMENT
// ==========================================

/**
 * Load and display user profile
 */
function loadProfile() {
  if (DOM.username) {
    DOM.username.textContent = STATE.profile.name;
  }
}

/**
 * Edit user profile with validation
 */
function editProfile() {
  const newName = prompt("Ingiza jina lako:", STATE.profile.name);

  if (newName && newName.trim()) {
    const trimmedName = newName.trim().substring(0, 50);
    STATE.profile.name = trimmedName;

    if (saveToStorage(CONFIG.STORAGE_KEYS.PROFILE, STATE.profile)) {
      loadProfile();
      showNotification("Profil ilisasishwa", "success");
    }
  }
}

/**
 * Clear all chat history
 */
function clearMemory() {
  if (
    confirm(
      "Je, una hakika unataka kufuta historia yote ya mazungumzo? Hatuwezi kurudi."
    )
  ) {
    STATE.memory = [];
    localStorage.removeItem(CONFIG.STORAGE_KEYS.MEMORY);
    DOM.chatArea.innerHTML = "";
    showNotification("Historia ilisafishwa", "success");
  }
}

/**
 * Export chat history as JSON
 */
function exportMemory() {
  const dataStr = JSON.stringify(STATE.memory, null, 2);
  const dataBlob = new Blob([dataStr], { type: "application/json" });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `rohoai-history-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

// ==========================================
// MESSAGE MANAGEMENT
// ==========================================

/**
 * Add message to chat with proper structure
 * @param {string} text - Message text
 * @param {string} type - Message type (user/ai)
 * @returns {HTMLElement} Message element
 */
function addMessage(text, type = "ai") {
  if (!DOM.chatArea) return null;

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}`;
  messageDiv.setAttribute("role", "article");

  if (type === "ai") {
    messageDiv.innerHTML = `
      <div class="message-avatar" aria-hidden="true">🤖</div>
      <div class="message-content">
        <p>${sanitizeText(text)}</p>
      </div>
    `;
  } else {
    messageDiv.innerHTML = `
      <div class="message-content">
        <p>${sanitizeText(text)}</p>
      </div>
    `;
  }

  DOM.chatArea.appendChild(messageDiv);
  scrollToBottom();

  return messageDiv;
}

/**
 * Scroll chat to bottom
 */
function scrollToBottom() {
  if (DOM.chatArea) {
    DOM.chatArea.scrollTop = DOM.chatArea.scrollHeight;
  }
}

/**
 * Load previous chat history
 */
function loadChatHistory() {
  STATE.memory.forEach((msg) => {
    addMessage(msg.text, msg.type);
  });
}

// ==========================================
// NETWORK & API FUNCTIONS
// ==========================================

/**
 * Check network connectivity
 */
function updateOnlineStatus() {
  STATE.isOnline = navigator.onLine;
  if (DOM.status) {
    const statusText = STATE.isOnline ? "Online" : "Offline";
    const statusClass = STATE.isOnline ? "online" : "offline";
    DOM.status.textContent = statusText;
    DOM.status.className = `status ${statusClass}`;
  }
}

/**
 * Create abort controller for request timeout
 * @param {number} timeoutMs - Timeout in milliseconds
 * @returns {AbortController} Controller with timeout
 */
function createAbortControllerWithTimeout(timeoutMs = CONFIG.TIMEOUTS.REQUEST) {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
}

/**
 * Make API request to Gemini with error handling
 * @param {string} userMessage - User's message
 * @returns {Promise<string>} AI response
 */
async function getAIResponse(userMessage) {
  if (!CONFIG.API_KEY || CONFIG.API_KEY.includes("HAPA")) {
    throw new Error(
      "API_KEY ayam-i kuweka. Tafadhali weka API key sahihi katika script.js"
    );
  }

  if (!STATE.isOnline) {
    throw new Error(CONFIG.DEFAULTS.CONNECTION_ERROR);
  }

  // Build conversation context
  const conversation = STATE.memory
    .slice(-CONFIG.DEFAULTS.MAX_MEMORY)
    .map((m) => `${m.type === "user" ? "User" : "AI"}: ${m.text}`)
    .join("\n");

  const prompt = `
You are RohoAI, a helpful AI assistant that communicates in Swahili.
User name: ${STATE.profile.name}

Previous conversation:
${conversation}

User's current message: ${userMessage}

Instructions:
- Respond naturally and helpfully
- Keep responses concise (1-3 sentences)
- Use Swahili primarily
- Be friendly and professional
- Maintain conversation context
`;

  const controller = createAbortControllerWithTimeout();

  try {
    const response = await fetch(`${CONFIG.API_ENDPOINT}?key=${CONFIG.API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("Empty response from API");
    }

    const aiResponse =
      data.candidates[0]?.content?.parts?.[0]?.text ||
      CONFIG.DEFAULTS.ERROR_MESSAGE;

    return aiResponse;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Ombi lilizidi muda - tafadhali jaribu tena");
    }
    throw error;
  }
}

// ==========================================
// MESSAGE SENDING
// ==========================================

/**
 * Send user message and get AI response
 */
async function sendMessage() {
  const userText = DOM.prompt.value.trim();

  if (!userText) {
    return;
  }

  if (STATE.isLoading) {
    return;
  }

  STATE.isLoading = true;
  disableInputs(true);

  try {
    // Add user message to chat
    addMessage(userText, "user");
    STATE.memory.push({
      type: "user",
      text: userText,
    });

    // Clear input
    DOM.prompt.value = "";

    // Show typing indicator
    const loadingDiv = addMessage(CONFIG.DEFAULTS.TYPING_INDICATOR, "ai");

    // Get AI response
    const aiResponse = await getAIResponse(userText);

    // Remove typing indicator
    if (loadingDiv) {
      loadingDiv.remove();
    }

    // Add AI response to chat
    addMessage(aiResponse, "ai");
    STATE.memory.push({
      type: "ai",
      text: aiResponse,
    });

    // Save to storage
    saveToStorage(CONFIG.STORAGE_KEYS.MEMORY, STATE.memory);
    showNotification("Message sent successfully", "success");
  } catch (error) {
    console.error("Error sending message:", error);

    const errorMessage = error.message || CONFIG.DEFAULTS.ERROR_MESSAGE;
    addMessage(errorMessage, "ai");
    showNotification(errorMessage, "error");
  } finally {
    STATE.isLoading = false;
    disableInputs(false);
    DOM.prompt.focus();
  }
}

/**
 * Handle form submission
 * @param {Event} event - Form submission event
 */
function handleFormSubmit(event) {
  event.preventDefault();
  sendMessage();
}

/**
 * Enable/disable input elements
 * @param {boolean} disabled - Disabled state
 */
function disableInputs(disabled) {
  if (DOM.prompt) DOM.prompt.disabled = disabled;
  if (DOM.sendBtn) DOM.sendBtn.disabled = disabled;
}

// ==========================================
// EVENT LISTENERS
// ==========================================

/**
 * Initialize event listeners
 */
function initializeEventListeners() {
  // Form submission
  if (DOM.chatForm) {
    DOM.chatForm.addEventListener("submit", handleFormSubmit);
  }

  // Send button click
  if (DOM.sendBtn) {
    DOM.sendBtn.addEventListener("click", (e) => {
      e.preventDefault();
      sendMessage();
    });
  }

  // Edit profile button
  if (DOM.editBtn) {
    DOM.editBtn.addEventListener("click", editProfile);
  }

  // Enter key in input (already handled by form, but for safety)
  if (DOM.prompt) {
    DOM.prompt.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Network status
  window.addEventListener("online", updateOnlineStatus);
  window.addEventListener("offline", updateOnlineStatus);

  // Scroll to bottom on new messages
  if (DOM.chatArea) {
    DOM.chatArea.addEventListener("scroll", throttle(() => {
      // Can add "scroll to latest" functionality here
    }, 1000));
  }
}

// ==========================================
// INITIALIZATION
// ==========================================

/**
 * Initialize the application
 */
function initializeApp() {
  try {
    // Load profile
    loadProfile();

    // Load chat history
    loadChatHistory();

    // Set up event listeners
    initializeEventListeners();

    // Update online status
    updateOnlineStatus();

    // Add welcome message if no history
    if (STATE.memory.length === 0) {
      addMessage("Karibu 👋 Mimi ni RohoAI. Unaweza kuuliza chochote!", "ai");
    }

    // Focus input
    if (DOM.prompt) {
      DOM.prompt.focus();
    }

    console.log("RohoAI initialized successfully");
  } catch (error) {
    console.error("Error initializing app:", error);
    showNotification("Failed to initialize application", "error");
  }
}

/**
 * Handle page visibility change
 */
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    // Page became visible
    updateOnlineStatus();
  }
});

/**
 * Handle beforeunload to show save confirmation
 */
window.addEventListener("beforeunload", (e) => {
  if (STATE.memory.length > 0 && STATE.memory.length % 10 === 0) {
    // Optionally warn user, but don't prevent default for data persistence
    console.log("Chat history auto-saved");
  }
});

// ==========================================
// START APPLICATION
// ==========================================

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}

// ==========================================
// EXPORT FUNCTIONS (for console debugging)
// ==========================================

window.RohoAI = {
  STATE,
  CONFIG,
  clearMemory,
  exportMemory,
  editProfile,
  sendMessage,
  getAIResponse,
};
