import { useEffect, useState } from "react";
import API_URL from "../config/api";
const STORAGE_KEY = "ai_chat_messages";

export function useChatBox(resumeText = null) {
  const [messages, setMessages] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  const formatAIText = (text) => {
    if (!text) return [];

    return text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => {
        if (l.endsWith(":")) return `🔹 ${l}`;
        if (/^\d+\./.test(l)) return `• ${l}`;
        return l;
      });
  };

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const token = localStorage.getItem("token");

    setMessages((prev) => [
      ...prev,
      { role: "user", text: trimmed }
    ]);

    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({
          message: trimmed,
          user_id: localStorage.getItem("userId") ?? "",
          resume_text: resumeText ?? null
        })
      });

      const data = await res.json();

      let text = "";

      if (data.type === "resume_critique") {
        text =
          "Resume Critique:\n\n" +
          (data.feedback || []).map(f => `• ${f}`).join("\n");
      } else if (data.type === "web_search") {
        text = (data.results || [])
          .map(r => `${r.title}\n${r.snippet}\n${r.url}`)
          .join("\n\n");
      } else if (data.type === "resume_history") {
        text = (data.resumes || [])
          .map(r => `${r.name} (${r.updated})`)
          .join("\n");
      } else {
        text =
          typeof data.response === "string"
            ? data.response
            : JSON.stringify(data.response ?? "");
      }

      setMessages((prev) => [
        ...prev,
        { role: "ai", text }
      ]);

    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "Error: failed to reach backend"
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    messages,
    input,
    setInput,
    loading,
    sendMessage,
    clearChat,
    formatAIText
  };
}