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

/* ---------------- HELPERS ---------------- */

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

function normalizeSuggestions(changes = []) {
  return changes.map((item) => ({
    ...item,
    status: "pending",
  }));
}

function formatResumeSuggestions(data) {
  let text = `# Resume Review\n\n${data.summary}\n\n`;

  data.changes?.forEach((item, index) => {
    text += `## ${index + 1}. ${item.category}\n`;
    text += `**Before:** ${item.old_text}\n\n`;
    text += `**After:** ${item.new_text}\n\n`;
    text += `**Why:** ${item.reason}\n\n---\n\n`;
  });

  return text;
}

function formatResponse(data) {
  if (data.type === "resume_suggestions") {
    return formatResumeSuggestions(data);
  }

  return data.response || "No response";
}

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
    boxShadow: isUser
      ? "none"
      : "0 1px 4px rgba(0,0,0,0.04)",

    "& p": { margin: "6px 0" },
    "& ul, & ol": {
      margin: "6px 0",
      paddingLeft: "18px",
    },
    "& li": { margin: "2px 0" },
    "& h1, & h2, & h3": {
      margin: "8px 0 4px",
      fontSize: "1rem",
    },
    "& hr": {
      border: "none",
      borderTop: "1px solid #eee",
      margin: "10px 0",
    },
  };
}

async function sendChatRequest(message, resumeText) {
  const res = await fetch(`${API_URL}/chat/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      user_id: localStorage.getItem("userId") || "",
      resume_text: resumeText,
    }),
  });

  return await res.json();
}

/* ---------------- COMPONENT ---------------- */

export default function AIChat({
  resumeText = "",
  setSuggestions,
}) {
  const [messages, setMessages] = useState(loadMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const addMessage = (role, text) => {
    setMessages((prev) => [
      ...prev,
      createMessage(role, text),
    ]);
  };

  const clearChat = () => {
    setMessages([]);
    clearStoredMessages();
  };

  const handleSuggestions = (data) => {
    if (
      data.type === "resume_suggestions" &&
      typeof setSuggestions === "function"
    ) {
      setSuggestions(
        normalizeSuggestions(data.changes)
      );
    }
  };

  const sendMessage = async () => {
    const trimmed = input.trim();

    if (!trimmed || loading) return;

    setInput("");
    addMessage("user", trimmed);
    setLoading(true);

    try {
      const data = await sendChatRequest(
        trimmed,
        resumeText
      );

      handleSuggestions(data);

      addMessage("ai", formatResponse(data));
    } catch (error) {
      addMessage(
        "ai",
        "Error contacting server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        bgcolor: "#fafafa",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #eee",
          bgcolor: "#fff",
        }}
      >
        <Typography fontWeight={700}>
          AI Chat
        </Typography>

        <Button
          size="small"
          color="error"
          onClick={clearChat}
        >
          Clear
        </Button>
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        }}
      >
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: "flex",
              justifyContent:
                msg.role === "user"
                  ? "flex-end"
                  : "flex-start",
            }}
          >
            <Paper sx={getBubbleStyles(msg.role)}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
              >
                {msg.text}
              </ReactMarkdown>
            </Paper>
          </Box>
        ))}

        {loading && (
          <Typography
            variant="caption"
            sx={{ opacity: 0.6 }}
          >
            Thinking...
          </Typography>
        )}
      </Box>

      {/* Input */}
      <Box
        sx={{
          p: 2,
          display: "flex",
          gap: 1,
          borderTop: "1px solid #eee",
          bgcolor: "#fff",
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Ask something..."
          value={input}
          onChange={(e) =>
            setInput(e.target.value)
          }
          onKeyDown={(e) =>
            e.key === "Enter" && sendMessage()
          }
        />

        <IconButton
          onClick={sendMessage}
          disabled={!input.trim() || loading}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}