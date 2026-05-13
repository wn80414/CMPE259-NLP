import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Button,
  Typography,
  Divider,
  Chip,
  Grid,
  Stack,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import API_URL from "../config/api";

const STORAGE_KEY = "ai_chat_messages";

// ---------------- STORAGE ---------------- //
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

// ---------------- NORMALIZATION ---------------- //
function normalizeBackendResponse(data) {
  if (!data) return { type: "error", response: "Empty response" };

  if (data.mode && data.changes !== undefined) {
    return {
      type: "resume_engine",
      mode: data.mode,
      summary: data.summary || "",
      changes: data.changes,
      suggestions: data.suggestions || [],
      meta: data.meta || {},
      response: null,
    };
  }

  if (data.response) {
    return { type: "chat", response: data.response };
  }

  return { type: "chat", response: "Unsupported format" };
}

// ---------------- API CALL ---------------- //
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

// ---------------- PATH HELPER ---------------- //
function setValueAtPath(obj, path, newValue) {
  const keys = path.split(".");
  if (keys.length === 0) return newValue;
  const [first, ...rest] = keys;

  if (Array.isArray(obj)) {
    const copy = [...obj];
    const index = parseInt(first);
    copy[index] = rest.length === 0
      ? newValue
      : setValueAtPath(copy[index], rest.join("."), newValue);
    return copy;
  } else if (obj && typeof obj === "object") {
    // When we're about to set the final value, check if the property is an array
    if (rest.length === 0) {
      const currentValue = obj[first];
      // If target is an array and newValue is a string, split it
      if (Array.isArray(currentValue) && typeof newValue === 'string') {
        newValue = newValue.split(',').map(s => s.trim());
      }
      return { ...obj, [first]: newValue };
    }
    return {
      ...obj,
      [first]: rest.length === 0 ? newValue : setValueAtPath(obj[first], rest.join("."), newValue),
    };
  }
  return obj;
}
// ---------------- COMPONENT ---------------- //
export default function AIChat({ resume, setResume, setSuggestions }) {
  const [messages, setMessages] = useState(loadMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const addMessage = (role, text, changes = [], suggestions = [], summary = "", mode = "") => {
    const msg = {
      role,
      text,
      changes: changes.map((c, i) => ({ ...c, _idx: i })), // only these have Accept/Reject
      suggestions, // informational only
      summary,
      mode,
    };
    setMessages((prev) => [...prev, msg]);
  };

  const clearChat = () => {
    setMessages([]);
    clearStoredMessages();
  };

  const handleAcceptChange = (change, msgIndex) => {
    if (!setResume) return;
    console.log(" Accepting change with path:", change._path);

    const { _path, new_text } = change;
    if (!_path || !new_text) return;

    setResume((prev) => setValueAtPath(prev, _path, new_text));

    setMessages((prev) =>
      prev.map((msg, idx) => {
        if (idx !== msgIndex) return msg;
        const remaining = (msg.changes || []).filter((_, i) => i !== change._idx);
        return { ...msg, changes: remaining };
      })
    );

    if (setSuggestions) {
      setSuggestions((prev) => prev.filter((_, i) => i !== change._idx));
    }
  };

  const handleRejectChange = (change, msgIndex) => {
    setMessages((prev) =>
      prev.map((msg, idx) => {
        if (idx !== msgIndex) return msg;
        const remaining = (msg.changes || []).filter((_, i) => i !== change._idx);
        return { ...msg, changes: remaining };
      })
    );
    if (setSuggestions) {
      setSuggestions((prev) => prev.filter((_, i) => i !== change._idx));
    }
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setInput("");
    addMessage("user", trimmed);
    setLoading(true);

    try {
      const raw = await sendChatRequest(trimmed, resume);
      console.log("AI CHAT RESPONSE:", raw);

      const normalized = normalizeBackendResponse(raw);

      if (normalized.type === "resume_engine") {
        // Actionable changes (with path)
        const indexedChanges = (normalized.changes || []).map((c, i) => ({
          ...c,
          _idx: i,
          _path: c.path || null,
        }));

        // Informational suggestions (no Accept/Reject)
        const infoSuggestions = normalized.suggestions || [];

        addMessage(
          "ai",
          "",
          indexedChanges,
          infoSuggestions,
          normalized.summary || "",
          normalized.mode || ""
        );
        if (setSuggestions) setSuggestions(indexedChanges);
      } else {
        addMessage("ai", normalized.response || "", [], [], "", "chat");
      }
    } catch (error) {
      addMessage("ai", "Error connecting to server.", [], [], "", "");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "#fafafa" }}>
      {/* Header */}
      <Box sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1, borderBottom: "1px solid #eee", bgcolor: "#fff" }}>
        <Typography fontWeight={700}>AI Suggestions</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" color="error" onClick={clearChat}>Clear</Button>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        {messages.map((msg, msgIndex) => (
          <Box
            key={msgIndex}
            sx={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {/* User message */}
            {msg.role === "user" && msg.text && (
              <Paper sx={{ p: 1.5, maxWidth: "78%", borderRadius: 3, bgcolor: "#111", color: "#fff", fontSize: 14 }}>
                <Typography variant="body2">{msg.text}</Typography>
              </Paper>
            )}

            {/* AI message */}
            {msg.role === "ai" && (
              <Paper sx={{ p: 2, maxWidth: "90%", borderRadius: 3, bgcolor: "#fff", border: "1px solid #eee" }}>
                {msg.summary && (
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 1 }}>{msg.summary}</Typography>
                )}
                {msg.mode && (
                  <Chip label={msg.mode} size="small" color="primary" variant="outlined" sx={{ mb: 1 }} />
                )}

                {/* ACTIONABLE CHANGES (with Accept/Reject) */}
                {msg.changes && msg.changes.length > 0 && (
                  <>
                    <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
                      Suggested Edits
                    </Typography>
                    <Stack spacing={2} divider={<Divider />}>
                      {msg.changes.map((change, idx) => (
                        <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                            <Typography variant="subtitle2" fontWeight="600">
                              {change.category || "Improvement"}
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Chip
                                label="Accept"
                                color="success"
                                size="small"
                                disabled={!change._path}
                                onClick={() => handleAcceptChange(change, msgIndex)}
                              />
                              <Chip
                                label="Reject"
                                color="default"
                                size="small"
                                onClick={() => handleRejectChange(change, msgIndex)}
                              />
                            </Box>
                          </Box>

                          {change._path && (
                            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block", fontFamily: "monospace", fontSize: 11 }}>
                              📍 {change._path}
                            </Typography>
                          )}

                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Before</Typography>
                              <Paper variant="outlined" sx={{ p: 1, bgcolor: "#f9f9f9", fontSize: 13, mt: 0.5 }}>
                                {change.old_text || "(empty)"}
                              </Paper>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">After</Typography>
                              <Paper variant="outlined" sx={{ p: 1, bgcolor: "#e8f5e9", fontSize: 13, mt: 0.5 }}>
                                {change.new_text || "(empty)"}
                              </Paper>
                            </Grid>
                          </Grid>

                          {change.reason && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
                              Why: {change.reason}
                            </Typography>
                          )}

                          {!change._path && (
                            <Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                              ⚠️ Could not locate this text in the resume.
                            </Typography>
                          )}
                        </Paper>
                      ))}
                    </Stack>
                  </>
                )}

                {/* INFORMATIONAL SUGGESTIONS (no Accept/Reject) */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
                      {msg.mode === "ats" ? "Skills & Buzzwords to Add" : "Feedback & Suggestions"}
                    </Typography>
                    <Stack spacing={1}>
                      {msg.suggestions.map((s, idx) => (
                        <Paper key={idx} variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: "#f5f5f5" }}>
                          <Typography variant="body2">
                            {s.suggestion || s.new_text || s.reason}
                          </Typography>
                          {s.reason && s.reason !== s.suggestion && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                              {s.reason}
                            </Typography>
                          )}
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Fallback raw text */}
                {(!msg.changes || msg.changes.length === 0) &&
                 (!msg.suggestions || msg.suggestions.length === 0) &&
                 msg.text && (
                  <Typography variant="body2">{msg.text}</Typography>
                )}
              </Paper>
            )}
          </Box>
        ))}

        {loading && <Typography variant="caption" sx={{ opacity: 0.6 }}>Thinking...</Typography>}
      </Box>

      {/* Input */}
      <Box sx={{ p: 2, display: "flex", gap: 1, borderTop: "1px solid #eee", bgcolor: "#fff" }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Ask for improvements..."
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