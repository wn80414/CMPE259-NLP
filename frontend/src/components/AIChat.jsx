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
  Tooltip,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import API_URL from "../config/api";
import PushPinIcon from "@mui/icons-material/PushPin";

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

  if (data.type === "general_chat") {
    return {
      type: "chat",
      response: data.message || "",
    };
  }

  if (data.type === "error") {
    return {
      type: "error",
      response: data.message || "Something went wrong. Please try again.",
    };
  }

  if (data.response) {
    return { type: "chat", response: data.response };
  }

  return { type: "error", response: "Unsupported format from server." };
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

// ---------------- PATH HELPERS ---------------- //
function setValueAtPath(obj, path, newValue) {
  const keys = path.split(".");
  if (keys.length === 0) return newValue;
  const [first, ...rest] = keys;

  if (Array.isArray(obj)) {
    const copy = [...obj];
    const index = parseInt(first);
    copy[index] =
      rest.length === 0
        ? newValue
        : setValueAtPath(copy[index], rest.join("."), newValue);
    return copy;
  } else if (obj && typeof obj === "object") {
    if (rest.length === 0) {
      const currentValue = obj[first];
      if (Array.isArray(currentValue) && typeof newValue === "string") {
        newValue = newValue.split(",").map((s) => s.trim());
      }
      return { ...obj, [first]: newValue };
    }
    return {
      ...obj,
      [first]:
        rest.length === 0
          ? newValue
          : setValueAtPath(obj[first], rest.join("."), newValue),
    };
  }
  return obj;
}

/**
 * Converts a dotted path like "experience.2.bullets.0" to a user‑friendly label.
 */
function friendlyPath(path, resume) {
  if (!path || !resume) return "Unknown field";
  const keys = path.split(".");
  let node = resume;
  const labels = [];

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (node === null || node === undefined) break;

    const isArrayIndex = /^\d+$/.test(key);
    if (isArrayIndex) {
      const index = parseInt(key) + 1;
      const parentKey = keys[i - 1] || "";
      let arrayName = parentKey
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .trim();
      if (!arrayName) arrayName = "Item";
      labels.push(`${arrayName} #${index}`);
      node = node[key];
    } else {
      let friendlyKey = key
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .trim();
      friendlyKey = friendlyKey.charAt(0).toUpperCase() + friendlyKey.slice(1);
      labels.push(friendlyKey);
      node = node[key];
    }
  }

  return labels.join(" → ") || path;
}

