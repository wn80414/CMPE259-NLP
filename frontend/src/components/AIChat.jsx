import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Button,
  Typography,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import API_URL from "../config/api";

const STORAGE_KEY = "ai_chat_messages";

/* ---------------- STORAGE ---------------- */

function loadMessages() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveMessages(messages) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

function clearStoredMessages() {
  localStorage.removeItem(STORAGE_KEY);
}

function createMessage(role, text) {
  return { role, text };
}

/* ---------------- NORMALIZATION (CORE FIX) ---------------- */

function normalizeBackendResponse(data) {
  if (!data) {
    return { type: "error", response: "Empty response" };
  }

  if (data.type === "resume_engine") {
    return {
      type: "resume_engine",
      mode: data.mode,
      summary: data.data?.summary,      // ✅ FIX HERE
      changes: data.data?.changes || [], // ✅ FIX HERE
      meta: data.meta || {},
      response: null,
    };
  }

  if (data.type === "resume_suggestions") {
    return {
      type: "resume_engine",
      mode: "general",
      summary: data.summary,
      changes: data.changes || [],
      response: null,
    };
  }

  if (data.mode && data.changes) {
    return {
      type: "resume_engine",
      mode: data.mode,
      summary: data.summary,
      changes: data.changes,
      response: null,
    };
  }

  if (data.response) {
    return { type: "chat", response: data.response };
  }

  return { type: "chat", response: "Unsupported format" };
}

/* ---------------- FORMATTERS ---------------- */

function normalizeSuggestions(changes = []) {
  return changes.map((item) => ({
    ...item,
    status: "pending",
  }));
}

function formatResumeSuggestions(data) {
  let text = `# Resume Review (${data.mode || "general"})\n\n`;

  if (data.summary) {
    text += `## Summary\n${data.summary}\n\n`;
  }

  (data.changes || []).forEach((item, index) => {
    text += `### ${index + 1}. ${item.category || "improvement"}\n`;
    text += `**Before:** ${item.old_text}\n\n`;
    text += `**After:** ${item.new_text}\n\n`;
    text += `**Why:** ${item.reason}\n\n---\n\n`;
  });

  return text;
}

function formatResponse(data) {
  const normalized = normalizeBackendResponse(data);

  if (normalized.type === "resume_engine") {
    return formatResumeSuggestions(normalized);
  }

  return normalized.response || "No response";
}

/* ---------------- UI STYLES ---------------- */

function getBubbleStyles(role) {
  const isUser = role === "user";

  return {
    p: 1.5,
    maxWidth: "78%",
    borderRadius: 3,
    fontSize: 14,
    lineHeight: 1.65,
    bgcolor: isUser ? "#111" : "#fff",
    color: isUser ? "#fff" : "#111",
    border: isUser ? "none" : "1px solid #eee",
    boxShadow: isUser ? "none" : "0 1px 4px rgba(0,0,0,0.04)",

    "& p": { margin: "6px 0" },
    "& ul, & ol": { margin: "6px 0", paddingLeft: "18px" },
    "& li": { margin: "2px 0" },
    "& h1, & h2, & h3": { margin: "8px 0 4px", fontSize: "1rem" },
    "& hr": { border: "none", borderTop: "1px solid #eee", margin: "10px 0" },
  };
}

/* ---------------- API CALL ---------------- */

async function sendChatRequest(message, resumeJson) {
  const resumeId = localStorage.getItem("resume_id");

  const res = await fetch(`${API_URL}/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify({
      message,
      user_id: localStorage.getItem("userId") || "",
      resume_id: resumeId || "",
      resume_json: resumeJson,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.detail || "Chat request failed");
  }
  return await res.json();
}

/* ---------------- COMPONENT ---------------- */

export default function AIChat({ resume = "", setSuggestions }) {
  const [messages, setMessages] = useState(loadMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const addMessage = (role, text) => {
    setMessages((prev) => [...prev, createMessage(role, text)]);
  };

  const clearChat = () => {
    setMessages([]);
    clearStoredMessages();
  };

  const handleSuggestions = (data) => {
    const normalized = normalizeBackendResponse(data);

    if (
      normalized.type === "resume_engine" &&
      Array.isArray(normalized.changes) &&
      typeof setSuggestions === "function"
    ) {
      setSuggestions(normalizeSuggestions(normalized.changes));
    }
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setInput("");
    addMessage("user", trimmed);
    setLoading(true);

    try {
      const data = await sendChatRequest(trimmed, resume);
      console.log("🔵 RAW BACKEND RESPONSE:", data);
      handleSuggestions(data);

      const formatted = formatResponse(data);
      addMessage("ai", formatted);
    } catch (error) {
      addMessage("ai", "Error contacting server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "#fafafa" }}>
      
      {/* Header */}
      <Box sx={{ p: 1.5, display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eee", bgcolor: "#fff" }}>
        <Typography fontWeight={700}>AI Chat</Typography>
        <Button size="small" color="error" onClick={clearChat}>
          Clear
        </Button>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <Paper sx={getBubbleStyles(msg.role)}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.text}
              </ReactMarkdown>
            </Paper>
          </Box>
        ))}

        {loading && (
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
            Thinking...
          </Typography>
        )}
      </Box>

      {/* Input */}
      <Box sx={{ p: 2, display: "flex", gap: 1, borderTop: "1px solid #eee", bgcolor: "#fff" }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Ask something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <IconButton onClick={sendMessage} disabled={!input.trim() || loading}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}