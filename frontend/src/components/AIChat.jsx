import { useState } from "react";

export default function AIChat({ resumeText = null }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    // user message
    setMessages((prev) => [
      ...prev,
      { role: "user", text: trimmed }
    ]);

    setInput("");
    setLoading(true);
    const payload = {
      message: input?.trim() || "",
      user_id: localStorage.getItem("userId") ?? "",
      resume_text: resumeText ?? null
    };

    console.log("CHAT PAYLOAD:", payload);
    try {
      const res = await fetch("http://127.0.0.1:8000/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      console.log("CHAT RESPONSE:", data);

      let text = "";

      // ---------------- RESUME CRITIQUE ----------------
      if (data.type === "resume_critique") {
        text = "📄 Resume Critique\n\n";

        if (data.data?.name) {
          text += `Name: ${data.data.name}\n\n`;
        }

        if (data.feedback?.length) {
          text += "Suggestions:\n";
          text += data.feedback.map(f => `• ${f}`).join("\n");
        } else {
          text += "No feedback returned.";
        }
      }

      // ---------------- WEB SEARCH ----------------
      else if (data.type === "web_search") {
        text =
          "🌐 Web Results:\n\n" +
          (data.results || [])
            .map(r => `${r.title}\n${r.snippet}\n${r.url}`)
            .join("\n\n");
      }

      // ---------------- HISTORY ----------------
      else if (data.type === "resume_history") {
        text =
          "📚 Resume History:\n\n" +
          (data.resumes || [])
            .map(r => `${r.name} (${r.updated})`)
            .join("\n");
      }

      // ---------------- GENERAL ----------------
      else {
        text = data.response || "No response returned.";
      }

      setMessages((prev) => [
        ...prev,
        { role: "ai", text }
      ]);

    } catch (err) {
      console.error(err);

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

  return (
    <div className="flex flex-col h-full p-3">

      {/* Messages */}
      <div className="flex-1 overflow-auto space-y-2">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === "user"
                ? "text-right text-blue-600"
                : "text-left text-gray-800 whitespace-pre-wrap"
            }
          >
            {m.text}
          </div>
        ))}

        {loading && (
          <div className="text-left text-gray-500">
            Thinking...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-2">
        <input
          className="border flex-1 px-2 py-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your resume..."
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />

        <button
          onClick={sendMessage}
          className="bg-black text-white px-3 py-1"
        >
          Send
        </button>
      </div>
    </div>
  );
}