// ---------------- COMPONENT ---------------- //
export default function AIChat({ resume, setResume, setSuggestions, onScrollToPath }) {
  const [messages, setMessages] = useState(loadMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (!setSuggestions) return;
    const allChanges = messages
      .filter((msg) => msg.role === "ai" && msg.changes?.length > 0)
      .flatMap((msg) => msg.changes);
    setSuggestions(allChanges);
  }, [messages, setSuggestions]);

  const addMessage = (
    role,
    text,
    changes = [],
    suggestions = [],
    summary = "",
    mode = "",
    type = "chat"
  ) => {
    const msg = {
      role,
      text,
      changes: changes.map((c, i) => ({ ...c, _idx: i })),
      suggestions,
      summary,
      mode,
      type,
    };
    setMessages((prev) => [...prev, msg]);
  };

  const clearChat = () => {
    setMessages([]);
    clearStoredMessages();
    if (setSuggestions) setSuggestions([]);
  };

  const handleAcceptChange = (change, msgIndex, changeIndex) => {
    if (!setResume) return;
    const { _path, new_text } = change;
    if (!_path || !new_text) return;

    setResume((prev) => setValueAtPath(prev, _path, new_text));

    setMessages((prev) =>
      prev.map((msg, idx) => {
        if (idx !== msgIndex) return msg;
        const remaining = (msg.changes || []).filter((_, i) => i !== changeIndex);
        return { ...msg, changes: remaining };
      })
    );
  };

  const handleRejectChange = (change, msgIndex, changeIndex) => {
    setMessages((prev) =>
      prev.map((msg, idx) => {
        if (idx !== msgIndex) return msg;
        const remaining = (msg.changes || []).filter((_, i) => i !== changeIndex);
        return { ...msg, changes: remaining };
      })
    );
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
      // Filter out changes that have no path (text not found in resume)
      const validChanges = (normalized.changes || []).filter((c) => c.path);
      const indexedChanges = validChanges.map((c, i) => ({
        ...c,
        _idx: i,
        _path: c.path,
      }));
      const infoSuggestions = normalized.suggestions || [];

      if (indexedChanges.length === 0 && infoSuggestions.length === 0 && !normalized.summary) {
        // Nothing actionable – show a simple message
        addMessage("ai", "No suggestions.", [], [], "", "", "chat");
      } else {
        addMessage(
          "ai",
          "",
          indexedChanges,
          infoSuggestions,
          normalized.summary || "",
          normalized.mode || ""
        );
      }
    } else if (normalized.type === "error") {
      addMessage("ai", normalized.response, [], [], "", "", "error");
    } else {
      addMessage("ai", normalized.response, [], [], "", "", "chat");
    }
  } catch (error) {
    addMessage("ai", "Error connecting to server.", [], [], "", "", "error");
  } finally {
    setLoading(false);
  }
};

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", bgcolor: "#fafafa" }}>
      {/* Header */}
      <Box
        sx={{
          p: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1,
          borderBottom: "1px solid #eee",
          bgcolor: "#fff",
        }}
      >
        <Typography fontWeight={700}>AI Suggestions</Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Button size="small" color="error" onClick={clearChat}>
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
          gap: 2,
        }}
      >
        {/* Empty state placeholder */}
        {messages.length === 0 && (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.6,
              textAlign: "center",
              px: 4,
              py: 2,
            }}
          >
            <Typography variant="body2" fontWeight="500" sx={{ mb: 1 }}>
              Ask me anything about your resume!
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5 }}>
              Try these example queries:
            </Typography>
            <Stack spacing={0.5} sx={{ maxWidth: 400 }}>
              <Typography variant="caption">
                • "Critique my current resume."
              </Typography>
              <Typography variant="caption">
                • "Make my resume more ATS‑friendly"
              </Typography>
              <Typography variant="caption">
                • "Rewrite my resume for a Software Engineering Role"
              </Typography>
              <Typography variant="caption">
                • "Add skills for a Software Engineer"
              </Typography>
            </Stack>
          </Box>
        )}

        {/* Message list */}
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
              <Paper
                sx={{
                  p: 1.5,
                  maxWidth: "78%",
                  borderRadius: 3,
                  bgcolor: "#111",
                  color: "#fff",
                  fontSize: 14,
                }}
              >
                <Typography variant="body2">{msg.text}</Typography>
              </Paper>
            )}

            {/* AI message */}
            {msg.role === "ai" && (
              <Paper
                sx={{
                  p: 2,
                  maxWidth: "90%",
                  borderRadius: 3,
                  bgcolor: "#fff",
                  border: "1px solid #eee",
                }}
              >
                {msg.summary && (
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: "pre-wrap", mb: 1 }}
                  >
                    {msg.summary}
                  </Typography>
                )}
                {msg.mode && (
                  <Chip
                    label={msg.mode}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                )}

                {/* ACTIONABLE CHANGES */}
                {msg.changes && msg.changes.length > 0 && (
                  <>
                    <Typography
                      variant="subtitle2"
                      fontWeight="600"
                      sx={{ mb: 1 }}
                    >
                      Suggested Edits
                    </Typography>
                    <Stack spacing={2} divider={<Divider />}>
                      {msg.changes.map((change, idx) => (
                        <Paper
                          key={idx}
                          variant="outlined"
                          sx={{ p: 2, borderRadius: 2 }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 1,
                            }}
                          >
                            <Typography variant="subtitle2" fontWeight="600">
                              {change.category || "Improvement"}
                            </Typography>
                            <Box sx={{ display: "flex", gap: 1 }}>
                              <Chip
                                label="Accept"
                                color="success"
                                size="small"
                                disabled={!change._path}
                                onClick={() =>
                                  handleAcceptChange(change, msgIndex, idx)
                                }
                              />
                              <Chip
                                label="Reject"
                                color="default"
                                size="small"
                                onClick={() =>
                                  handleRejectChange(change, msgIndex, idx)
                                }
                              />
                            </Box>
                          </Box>

                          {/* Human‑friendly path with pin button */}
                          <Box sx={{ display: "flex", alignItems: "center", mb: 1, gap: 0.5 }}>
                            <Tooltip title={change._path || ""} arrow>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ fontSize: 12, cursor: "help", flex: 1 }}
                              >
                                {friendlyPath(change._path, resume)}
                              </Typography>
                            </Tooltip>

                            {onScrollToPath && change._path && (
                              <Tooltip title="Scroll to this section" arrow>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    const parts = change._path.split('.');
                                    const sectionPath = parts.slice(0, 2).join('.');
                                    onScrollToPath(sectionPath);
                                  }}
                                  sx={{ p: 0.3 }}
                                >
                                  <PushPinIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>

                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                Before
                              </Typography>
                              <Paper
                                variant="outlined"
                                sx={{
                                  p: 1,
                                  bgcolor: "#f9f9f9",
                                  fontSize: 13,
                                  mt: 0.5,
                                }}
                              >
                                {change.old_text || "(empty)"}
                              </Paper>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">
                                After
                              </Typography>
                              <Paper
                                variant="outlined"
                                sx={{
                                  p: 1,
                                  bgcolor: "#e8f5e9",
                                  fontSize: 13,
                                  mt: 0.5,
                                }}
                              >
                                {change.new_text || "(empty)"}
                              </Paper>
                            </Grid>
                          </Grid>

                          {change.reason && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mt: 1, display: "block" }}
                            >
                              Why: {change.reason}
                            </Typography>
                          )}

                          {!change._path && (
                            <Typography
                              variant="caption"
                              color="error"
                              sx={{ mt: 1, display: "block" }}
                            >
                              ⚠️ Could not locate text. Please recompile Vector
                              Store.
                            </Typography>
                          )}
                        </Paper>
                      ))}
                    </Stack>
                  </>
                )}

                {/* INFORMATIONAL SUGGESTIONS */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
                      {msg.mode === "ats"
                        ? "Skills & Buzzwords to Add"
                        : "Feedback & Suggestions"}
                    </Typography>
                    <Stack spacing={1}>
                      {msg.suggestions.map((s, idx) => (
                        <Paper
                          key={idx}
                          variant="outlined"
                          sx={{ p: 1.5, borderRadius: 2, bgcolor: "#f5f5f5" }}
                        >
                          <Typography variant="body2">
                            {s.suggestion || s.new_text || s.reason}
                          </Typography>
                          {s.reason && s.reason !== s.suggestion && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ mt: 0.5, display: "block" }}
                            >
                              {s.reason}
                            </Typography>
                          )}
                        </Paper>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Fallback raw text (chat / error messages) */}
                {(!msg.changes || msg.changes.length === 0) &&
                  (!msg.suggestions || msg.suggestions.length === 0) &&
                  msg.text && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: msg.type === "error" ? "error.main" : "text.primary",
                        fontStyle: msg.type === "error" ? "italic" : "normal",
                      }}
                    >
                      {msg.text}
                    </Typography>
                  )}
              </Paper>
            )}
          </Box>
        ))}

        {loading && (
          <Typography variant="caption" sx={{ opacity: 0.6 }}>
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