const input = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const chatBox = document.getElementById("chat-box");
const chatHistory = document.getElementById("chat-history");
const logoutBtn = document.getElementById("logout-btn");
const welcomeQuote = document.getElementById("welcome-quote");
const typingIndicator = document.getElementById("typing-indicator");
const toggleSidebar = document.getElementById("toggleSidebar");
const sidebar = document.getElementById("sidebar");

const AGENT_NAME = "NeoMind";

// Active session
let currentSessionId = localStorage.getItem("activeSession") || generateSessionId();

// Scroll fix for mobile
chatBox.style.overflowY = "auto";

// Sidebar toggle
toggleSidebar?.addEventListener("click", () => {
  sidebar.classList.toggle("show");
});

// Typing indicator dots animation
let dotsInterval;
function showTyping(show = true) {
  if (show) {
    typingIndicator.classList.remove("hidden");
    let dots = "";
    dotsInterval = setInterval(() => {
      dots = dots.length < 3 ? dots + "." : "";
      typingIndicator.innerHTML = `Thinking<span class="dots">${dots}</span>`;
    }, 500);
  } else {
    clearInterval(dotsInterval);
    typingIndicator.classList.add("hidden");
  }
}

// Timestamp
function getTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Create copy button
function createCopyButton(text) {
  const btn = document.createElement("button");
  btn.className = "copy-btn";
  btn.innerText = "📋";
  btn.title = "Copy";
  btn.onclick = () => {
    navigator.clipboard.writeText(text);
    btn.innerText = "✅";
    setTimeout(() => (btn.innerText = "📋"), 1500);
  };
  return btn;
}

// Render message bubble
function renderMessage(role, text) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", role === "user" ? "user-msg" : "bot-msg");

  const meta = document.createElement("div");
  meta.classList.add("msg-meta");

  const timestamp = document.createElement("span");
  timestamp.className = "timestamp";
  timestamp.textContent = getTimestamp();

  const nameTag = document.createElement("span");
  nameTag.className = "model-name";
  nameTag.textContent = role === "user" ? "🧑 You" : `🤖 ${AGENT_NAME}`;

  const copyBtn = createCopyButton(text);

  meta.appendChild(nameTag);
  meta.appendChild(timestamp);
  meta.appendChild(copyBtn);

  const content = document.createElement("div");
  content.className = "msg-content";
  content.innerHTML = role === "user" ? text : marked.parse(text);

  msgDiv.appendChild(meta);
  msgDiv.appendChild(content);
  chatBox.appendChild(msgDiv);

  chatBox.scrollTop = chatBox.scrollHeight;
}

// Typing animation rendering
async function renderTypingText(text) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", "bot-msg");

  const meta = document.createElement("div");
  meta.classList.add("msg-meta");

  const timestamp = document.createElement("span");
  timestamp.className = "timestamp";
  timestamp.textContent = getTimestamp();

  const nameTag = document.createElement("span");
  nameTag.className = "model-name";
  nameTag.textContent = `🤖 ${AGENT_NAME}`;

  const copyBtn = createCopyButton(text);

  meta.appendChild(nameTag);
  meta.appendChild(timestamp);
  meta.appendChild(copyBtn);

  const content = document.createElement("div");
  content.className = "msg-content";

  msgDiv.appendChild(meta);
  msgDiv.appendChild(content);
  chatBox.appendChild(msgDiv);

  for (let i = 0; i < text.length; i++) {
    content.innerHTML = marked.parse(text.slice(0, i + 1));
    chatBox.scrollTop = chatBox.scrollHeight;
    await new Promise((res) => setTimeout(res, 10));
  }
}

// Generate session ID
function generateSessionId() {
  return `session-${Date.now()}`;
}

// Save session to localStorage
function saveSession(sessionId, messages) {
  let sessions = JSON.parse(localStorage.getItem("chatSessions") || "{}");
  sessions[sessionId] = {
    name: sessions[sessionId]?.name || "New Chat",
    messages,
  };
  localStorage.setItem("chatSessions", JSON.stringify(sessions));
  localStorage.setItem("activeSession", sessionId);
}

// Load all sessions
function loadAllSessions() {
  chatHistory.innerHTML = "";
  const sessions = JSON.parse(localStorage.getItem("chatSessions") || "{}");
  Object.entries(sessions).forEach(([id, session]) => {
    const li = document.createElement("li");
    li.textContent = session.name;
    li.onclick = () => loadSession(id);
    
    const renameBtn = document.createElement("button");
    renameBtn.textContent = "✏️";
    renameBtn.onclick = (e) => {
      e.stopPropagation();
      const newName = prompt("Rename chat:", session.name);
      if (newName) {
        session.name = newName;
        sessions[id] = session;
        localStorage.setItem("chatSessions", JSON.stringify(sessions));
        loadAllSessions();
      }
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm("Delete this chat?")) {
        delete sessions[id];
        localStorage.setItem("chatSessions", JSON.stringify(sessions));
        loadAllSessions();
        if (id === currentSessionId) {
          currentSessionId = generateSessionId();
          localStorage.setItem("activeSession", currentSessionId);
          chatBox.innerHTML = "";
        }
      }
    };

    li.appendChild(renameBtn);
    li.appendChild(deleteBtn);
    chatHistory.appendChild(li);
  });

  // Add "+ New Chat"
  const newChat = document.createElement("li");
  newChat.innerText = "+ New Chat";
  newChat.classList.add("new-chat-btn");
  newChat.onclick = () => {
    currentSessionId = generateSessionId();
    localStorage.setItem("activeSession", currentSessionId);
    chatBox.innerHTML = "";
    if (welcomeQuote) welcomeQuote.style.display = "block";
    saveSession(currentSessionId, []);
    loadAllSessions();
  };
  chatHistory.appendChild(newChat);
}

// Load chat history to UI
function loadSession(sessionId) {
  currentSessionId = sessionId;
  localStorage.setItem("activeSession", sessionId);
  chatBox.innerHTML = "";

  const sessions = JSON.parse(localStorage.getItem("chatSessions") || "{}");
  const messages = sessions[sessionId]?.messages || [];

  messages.forEach((msg) => {
    renderMessage(msg.role, msg.text);
  });
  if (welcomeQuote) welcomeQuote.style.display = "none";
}

// Message send
sendBtn.addEventListener("click", async () => {
  const message = input.value.trim();
  if (!message) return;

  if (welcomeQuote) welcomeQuote.style.display = "none";
  renderMessage("user", message);

  let sessions = JSON.parse(localStorage.getItem("chatSessions") || "{}");
  const session = sessions[currentSessionId] || { name: "New Chat", messages: [] };
  session.messages.push({ role: "user", text: message });
  sessions[currentSessionId] = session;
  localStorage.setItem("chatSessions", JSON.stringify(sessions));

  input.value = "";
  showTyping(true);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    showTyping(false);
    await renderTypingText(data.response);

    // Save bot reply
    session.messages.push({ role: "bot", text: data.response });
    sessions[currentSessionId] = session;
    localStorage.setItem("chatSessions", JSON.stringify(sessions));
  } catch (err) {
    showTyping(false);
    renderMessage("bot", `❌ ${err.message}`);
  }
});

// Support Enter to Send
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendBtn.click();
});

// Logout
logoutBtn.onclick = () => {
  localStorage.clear();
  window.location.href = "/login";
};

// Load sidebar chats
loadAllSessions();
loadSession(currentSessionId);
