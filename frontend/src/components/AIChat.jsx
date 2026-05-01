import { useEffect, useState } from "react";
import { Box, Paper, TextField, IconButton, Button } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const STORAGE_KEY = "ai_chat_messages";

export default function AIChat({ resumeText = null }) {
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // persist messages whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const msg = input;
    setInput("");

    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/chat/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msg,
          user_id: localStorage.getItem("userId"),
          resume_text: resumeText,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: data.response || "No response",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Error contacting server" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: 1,
          borderBottom: "1px solid #eee",
        }}
      >
        <Box sx={{ fontWeight: 600 }}>AI Chat</Box>

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
        {messages.map((m, i) => (
          <Box
            key={i}
            sx={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <Paper
              sx={{
                p: 1.5,
                maxWidth: "70%",
                bgcolor: m.role === "user" ? "black" : "white",
                color: m.role === "user" ? "white" : "black",
                borderRadius: 3,
                fontSize: 14,
                lineHeight: 1.6,

                "& p": { margin: "4px 0" },
                "& ul, & ol": { margin: "4px 0", paddingLeft: "18px" },
                "& li": { margin: "2px 0" },
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {m.text}
              </ReactMarkdown>
            </Paper>
          </Box>
        ))}

        {loading && (
          <Box sx={{ opacity: 0.6, fontSize: 12 }}>
            Thinking...
          </Box>
        )}
      </Box>

      {/* Input */}
      <Box sx={{ p: 2, display: "flex", gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask something..."
        />

        <IconButton onClick={sendMessage}>
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
}