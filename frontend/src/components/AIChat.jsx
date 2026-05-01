import { useState } from "react";

export default function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input) return;

    const userMsg = { role: "user", text: input };

    setMessages((prev) => [...prev, userMsg]);

    const res = await fetch("http://localhost:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input }),
    });

    const data = await res.json();

    const aiMsg = { role: "ai", text: data.response };

    setMessages((prev) => [...prev, aiMsg]);
    setInput("");
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
                : "text-left text-gray-800"
            }
          >
            {m.text}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-2">
        <input
          className="border flex-1 px-2"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask for resume feedback..."
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