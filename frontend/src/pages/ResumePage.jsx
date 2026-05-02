import { useState } from "react";
import { Box } from "@mui/material";

import PageNavBar from "../components/PageNavBar";
import ResumeEditor from "../components/ResumeEditor";
import AIChat from "../components/AIChat";

export default function ResumePage() {
  const [chatOpen, setChatOpen] = useState(true);
  const [editor, setEditor] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "#f8fafc",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* NAVBAR */}
      <Box
        sx={{
          bgcolor: "white",
          borderBottom: "1px solid #e2e8f0",
          zIndex: 10,
        }}
      >
        <PageNavBar
          chatOpen={chatOpen}
          setChatOpen={setChatOpen}
          editor={editor}
        />
      </Box>

      {/* MAIN */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        {/* EDITOR */}
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            overflow: "hidden",
            bgcolor: "white",
          }}
        >
          <ResumeEditor
            onEditorReady={setEditor}
            onTextChange={setResumeText}
            suggestions={suggestions}
            setSuggestions={setSuggestions}
          />
        </Box>

        {/* CHAT */}
        {chatOpen && (
          <Box
            sx={{
              width: { xs: "100%", sm: 380, md: 400 },
              borderLeft: "1px solid #e2e8f0",
              bgcolor: "white",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              overflow: "hidden",
              boxShadow: "-4px 0 24px rgba(0,0,0,0.02)",
              zIndex: 5,
            }}
          >
            <AIChat
              resumeText={resumeText}
              setSuggestions={setSuggestions}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}